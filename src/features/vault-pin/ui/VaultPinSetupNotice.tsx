import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { vaultPinKeys } from "../model/useVaultPin";
import { SetPinForm } from "./PinForms";

/**
 * Hiện trên đầu màn Tài sản khi kho chưa đặt mã PIN. Backend chặn tạo tài sản (409 VAULT_PIN_NOT_SET)
 * cho tới khi có PIN, nên màn bao ngoài khóa form thêm tài sản. Bấm "Đặt mã PIN" mở hộp thoại; đặt xong thì
 * cập nhật cache trạng thái PIN từ response để màn tự mở khóa.
 */
export function VaultPinSetupNotice({ vaultId }: { vaultId: string }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <section
      aria-labelledby="vault-pin-setup-title"
      className="space-y-4 rounded-2xl border border-[#E6D3A3] bg-[#F7EFD9] px-6 py-5"
    >
      <div className="flex items-start gap-4">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EBDDB6] text-[#7A5B25]"
          aria-hidden="true"
        >
          <Lock className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 id="vault-pin-setup-title" className="text-base font-semibold text-heritage-primary">
            Bạn chưa đặt mã PIN cho kho
          </h2>
          <p className="text-sm leading-6 text-heritage-muted">
            Mã PIN là lớp khóa thứ hai. Có nó thì người mượn máy bạn vẫn không xem được nội dung tài
            sản. Đặt mã PIN trước rồi mới thêm được tài sản.
          </p>
        </div>
      </div>
      <button type="button" className={buttonStyles.dark} onClick={() => setDialogOpen(true)}>
        Đặt mã PIN
      </button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đặt Mã PIN bảo vệ</DialogTitle>
            <DialogDescription>
              Mã PIN gồm 6 chữ số, được hỏi trước khi tải nội dung tài sản, sửa hoặc xóa tài sản,
              đổi người nhận hoặc Người thực hiện.
            </DialogDescription>
          </DialogHeader>
          <SetPinForm
            vaultId={vaultId}
            onDone={(_pin, status) => {
              setDialogOpen(false);
              queryClient.setQueryData(vaultPinKeys.status(vaultId), status);
            }}
            onCancel={() => setDialogOpen(false)}
            cancelLabel="Để sau"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
