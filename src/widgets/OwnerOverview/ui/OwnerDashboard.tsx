import { Link } from "react-router-dom";
import { Vault } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { CreateVaultForm } from "@/features/vault-management/ui/CreateVaultForm";
import { EditVaultForm } from "@/features/vault-management/ui/EditVaultForm";
import { OwnerDeathCasePanel } from "@/features/owner-objection";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes.config";
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
    if (isOwnerVaultMissing(vault.error))
      return (
        <section className="overview-card space-y-5" aria-label="Tạo kho di sản">
          <Vault size={32} aria-hidden="true" />
          <h2>Bắt đầu với kho di sản của bạn</h2>
          <p>Tạo kho để lưu giữ tài sản và chuẩn bị kế hoạch bàn giao.</p>
          <CreateVaultForm />
          <Link to={ROUTES.DASHBOARD.IDENTITY} className="overview-text-link">
            Xác minh danh tính Chủ kho →
          </Link>
        </section>
      );
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
      <OwnerOverviewSummary vault={vault} data={data} />
      <OwnerOverviewPlan data={data} />
      <OwnerOverviewLists data={data} />
      <OwnerOverviewDetails vault={vault} data={data} />
      <details className="overview-card overview-vault-details">
        <summary>Thông tin kho</summary>
        <EditVaultForm vault={vault} />
      </details>
    </div>
  );
}
