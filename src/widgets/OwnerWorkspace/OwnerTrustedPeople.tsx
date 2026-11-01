import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { ExecutorNoteSection } from "@/features/vault-management/ui/ExecutorNoteForm";

/** Màn Người tin cậy: Quản lý Executor do Chủ kho mời và hướng dẫn để lại cho Executor. */
export function OwnerTrustedPeople({ vaultId }: { vaultId: string }) {
  return (
    <div className="space-y-6">
      <ExecutorsSection vaultId={vaultId} />
      <ExecutorNoteSection />
    </div>
  );
}
