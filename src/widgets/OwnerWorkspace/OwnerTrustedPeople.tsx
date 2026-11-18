import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { ExecutorNoteSection } from "@/features/vault-management/ui/ExecutorNoteForm";

/**
 * Trang Người thực thi: một Người thực thi do Chủ kho mời và lời dặn để lại. Mã mở gói do hệ thống tự giữ và gửi
 * nên không hiện ở đây. Widget ghép các feature với nhau vì feature không được import lẫn nhau.
 */
export function OwnerTrustedPeople({ vaultId }: { vaultId: string }) {
  return <ExecutorsSection vaultId={vaultId} noteSlot={<ExecutorNoteSection />} />;
}
