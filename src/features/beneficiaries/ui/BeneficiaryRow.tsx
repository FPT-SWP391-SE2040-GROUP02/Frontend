import { useState } from "react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
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
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE}>Xóa “{record.fullName}”?</DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Hồ sơ người nhận (CCCD {record.citizenId}) sẽ bị xóa khỏi kho. Người này chưa được gán
            tài sản nào.
          </DialogDescription>
        </DialogHeader>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5"
            checked={understood}
            disabled={action.pending}
            onChange={(event) => setUnderstood(event.target.checked)}
          />
          Tôi hiểu thao tác này không hoàn tác được.
        </label>
        {action.error && (
          <p
            role="alert"
            className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
          >
            {action.error}
          </p>
        )}
        <DialogFooter>
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
            className={RED_BUTTON}
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
