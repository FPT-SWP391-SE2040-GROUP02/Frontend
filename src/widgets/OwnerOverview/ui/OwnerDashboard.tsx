import { ChevronDown, Pencil } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { VaultEmailRequiredNotice } from "@/features/vault-management/ui/VaultEmailRequiredNotice";
import { EditVaultForm } from "@/features/vault-management/ui/EditVaultForm";
import { OwnerDeathCasePanel } from "@/features/owner-objection";
import { MyInvitationsBanner } from "@/features/plan-setup/ui/MyInvitationsBanner";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { useOverviewResources } from "../model/useOverviewResources";
import { OwnerOverviewSummary } from "./OwnerOverviewSummary";
import { OwnerOverviewPlan } from "./OwnerOverviewPlan";
import { OwnerOverviewLists } from "./OwnerOverviewLists";
import { OwnerOverviewDetails } from "./OwnerOverviewDetails";
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
    if (isOwnerVaultMissing(vault.error)) return <VaultEmailRequiredNotice />;
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
      <MyInvitationsBanner invitationsHref={ROUTES.DASHBOARD.INVITATIONS} />
      <OwnerDeathCasePanel vaultId={vault.id} enabled />
      <OwnerOverviewSummary vault={vault} data={data} />
      <OwnerOverviewPlan data={data} />
      <OwnerOverviewLists data={data} />
      <OwnerOverviewDetails vault={vault} data={data} />
      <details className="overview-card overview-vault-details group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 text-heritage-primary focus-visible:outline-2 focus-visible:outline-heritage-gold">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1E6CC] text-[#7A5B25]"
            aria-hidden="true"
          >
            <Pencil className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">Thông tin kho</span>
            <span className="block truncate text-sm font-normal text-heritage-muted">
              {vault.name}
              {vault.description ? ` · ${vault.description}` : " · Chưa có mô tả"}
            </span>
          </span>
          <span className="hidden text-sm font-medium text-[#7A5B25] group-open:hidden sm:inline">
            Chỉnh sửa
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-heritage-muted transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="mt-4 border-t border-heritage-border pt-5">
          <EditVaultForm vault={vault} />
        </div>
      </details>
    </div>
  );
}
