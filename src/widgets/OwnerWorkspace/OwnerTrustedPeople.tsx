import { ExecutorKeyCard } from "@/features/executor-key";
import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { ExecutorNoteSection } from "@/features/vault-management/ui/ExecutorNoteForm";
import { useHandoverSlipContext } from "./useHandoverSlipContext";

/** Màn Người tin cậy: Quản lý Người thực thi do Chủ kho mời, mã mở gói giao cho Người thực thi và hướng dẫn để lại. */
export function OwnerTrustedPeople({
  vaultId,
  vaultName,
}: {
  vaultId: string;
  vaultName?: string | null;
}) {
  const slip = useHandoverSlipContext(vaultId, vaultName);
  return (
    <div className="space-y-6">
      <ExecutorsSection vaultId={vaultId} />
      <ExecutorKeyCard vaultId={vaultId} slip={slip} />
      <ExecutorNoteSection />
    </div>
  );
}
