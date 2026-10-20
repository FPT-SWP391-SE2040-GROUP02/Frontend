import { PRICING_CATALOG } from "./model/pricing.content";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Check, CreditCard } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import { ROUTES } from "@/shared/config/routes.config";
import { Button, buttonVariants } from "@/shared/ui/button";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { VaultServiceInfo } from "@/entities/vault/ui/VaultServiceInfo";
import {
  isOwnerVaultMissing,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

function Catalog({ currentTier }: { currentTier?: VaultResponse["serviceTier"] }) {
  return (
    <section aria-label="Các gói dịch vụ" className="space-y-6">
      <p
        role="status"
        className="rounded-lg border border-heritage-border bg-heritage-primary/5 px-4 py-3 text-sm leading-6 text-heritage-muted"
      >
        Bảng tham khảo theo chính sách dịch vụ. Hiện chưa mở đăng ký hoặc thanh toán. Quyền của kho
        được hiển thị riêng theo dữ liệu hệ thống.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {PRICING_CATALOG.map((plan) => (
          <article
            key={plan.name}
            className={`flex min-w-0 flex-col rounded-xl border bg-heritage-surface p-6 ${
              currentTier === plan.serviceTier
                ? "border-heritage-gold ring-1 ring-heritage-gold/30"
                : "border-heritage-border"
            }`}
          >
            <CreditCard className="mb-5 size-6 text-heritage-gold" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-heritage-primary">{plan.name}</h2>
            {currentTier === plan.serviceTier && (
              <span className="mt-3 w-fit rounded-full bg-heritage-gold/20 px-2.5 py-1 text-xs font-semibold text-heritage-primary">
                Gói hiện tại
              </span>
            )}
            {plan.termPrices.length === 0 ? (
              <div className="mt-5 space-y-2">
                <p className="text-2xl font-semibold text-heritage-primary">Miễn phí</p>
                <p className="text-xs text-heritage-muted">Không có kỳ hạn</p>
              </div>
            ) : (
              <dl className="mt-5 space-y-3" aria-label={`Giá tham khảo ${plan.name}`}>
                {plan.termPrices.map((term) => (
                  <div
                    key={term.years}
                    className="flex flex-wrap items-start justify-between gap-2"
                  >
                    <dt className="text-sm text-heritage-muted">
                      <span className="block font-medium text-heritage-primary">
                        {term.years} năm
                      </span>
                      <span className="text-xs">
                        {new Intl.NumberFormat("vi-VN").format(term.days)} ngày
                      </span>
                    </dt>
                    <dd className="text-lg font-semibold text-heritage-primary">
                      {currencyFormatter.format(term.price)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <dl className="my-6 grid grid-cols-2 gap-3 border-y border-heritage-border py-4">
              <div>
                <dt className="text-xs text-heritage-muted">Dung lượng</dt>
                <dd className="mt-1 text-sm font-semibold">{plan.storage} MiB</dd>
              </div>
              <div>
                <dt className="text-xs text-heritage-muted">Người nhận kèm gói</dt>
                <dd className="mt-1 text-sm font-semibold">
                  {plan.includedBeneficiarySlots} người
                </dd>
              </div>
            </dl>
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm leading-6">
                  <Check
                    className="mt-1 size-4 shrink-0 text-heritage-primary"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="space-y-2 text-sm leading-6 text-heritage-muted">
        <p>Giá là tổng cho cả kỳ, đã gồm thuế nếu có; số suất kèm gói giữ nguyên trong cả kỳ.</p>
        <p>
          Không giới hạn số tài sản theo hạng; tổng dung lượng phải trong hạn mức và tuân thủ giới
          hạn kỹ thuật khi tải lên.
        </p>
      </div>
      <section
        aria-labelledby="beneficiary-addon-policy"
        className="space-y-4 rounded-xl border border-heritage-border bg-heritage-surface p-6"
      >
        <h2 id="beneficiary-addon-policy" className="text-lg font-semibold text-heritage-primary">
          Mua thêm suất người nhận
        </h2>
        <p className="text-xl font-semibold text-heritage-primary">49.000đ/suất/năm</p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-heritage-muted">
          <li>
            Chỉ áp dụng XS hoặc XS Max còn hiệu lực. Tối đa 20 suất mỗi đơn; suất bổ sung hết hạn
            cùng ngày với gói.
          </li>
          <li>Mua kèm gói hoặc gia hạn: giá suất bổ sung nhân với số suất và số năm của kỳ.</li>
          <li>
            Mua giữa kỳ tính theo thời gian còn lại, làm tròn lên đến đồng; không kéo dài hạn dùng
            của gói.
          </li>
          <li>
            Gia hạn sớm giữ cùng hạng và số suất bổ sung. Khi đã có kỳ gia hạn chờ bắt đầu, không
            mua thêm suất riêng.
          </li>
        </ul>
        <p className="text-sm font-medium text-heritage-primary">
          Chỉ là thông tin chính sách. Chưa hỗ trợ mua thêm suất trên hệ thống.
        </p>
      </section>
    </section>
  );
}

/** Khối riêng cho Owner; khách và vai trò khác chỉ xem danh mục công khai. */
function OwnerCatalog() {
  const vault = useOwnerVault(true);
  let currentTier: VaultResponse["serviceTier"] | undefined;
  if (vault.isSuccess) currentTier = vault.data.serviceTier;
  return (
    <>
      <section
        aria-labelledby="current-vault-service"
        className="space-y-4 rounded-xl border border-heritage-border bg-heritage-surface p-6"
      >
        <h2 id="current-vault-service" className="text-lg font-semibold text-heritage-primary">
          Gói hiện tại của kho
        </h2>
        {vault.isPending && <p role="status">Đang tải gói dịch vụ…</p>}
        {vault.isError && isOwnerVaultMissing(vault.error) && (
          <p className="text-sm text-heritage-muted">
            Bạn chưa có kho. Tạo kho để xem gói dịch vụ và quyền lợi hiện tại.
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
        {vault.isSuccess && <VaultServiceInfo service={vault.data} showQuota />}
      </section>
      <Catalog currentTier={currentTier} />
    </>
  );
}

/** Bảng giá chỉ tham khảo; gói hiện tại luôn lấy từ quyền dịch vụ do Backend trả về. */
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
        {showCurrentService ? <OwnerCatalog key={user.id} /> : <Catalog />}
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
        <Catalog />
      </main>
    </div>
  );
}
