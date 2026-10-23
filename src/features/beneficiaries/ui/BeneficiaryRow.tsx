import { useState } from "react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
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

const DIALOG_CLASS = "max-w-lg bg-[#FBFAF5] p-7";
const DIALOG_TITLE = "text-xl font-semibold text-heritage-primary";
const RED_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#A32119] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#8A1B14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50";

/** "1990-05-12" → "12/05/1990". */
function formatBirthDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/** Tên các gói bàn giao đang chứa người nhận; gói không tra được tên thì ghi chung. */
function listGroupNames(containerIds: string[], groupNames: Record<string, string>): string[] {
  const names: string[] = [];
  for (const id of containerIds) {
    if (Object.hasOwn(groupNames, id)) {
      names.push(groupNames[id]);
    } else {
      names.push("Gói bàn giao khác");
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
            Thay đổi áp dụng cho các gói bàn giao đã gán người này. Muốn đổi số CCCD thì xóa hồ sơ
            rồi tạo lại.
          </DialogDescription>
        </DialogHeader>
        <BeneficiaryForm vaultId={vaultId} record={record} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}

/** Hộp thoại xóa; hồ sơ còn nằm trong gói bàn giao thì không cho xóa (Backend cũng chặn). */
function DeleteBeneficiaryDialog({
  vaultId,
  record,
  groupNames,
  onClose,
}: {
  vaultId: string;
  record: Beneficiary;
  groupNames: Record<string, string>;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const client = useQueryClient();
  const [understood, setUnderstood] = useState(false);
  const blocked = record.containerIds.length > 0;
  if (blocked) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE}>Không xóa được người nhận</DialogTitle>
            <DialogDescription className="text-heritage-muted">
              {record.fullName} đang được gán vào gói bàn giao nên hệ thống giữ lại.
            </DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-heritage-border">
            {listGroupNames(record.containerIds, groupNames).map((name, index) => (
              <li key={`${name}-${index}`} className="py-3 text-sm font-semibold">
                {name}
              </li>
            ))}
          </ul>
          <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
            {record.fullName} đang ở trong {record.containerIds.length} gói bàn giao. Hãy gỡ người
            nhận khỏi các gói trên, rồi xóa lại.
          </p>
          <DialogFooter>
            <button type="button" className={buttonStyles.outline} onClick={onClose}>
              Đóng
            </button>
            <Link to={`${ROUTES.DASHBOARD.ASSETS}?tab=groups`} className={buttonStyles.gold}>
              Mở gói bàn giao
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
            Hồ sơ người nhận (****{record.citizenIdLast4}) sẽ bị xóa khỏi kho. Người này chưa thuộc
            gói bàn giao nào.
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
          <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
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
 * Một hàng trong bảng người nhận: avatar, họ tên và ngày sinh, CCCD che, liên hệ, số gói bàn giao;
 * "Sửa" và "Xóa" mở hộp thoại. `readOnly` (gói dịch vụ đang gia hạn) khóa "Sửa" nhưng vẫn cho xóa.
 */
export function BeneficiaryRow({
  vaultId,
  record,
  groupNames = {},
  readOnly = false,
}: {
  vaultId: string;
  record: Beneficiary;
  /** id gói bàn giao → tên gói bàn giao, do widget tra; thiếu thì thông báo chỉ nêu số gói bàn giao. */
  groupNames?: Record<string, string>;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  let contact = "Chưa có liên hệ";
  if (record.email) {
    contact = record.email;
  } else if (record.phone) {
    contact = record.phone;
  }
  let groupLabel = "Chưa vào gói bàn giao nào";
  if (record.containerIds.length > 0) {
    groupLabel = `${record.containerIds.length} gói bàn giao`;
  }
  return (
    <tr>
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E0C486] font-semibold text-[#0A281E]"
            aria-hidden="true"
          >
            {record.fullName.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block break-words font-semibold">{record.fullName}</span>
            <span className="block text-xs text-heritage-muted">
              Sinh {formatBirthDate(record.dateOfBirth)}
            </span>
          </span>
          {record.isMinor && <Chip tone="neutral">Chưa đủ 18 tuổi</Chip>}
        </div>
      </td>
      <td className="px-4 py-4 font-mono text-xs text-heritage-muted">
        •••• {record.citizenIdLast4}
      </td>
      <td className="break-words px-4 py-4 text-heritage-muted">{contact}</td>
      <td className="px-4 py-4 text-heritage-muted">{groupLabel}</td>
      <td className="py-4 pl-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={`${buttonStyles.outline} disabled:border-transparent disabled:bg-[#ECE8DB] disabled:text-[#8A8574] disabled:opacity-100`}
            aria-label={`Sửa hồ sơ ${record.fullName}`}
            disabled={readOnly}
            onClick={() => setEditing(true)}
          >
            Sửa
          </button>
          <button
            type="button"
            className={buttonStyles.danger}
            aria-label={`Xóa hồ sơ ${record.fullName}`}
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
            groupNames={groupNames}
            onClose={() => setDeleting(false)}
          />
        )}
      </td>
    </tr>
  );
}
