import { useState } from "react";
import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { beneficiaryService } from "../api/beneficiaryService";
import type { beneficiaryResponseSchema } from "../model/beneficiary.schema";
import { BeneficiaryForm } from "./BeneficiaryForm";

type Beneficiary = z.infer<typeof beneficiaryResponseSchema>;

/** Hộp thoại xác nhận xóa; hồ sơ còn nằm trong nhóm thì không cho xóa (Backend cũng chặn). */
function DeleteBeneficiaryDialog({
  vaultId,
  record,
  onClose,
}: {
  vaultId: string;
  record: Beneficiary;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const client = useQueryClient();
  const blocked = record.containerIds.length > 0;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{blocked ? "Không xóa được người nhận" : "Xóa người nhận"}</DialogTitle>
          <DialogDescription>
            {blocked
              ? `${record.fullName} đang nằm trong ${record.containerIds.length} nhóm. Gỡ người nhận khỏi các nhóm trước khi xóa hồ sơ.`
              : `Xóa hồ sơ ${record.fullName} (****${record.citizenIdLast4})? Thao tác này không hoàn tác được.`}
          </DialogDescription>
        </DialogHeader>
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {blocked ? "Đã hiểu" : "Hủy"}
          </Button>
          {!blocked && (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Một hàng trong bảng người nhận: tên, CCCD che, liên hệ, số nhóm; "Sửa" và "Xóa" mở hộp thoại. */
export function BeneficiaryRow({ vaultId, record }: { vaultId: string; record: Beneficiary }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  let contact = "Chưa có liên hệ";
  if (record.email) {
    contact = record.email;
  } else if (record.phone) {
    contact = record.phone;
  }
  let groupLabel = "Chưa vào nhóm nào";
  if (record.containerIds.length > 0) {
    groupLabel = `${record.containerIds.length} nhóm`;
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
            onClose={() => setDeleting(false)}
          />
        )}
      </td>
    </tr>
  );
}
