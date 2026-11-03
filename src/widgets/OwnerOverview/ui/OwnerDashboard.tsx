import type { VaultResponse } from "@/entities/vault/model/vault.types";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { AutoCreateVault } from "@/features/vault-management/ui/AutoCreateVault";
import { OwnerDeathCasePanel } from "@/features/owner-objection";
import { Button } from "@/shared/ui/button";
import { useOverviewResources } from "../model/useOverviewResources";
import { OwnerIdentityNotice } from "./OwnerIdentityNotice";
import { OwnerSetupCard } from "./OwnerSetupCard";
import { OwnerOverviewSummary } from "./OwnerOverviewSummary";
import { OwnerOverviewLists } from "./OwnerOverviewLists";
import "./owner-overview.css";

/** Không mount các truy vấn con trước khi có phiên và kho được BE xác nhận. */
export function OwnerDashboard({ enabled }: { enabled: boolean }) {
  const vault = useOwnerVault(enabled);
  if (!enabled) return <p role="status">Vui lòng đăng nhập để xem kho của bạn.</p>;
  if (vault.isPending)
    return (
      <div role="status" className="overview-card overview-loading">
        Đang tải tổng quan kho…
      </div>
    );
  if (vault.isError) {
    if (isOwnerVaultMissing(vault.error)) return <AutoCreateVault />;
    return (
      <div role="alert" className="overview-card space-y-4">
        <p>Không tải được kho của bạn.</p>
        <Button disabled={vault.isFetching} onClick={() => void vault.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }
  return <OwnerDashboardContent key={vault.data.id} vault={vault.data} />;
}

function OwnerDashboardContent({ vault }: { vault: VaultResponse }) {
  const data = useOverviewResources(vault.id);
  return (
    <div className="owner-overview-layout">
      <OwnerDeathCasePanel vaultId={vault.id} enabled />
      <OwnerIdentityNotice data={data} />
      <OwnerOverviewSummary vault={vault} data={data} />
      <OwnerSetupCard data={data} />
      <OwnerOverviewLists data={data} />
    </div>
  );
}
