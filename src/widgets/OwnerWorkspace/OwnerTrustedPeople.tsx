import { ExecutorKeyCard } from "@/features/executor-key";
import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { ExecutorNoteSection } from "@/features/vault-management/ui/ExecutorNoteForm";

/** Màn Người tin cậy: Quản lý Executor do Chủ kho mời, khóa mở gói giao cho Executor và hướng dẫn để lại. */
export function OwnerTrustedPeople({ vaultId }: { vaultId: string }) {
  return (
    <div className="space-y-6">
      <ExecutorsSection vaultId={vaultId} />
      <ExecutorKeyCard vaultId={vaultId} />
      <ExecutorNoteSection />
    </div>
  );
}
