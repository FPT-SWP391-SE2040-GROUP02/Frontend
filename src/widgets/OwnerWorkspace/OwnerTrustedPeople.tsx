import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";

/** Màn Người tin cậy: Quản lý Executor chính & dự phòng do Chủ kho mời. */
export function OwnerTrustedPeople({ vaultId }: { vaultId: string }) {
  return <ExecutorsSection vaultId={vaultId} />;
}
