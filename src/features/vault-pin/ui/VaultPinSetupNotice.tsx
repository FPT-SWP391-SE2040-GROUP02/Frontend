import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { vaultPinKeys } from "../model/useVaultPin";
import { SetPinForm } from "./PinForms";

/**
 * Hiện trên đầu màn Tài sản khi kho chưa đặt mã PIN. Backend chặn tạo tài sản (409 VAULT_PIN_NOT_SET)
 * cho tới khi có PIN, nên màn bao ngoài khóa form thêm tài sản; đặt xong thì cập nhật cache trạng thái PIN
 * từ response để màn tự mở khóa.
 */
export function VaultPinSetupNotice({ vaultId }: { vaultId: string }) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
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
      {formOpen ? (
        <div className="max-w-md rounded-xl bg-heritage-surface p-5">
          <SetPinForm
            vaultId={vaultId}
            onDone={(_pin, status) => {
              queryClient.setQueryData(vaultPinKeys.status(vaultId), status);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </div>
      ) : (
        <button type="button" className={buttonStyles.dark} onClick={() => setFormOpen(true)}>
          Đặt mã PIN
        </button>
      )}
    </section>
  );
}
