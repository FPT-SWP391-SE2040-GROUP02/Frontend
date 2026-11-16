import { ExecutorKeyCard } from "@/features/executor-key";
import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { ExecutorNoteSection } from "@/features/vault-management/ui/ExecutorNoteForm";

/**
 * Trang Người thực thi: một Người thực thi do Chủ kho mời, thẻ mã mở gói (hệ thống tự giữ, Chủ kho chỉ đổi mã
 * mới) và lời dặn để lại. Widget ghép các feature với nhau vì feature không được import lẫn nhau.
 */
export function OwnerTrustedPeople({ vaultId }: { vaultId: string }) {
  return (
    <ExecutorsSection
      vaultId={vaultId}
      keySlot={<ExecutorKeyCard vaultId={vaultId} />}
      noteSlot={<ExecutorNoteSection />}
    />
  );
}
