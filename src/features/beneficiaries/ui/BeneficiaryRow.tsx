import { useState } from "react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { StatusBanner } from "@/shared/ui/status-banner";
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

/** Ghép tên các gói bàn giao đang chứa người nhận; gói bàn giao không tra được tên thì chỉ đếm số lượng. */
function describeGroups(containerIds: string[], groupNames: Record<string, string>): string {
  const names: string[] = [];
  for (const id of containerIds) {
    if (Object.hasOwn(groupNames, id)) {
      names.push(`“${groupNames[id]}”`);
    }
  }
  if (names.length === 0) {
    return `${containerIds.length} gói bàn giao`;
  }
  if (names.length < containerIds.length) {
    return `${names.join(", ")} và ${containerIds.length - names.length} gói bàn giao khác`;
  }
  return `gói bàn giao ${names.join(", ")}`;
}

/** Hộp thoại xác nhận xóa; hồ sơ còn nằm trong gói bàn giao thì không cho xóa (Backend cũng chặn). */
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
  const blocked = record.containerIds.length > 0;
  if (blocked) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Không xóa được người nhận</DialogTitle>
            <DialogDescription>Hồ sơ đang được dùng nên kho giữ lại.</DialogDescription>
          </DialogHeader>
          <Notice tone="danger" role="alert">
            {record.fullName} đang nằm trong {describeGroups(record.containerIds, groupNames)}. Hãy
            gỡ người nhận khỏi gói bàn giao trước khi xóa hồ sơ.
          </Notice>
          <Notice tone="warning">
            Nếu người nhận đã được ghim vào một lượt bàn giao đang chạy, hồ sơ không thể xóa cho tới
            khi bàn giao kết thúc.
          </Notice>
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
      <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Xóa người nhận</DialogTitle>
          <DialogDescription>
            Xóa hồ sơ {record.fullName} (****{record.citizenIdLast4})? Thao tác này không hoàn tác
            được.
          </DialogDescription>
        </DialogHeader>
        {action.error && <StatusBanner tone="error">{action.error}</StatusBanner>}
        <DialogFooter>
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={action.pending}
            onClick={onClose}
          >
            Hủy
          </button>
          <Button
            className="bg-red-700 text-white hover:bg-red-800"
            disabled={action.pending}
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
            {action.pending ? "Đang xóa…" : "Xóa hồ sơ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Một hàng trong bảng người nhận: tên, CCCD che, liên hệ, số gói bàn giao; "Sửa" và "Xóa" mở hộp thoại. */
export function BeneficiaryRow({
  vaultId,
  record,
  groupNames = {},
}: {
  vaultId: string;
  record: Beneficiary;
  /** id gói bàn giao → tên gói bàn giao, do widget tra; thiếu thì thông báo chỉ nêu số gói bàn giao. */
  groupNames?: Record<string, string>;
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
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E0C486] font-semibold text-[#0A281E]"
            aria-hidden="true"
          >
            {record.fullName.charAt(0).toUpperCase()}
          </span>
          <span className="break-words font-semibold">{record.fullName}</span>
        </div>
      </td>
      <td className="px-4 py-4 font-mono text-xs text-heritage-muted">
        •••• {record.citizenIdLast4}
      </td>
      <td className="break-words px-4 py-4 text-heritage-muted">{contact}</td>
      <td className="px-4 py-4">
        <span className="rounded-full bg-[#F1E7D0] px-3 py-1 text-xs text-[#7A5B24]">
          {groupLabel}
        </span>
      </td>
      <td className="py-4 pl-4">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            className="border-heritage-primary font-semibold text-heritage-primary"
            aria-label={`Sửa hồ sơ ${record.fullName}`}
            onClick={() => setEditing(true)}
          >
            Sửa
          </Button>
          <Button
            variant="outline"
            className="border-red-300 font-semibold text-red-700 hover:bg-red-50"
            aria-label={`Xóa hồ sơ ${record.fullName}`}
            onClick={() => setDeleting(true)}
          >
            Xóa
          </Button>
        </div>
        {editing && (
          <Dialog open onOpenChange={(open) => !open && setEditing(false)}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Sửa hồ sơ {record.fullName}</DialogTitle>
                <DialogDescription>
                  Số CCCD (****{record.citizenIdLast4}) không sửa được. Muốn đổi thì xóa hồ sơ rồi
                  tạo lại.
                </DialogDescription>
              </DialogHeader>
              <BeneficiaryForm vaultId={vaultId} record={record} />
            </DialogContent>
          </Dialog>
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
