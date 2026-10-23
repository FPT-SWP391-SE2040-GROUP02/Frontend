import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { AuthState } from "@/entities/user/model/authSlice";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { ServicePlansPanel } from "@/features/billing/ui/ServicePlansPanel";
import { useBillingPlans } from "@/features/billing/model/useBilling";
import { buildPlanCatalog } from "@/features/billing/model/servicePlanPreview";
import {
  isOwnerVaultMissing,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import { ROUTES } from "@/shared/config/routes.config";
import { Button, buttonVariants } from "@/shared/ui/button";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { PRICING_CATALOG } from "./model/pricing.content";

const TIER_NAMES: Record<string, string> = { XS: "Legacy XS", XS_MAX: "Legacy XS Max" };
const TIER_FEATURES: Record<string, readonly string[]> = {
  XS: PRICING_CATALOG[1].features,
  XS_MAX: PRICING_CATALOG[2].features,
};

/** Owner xem bảng giá do Backend công bố (GET /billing/plans); khách chỉ thấy bảng tham khảo. */
function OwnerCatalog() {
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
          catalog={buildPlanCatalog(plans.data, TIER_FEATURES, TIER_NAMES, PRICING_CATALOG[0])}
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

/** Trang lắp ghép: giữ nguyên header chung; trạng thái lựa chọn thuộc features/billing. */
export function PricingPlansPage() {
  const { isAuthenticated: authenticated, user } = useSelector(
    (state: { auth: AuthState }) => state.auth,
  );
  const showCurrentService =
    authenticated && user?.role === "USER" && Boolean(accessTokenMemory.get());
  if (authenticated)
    return (
      <OwnerWorkspace
        title="Gói dịch vụ"
        description="Lựa chọn dung lượng và dịch vụ phù hợp với nhu cầu lưu trữ."
      >
        {showCurrentService ? (
          <>
            <div className="flex justify-end">
              <Link to={ROUTES.BILLING.HISTORY} className={buttonVariants({ variant: "outline" })}>
                Lịch sử thanh toán
              </Link>
            </div>
            <OwnerCatalog key={user.id} />
          </>
        ) : (
          <ServicePlansPanel
            catalog={PRICING_CATALOG}
            access="unavailable"
            unavailableLabel="Gói dành cho chủ kho"
          />
        )}
      </OwnerWorkspace>
    );
  return (
    <div className="min-h-screen bg-heritage-surface text-heritage-text">
      <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-heritage-border px-6 py-4">
        <Link to={ROUTES.HOME} className="flex min-h-11 items-center gap-2 font-semibold">
          <LegacyVaultMark className="size-8 text-heritage-primary" />
          LegacyVault
        </Link>
        <Link to={ROUTES.AUTH.LOGIN} className={buttonVariants({ variant: "outline" })}>
          Đăng nhập
        </Link>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <h1 className="text-2xl font-semibold">Gói dịch vụ</h1>
        <ServicePlansPanel catalog={PRICING_CATALOG} access="guest" />
      </main>
    </div>
  );
}
