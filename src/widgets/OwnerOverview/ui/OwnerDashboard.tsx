import type { VaultResponse } from "@/entities/vault/model/vault.types";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { VaultEmailRequiredNotice } from "@/features/vault-management/ui/VaultEmailRequiredNotice";
import { MyInvitationsBanner } from "@/features/plan-setup/ui/MyInvitationsBanner";
import { OwnerReceiveCard } from "@/features/handover-request";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { useOverviewResources } from "../model/useOverviewResources";
import { OwnerOverviewSummary } from "./OwnerOverviewSummary";
import { OwnerOverviewPlan } from "./OwnerOverviewPlan";
import { OwnerOverviewLists } from "./OwnerOverviewLists";
import { OwnerOverviewDetails, OwnerOverviewExecutors } from "./OwnerOverviewDetails";
import "./owner-overview.css";

/** Không mount các truy vấn con trước khi có phiên và kho được BE xác nhận. */
export function OwnerDashboard({ enabled }: { enabled: boolean }) {
  const vault = useOwnerVault(enabled);
  if (!enabled) return <p role="status">Vui lòng đăng nhập để xem tài sản của bạn.</p>;
  if (vault.isPending)
    return (
      <div role="status" className="overview-card overview-loading">
        Đang tải tổng quan tài sản…
      </div>
    );
  if (vault.isError) {
    if (isOwnerVaultMissing(vault.error)) return <VaultEmailRequiredNotice />;
    return (
      <div role="alert" className="overview-card space-y-4">
        <p>Không tải được tài sản của bạn.</p>
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
      <MyInvitationsBanner invitationsHref={ROUTES.DASHBOARD.INVITATIONS} />
      <OwnerReceiveCard />
      <section className="overview-tier" aria-label="Trạng thái chung">
        <OwnerOverviewSummary vault={vault} data={data} />
      </section>
      <section className="overview-tier" aria-label="Chuẩn bị kế hoạch">
        <div className="overview-panel">
          <OwnerOverviewPlan data={data} aside={<OwnerOverviewExecutors data={data} />} />
        </div>
      </section>
      <section className="overview-tier" aria-label="Chi tiết gần đây">
        <OwnerOverviewLists data={data} />
        <OwnerOverviewDetails vault={vault} data={data} />
      </section>
    </div>
  );
}
