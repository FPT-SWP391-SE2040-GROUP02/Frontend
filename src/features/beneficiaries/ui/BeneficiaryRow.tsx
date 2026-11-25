import { useId, useState } from "react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { cn } from "cn";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { beneficiaryService } from "../api/beneficiaryService";
import type { beneficiaryResponseSchema } from "../model/beneficiary.schema";
import { BeneficiaryForm } from "./BeneficiaryForm";

type Beneficiary = z.infer<typeof beneficiaryResponseSchema>;

const DIALOG_CLASS = "max-w-lg bg-heritage-surface p-7";
const DIALOG_TITLE = "text-xl font-semibold text-heritage-primary";
const RED_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-heritage-danger px-6 text-sm font-semibold text-white transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50";

/** "1990-05-12" → "12/05/1990". */
function formatBirthDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/** Tên các tài sản đang gán cho người nhận; tài sản không tra được tên thì ghi chung. */
function listAssetNames(assetIds: string[], assetNames: Record<string, string>): string[] {
  const names: string[] = [];
  for (const id of assetIds) {
    if (Object.hasOwn(assetNames, id)) {
      names.push(assetNames[id]);
    } else {
      names.push("Tài sản khác");
    }
  }
  return names;
}

/** Hộp thoại sửa hồ sơ; dùng cả ở hàng và khi mở lại hồ sơ đã có từ form thêm. */
export function EditBeneficiaryDialog({
  vaultId,
  record,
  onClose,
}: {
  vaultId: string;
  record: Beneficiary;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${DIALOG_CLASS} max-h-[90dvh] overflow-y-auto`}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE}>Sửa người nhận</DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Thay đổi áp dụng cho các tài sản đã gán người này. Muốn đổi số CCCD thì xóa hồ sơ rồi
            tạo lại.
          </DialogDescription>
        </DialogHeader>
        <BeneficiaryForm vaultId={vaultId} record={record} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}

/** Hộp thoại xóa; hồ sơ còn được gán tài sản thì không cho xóa (Backend cũng chặn). */
function DeleteBeneficiaryDialog({
  vaultId,
  record,
  assetNames,
  onClose,
}: {
  vaultId: string;
  record: Beneficiary;
  assetNames: Record<string, string>;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const client = useQueryClient();
  const [understood, setUnderstood] = useState(false);
  const hintId = useId();
  const blocked = record.assetIds.length > 0;
  if (blocked) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE}>Không xóa được người nhận</DialogTitle>
            <DialogDescription className="text-heritage-muted">
              {record.fullName} đang được gán tài sản nên hệ thống giữ lại.
            </DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-heritage-border">
            {listAssetNames(record.assetIds, assetNames).map((name, index) => (
              <li key={`${name}-${index}`} className="py-3 text-sm font-semibold">
                {name}
              </li>
            ))}
          </ul>
          <p
            role="alert"
            className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
          >
            {record.fullName} đang được gán {record.assetIds.length} tài sản. Hãy gỡ người nhận khỏi
            các tài sản trên, rồi xóa lại.
          </p>
          <DialogFooter>
            <button type="button" className={buttonStyles.outline} onClick={onClose}>
              Đóng
            </button>
            <Link to={ROUTES.DASHBOARD.ASSIGNMENTS} className={buttonStyles.dark}>
              Mở phần phân chia
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  // Thông tin để Chủ kho nhận ra đúng người trước khi xóa.
  let email = "Chưa có";
  if (record.email) {
    email = record.email;
  }
  let phone = "Chưa có";
  if (record.phone) {
    phone = record.phone;
  }
  const details = [
    { label: "Ngày sinh", value: formatBirthDate(record.dateOfBirth) },
    { label: "Số CCCD", value: record.citizenId },
    { label: "Email", value: email },
    { label: "Số điện thoại", value: phone },
    { label: "Tài sản được gán", value: "Chưa có" },
  ];
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-heritage-danger-bg text-heritage-danger"
              aria-hidden="true"
            >
              <Trash2 className="size-5" />
            </span>
            <DialogTitle className={DIALOG_TITLE}>Xóa người nhận này?</DialogTitle>
          </div>
        </DialogHeader>
        <div className="rounded-xl border border-heritage-border px-4 py-3.5">
          <p className="break-words text-base font-semibold">{record.fullName}</p>
          <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
            {details.map((detail) => (
              <div key={detail.label} className="contents">
                <dt className="text-heritage-muted">{detail.label}</dt>
                <dd className="break-all">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <DialogDescription className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger">
          Hồ sơ và lời nhắn của người này sẽ bị xóa, không hoàn tác được. Tài sản trong kho không bị
          ảnh hưởng.
        </DialogDescription>
        <div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5 shrink-0 cursor-pointer accent-heritage-danger"
              checked={understood}
              disabled={action.pending}
              onChange={(event) => setUnderstood(event.target.checked)}
            />
            Tôi hiểu thao tác này không hoàn tác được.
          </label>
          {!understood && (
            <p id={hintId} className="pl-8 text-sm text-heritage-muted">
              Tick ô này thì nút Xóa mới bấm được.
            </p>
          )}
        </div>
        {action.error && (
          <p
            role="alert"
            className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
          >
            {action.error}
          </p>
        )}
        {/* Lề âm khớp lề hộp thoại: p-7 ở màn hẹp, sm:p-6 từ màn rộng. */}
        <DialogFooter className="-mx-7 -mb-7 bg-heritage-surface px-7 sm:-mx-6 sm:-mb-6 sm:px-6">
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={action.pending}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className={cn(
              RED_BUTTON,
              // Đang khóa thì hiện xám như nút bị khóa, không phải đỏ nhạt trông như hỏng.
              "disabled:border disabled:border-heritage-border disabled:bg-heritage-sunken disabled:text-heritage-subtle disabled:opacity-100",
            )}
            aria-describedby={understood ? undefined : hintId}
            disabled={action.pending || !understood}
            onClick={() =>
              void action.execute(
                () => beneficiaryService.remove(vaultId, record.id),
                () => {
                  void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
                  void client.invalidateQueries({ queryKey: ["owner-vault"] });
                  onClose();
                },
              )
            }
          >
            {action.pending ? "Đang xóa…" : "Xóa người nhận"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Một hàng trong bảng người nhận: avatar, họ tên và ngày sinh, CCCD che, liên hệ, số tài sản được gán;
 * "Sửa" và "Xóa" mở hộp thoại. `readOnly` (gói dịch vụ đang gia hạn) khóa "Sửa" nhưng vẫn cho xóa.
 */
export function BeneficiaryRow({
  vaultId,
  record,
  assetNames = {},
  readOnly = false,
  locked = false,
}: {
  vaultId: string;
  record: Beneficiary;
  /** id tài sản → tên tài sản, do widget tra; thiếu thì thông báo chỉ nêu số tài sản. */
  assetNames?: Record<string, string>;
  readOnly?: boolean;
  /** Kho đang bị khóa (đang bàn giao tài sản số...): khóa cả "Sửa" lẫn "Xóa". */
  locked?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  let contact = "Chưa có liên hệ";
  if (record.email) {
    contact = record.email;
  } else if (record.phone) {
    contact = record.phone;
  }
  let groupLabel = "Chưa được gán tài sản";
  if (record.assetIds.length > 0) {
    groupLabel = `${record.assetIds.length} tài sản`;
  }
  return (
    <tr>
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-heritage-gold-soft font-semibold text-heritage-primary"
            aria-hidden="true"
          >
            {record.fullName.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block break-words font-semibold">{record.fullName}</span>
            <span className="block text-sm text-heritage-muted">
              Sinh {formatBirthDate(record.dateOfBirth)}
            </span>
          </span>
        </div>
      </td>
      <td className="px-4 py-4 font-mono text-sm text-heritage-muted">{record.citizenId}</td>
      <td className="break-words px-4 py-4 text-heritage-muted">
        {contact}
        {record.emailUndeliverable && (
          <span role="alert" className="mt-1 block text-sm text-destructive">
            Không gửi được thư tới email này. Bấm Sửa để nhập lại email đúng.
          </span>
        )}
      </td>
      <td className="px-4 py-4 text-heritage-muted">{groupLabel}</td>
      <td className="py-4 pl-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={`${buttonStyles.outline} disabled:border-transparent disabled:bg-heritage-sunken disabled:text-heritage-subtle disabled:opacity-100`}
            aria-label={`Sửa hồ sơ ${record.fullName}`}
            disabled={readOnly || locked}
            onClick={() => setEditing(true)}
          >
            Sửa
          </button>
          <button
            type="button"
            className={`${buttonStyles.danger} disabled:border-transparent disabled:bg-heritage-sunken disabled:text-heritage-subtle disabled:opacity-100`}
            aria-label={`Xóa hồ sơ ${record.fullName}`}
            disabled={locked}
            onClick={() => setDeleting(true)}
          >
            Xóa
          </button>
        </div>
        {editing && (
          <EditBeneficiaryDialog
            vaultId={vaultId}
            record={record}
            onClose={() => setEditing(false)}
          />
        )}
        {deleting && (
          <DeleteBeneficiaryDialog
            vaultId={vaultId}
            record={record}
            assetNames={assetNames}
            onClose={() => setDeleting(false)}
          />
        )}
      </td>
    </tr>
  );
}
