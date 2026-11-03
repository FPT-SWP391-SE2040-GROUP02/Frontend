import { Link } from "react-router-dom";
import { ServicePlansPanel } from "@/features/billing/ui/ServicePlansPanel";
import { useBillingPlans } from "@/features/billing/model/useBilling";
import { buildPlanCatalog } from "@/features/billing/model/servicePlanPreview";
import {
  isOwnerVaultMissing,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { PRICING_CATALOG } from "./model/pricing.content";

const TIER_NAMES: Record<string, string> = { XS: "Legacy XS", XS_MAX: "Legacy XS Max" };
const TIER_FEATURES: Record<string, readonly string[]> = {
  XS: PRICING_CATALOG[1].features,
  XS_MAX: PRICING_CATALOG[2].features,
};

/** Gói Admin tạo thêm dùng danh sách tính năng chung của gói trả phí (Backend chưa công bố tính năng riêng). */
function featuresFor(codes: readonly string[]): Record<string, readonly string[]> {
  const result: Record<string, readonly string[]> = {};
  for (const code of codes) {
    result[code] = TIER_FEATURES[code] ?? PRICING_CATALOG[1].features;
  }
  return result;
}

/** Owner xem bảng giá do Backend công bố (GET /billing/plans); khách chỉ thấy bảng tham khảo. */
export function OwnerCatalog() {
  const vault = useOwnerVault(true);
  const plans = useBillingPlans(vault.isSuccess);
  return (
    <>
      {vault.isPending && <p role="status">Đang tải gói dịch vụ…</p>}
      {vault.isError && isOwnerVaultMissing(vault.error) && (
        <p className="text-sm text-heritage-muted">
          Bạn chưa có kho.{" "}
          <Link className="underline" to={ROUTES.DASHBOARD.ROOT}>
            Tạo kho
          </Link>{" "}
          để xem gói dịch vụ và quyền lợi hiện tại.
        </p>
      )}
      {vault.isError && !isOwnerVaultMissing(vault.error) && (
        <div role="alert" className="space-y-3">
          <p>Không tải được gói hiện tại của kho.</p>
          <Button
            variant="outline"
            disabled={vault.isFetching}
            onClick={() => void vault.refetch()}
          >
            Thử lại
          </Button>
        </div>
      )}
      {vault.isSuccess && plans.isError && (
        <div role="alert" className="space-y-3">
          <p>Không tải được bảng giá từ máy chủ.</p>
          <Button
            variant="outline"
            disabled={plans.isFetching}
            onClick={() => void plans.refetch()}
          >
            Thử lại
          </Button>
        </div>
      )}
      {vault.isSuccess && plans.isPending && <p role="status">Đang tải bảng giá…</p>}
      {vault.isSuccess && plans.data && (
        <ServicePlansPanel
          catalog={buildPlanCatalog(
            plans.data,
            featuresFor(plans.data.tiers.map((tier) => tier.tier)),
            TIER_NAMES,
            PRICING_CATALOG[0],
          )}
          vault={vault.data}
          access="owner"
          maxExtraSlots={plans.data.extraSlot.maxPerOrder}
        />
      )}
      {!vault.isSuccess && (
        <ServicePlansPanel
          catalog={PRICING_CATALOG}
          access="unavailable"
          unavailableLabel={vault.isPending ? "Đang tải gói dịch vụ…" : "Tải kho để chọn gói"}
        />
      )}
    </>
  );
}
