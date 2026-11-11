import { useState } from "react";
import { z } from "zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { useServerNow } from "@/shared/clock/useServerNow";
import { todayInVietnam } from "@/entities/handoverDocument";
import { deathCaseService } from "../api/deathCaseService";
import type { DeathCase, deathDraftSchema } from "./deathCase.schema";
import {
  CERTIFICATE_INFO_SERVER_FIELDS,
  missingCertificateInfo,
  validateCertificateInfo,
  type CertificateInfoErrors,
  type CertificateInfoField,
  type CertificateInfoValues,
} from "./certificateInfo";

type DraftBody = z.infer<typeof deathDraftSchema>;

interface EditState {
  /** Hồ sơ và bản đang sửa; sang bản khác (bổ sung) thì bỏ các chỗ sửa dở. */
  scope: string;
  edits: Partial<CertificateInfoValues>;
}

const FIELDS: CertificateInfoField[] = ["dateOfDeath", "issuedOn", "provinceCode", "wardCode"];

/** Giá trị Backend đang giữ cho bản hiện tại của hồ sơ. */
export function serverCertificateInfo(record: DeathCase): CertificateInfoValues {
  const version = record.currentVersion;
  return {
    dateOfDeath: version.dateOfDeath ?? "",
    issuedOn: version.issuedOn ?? "",
    provinceCode: version.deathRegistrationProvinceCode ?? "",
    wardCode: version.deathRegistrationWardCode ?? "",
  };
}

/**
 * Trạng thái form "Thông tin trên giấy": giá trị đang sửa (chồng lên giá trị Backend giữ), lỗi, và lưu bản nháp bằng
 * PUT .../draft (có etag) khi rời ô ngày, khi chọn tỉnh/phường hoặc khi bấm nút lưu.
 * Chỉ gửi trường đã đổi và hợp lệ; ngày đã xóa trống thì không gửi (Backend không có cách xóa ngày, ô báo thiếu và chặn nộp).
 * Đổi tỉnh thì phường bị xóa ở máy và ở Backend.
 */
export function useCertificateInfoForm(record: DeathCase, onSaved: (result: DeathCase) => void) {
  const action = usePrivateAction();
  const today = todayInVietnam(useServerNow());
  const server = serverCertificateInfo(record);
  const scope = `${record.id}:${record.currentVersion.versionNo}`;
  const [state, setState] = useState<EditState>({ scope, edits: {} });
  const edits = state.scope === scope ? state.edits : {};
  const values: CertificateInfoValues = { ...server, ...edits };

  const localErrors = validateCertificateInfo(values, today);
  const missing = missingCertificateInfo(values);
  const dirty = FIELDS.some((field) => values[field] !== server[field]);

  // Lỗi 400 của Backend gắn đúng ô theo tên trường; lỗi kiểm ở máy hiện ngay.
  const errors: CertificateInfoErrors = { ...localErrors };
  for (const field of FIELDS) {
    const fromServer = action.fieldErrors[CERTIFICATE_INFO_SERVER_FIELDS[field]];
    if (fromServer && fromServer.length > 0 && !errors[field]) errors[field] = fromServer[0];
  }

  const change = (patch: Partial<CertificateInfoValues>) => {
    action.reset();
    setState({ scope, edits: { ...edits, ...patch } });
  };

  /** Lưu các chỗ đã đổi. patch là chỗ vừa sửa mà state chưa kịp cập nhật (chọn tỉnh/phường lưu ngay). */
  const save = async (patch: Partial<CertificateInfoValues> = {}): Promise<void> => {
    const next: CertificateInfoValues = { ...values, ...patch };
    if (Object.keys(validateCertificateInfo(next, today)).length > 0) return;
    const body: DraftBody = { etag: record.etag };
    if (next.dateOfDeath && next.dateOfDeath !== server.dateOfDeath) {
      body.dateOfDeath = next.dateOfDeath;
    }
    if (next.issuedOn && next.issuedOn !== server.issuedOn) body.issuedOn = next.issuedOn;
    if (next.provinceCode !== server.provinceCode) {
      body.deathRegistrationProvinceCode = next.provinceCode;
      body.deathRegistrationWardCode = next.wardCode;
    } else if (next.wardCode !== server.wardCode) {
      body.deathRegistrationWardCode = next.wardCode;
    }
    if (Object.keys(body).length === 1) return;
    await action.execute(
      () => deathCaseService.update(record.id, body),
      (result) => {
        const saved = serverCertificateInfo(result);
        // Giữ lại những chỗ sửa dở mà lần lưu này chưa mang theo.
        const remaining: Partial<CertificateInfoValues> = {};
        for (const field of FIELDS) {
          if (next[field] !== saved[field]) remaining[field] = next[field];
        }
        setState({ scope, edits: remaining });
        onSaved(result);
      },
    );
  };

  return {
    values,
    server,
    errors,
    hasLocalErrors: Object.keys(localErrors).length > 0,
    missing,
    dirty,
    today,
    saving: action.pending,
    saveError: action.error,
    setDate: (field: "dateOfDeath" | "issuedOn", value: string) => change({ [field]: value }),
    /** Rời ô ngày: lưu nếu đổi và hợp lệ. */
    commit: () => save(),
    setProvince: (code: string) => {
      change({ provinceCode: code, wardCode: "" });
      return save({ provinceCode: code, wardCode: "" });
    },
    setWard: (code: string) => {
      change({ wardCode: code });
      return save({ wardCode: code });
    },
    save,
  };
}
