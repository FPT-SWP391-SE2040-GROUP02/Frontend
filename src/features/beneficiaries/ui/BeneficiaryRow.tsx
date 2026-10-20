import { useState } from "react";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { beneficiaryResponseSchema } from "../model/beneficiary.schema";
import { BeneficiaryForm } from "./BeneficiaryForm";

type Beneficiary = z.infer<typeof beneficiaryResponseSchema>;

/** Một người nhận trong danh sách: tên, liên hệ, số nhóm đang gắn; "Sửa" mở hộp thoại chỉnh hồ sơ. */
export function BeneficiaryRow({ vaultId, record }: { vaultId: string; record: Beneficiary }) {
  const [editing, setEditing] = useState(false);
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
    <li className="flex items-center gap-4 border-b border-heritage-border py-4 last:border-b-0">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F1E7D0] font-semibold text-[#7A5B24]"
        aria-hidden="true"
      >
        {record.fullName.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words font-semibold">{record.fullName}</p>
        <p className="break-words text-xs text-heritage-muted">
          ****{record.citizenIdLast4} · {contact}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-[#F1E7D0] px-3 py-1 text-xs text-[#7A5B24]">
        {groupLabel}
      </span>
      <Button
        variant="ghost"
        className="shrink-0 font-semibold text-[#7A5B24]"
        aria-label={`Sửa hồ sơ ${record.fullName}`}
        onClick={() => setEditing(true)}
      >
        Sửa
      </Button>
      {editing && (
        <Dialog open onOpenChange={(open) => !open && setEditing(false)}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Sửa hồ sơ {record.fullName}</DialogTitle>
              <DialogDescription>
                Số CCCD (****{record.citizenIdLast4}) không sửa được. Muốn đổi thì xóa hồ sơ rồi tạo
                lại.
              </DialogDescription>
            </DialogHeader>
            <BeneficiaryForm vaultId={vaultId} record={record} />
          </DialogContent>
        </Dialog>
      )}
    </li>
  );
}
