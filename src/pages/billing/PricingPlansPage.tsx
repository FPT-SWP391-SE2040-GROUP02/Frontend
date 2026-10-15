import { PRICING_CATALOG } from "./model/pricing.content";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Check, CreditCard } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonVariants } from "@/shared/ui/button";
function Catalog() {
  return (
    <section aria-label="Các gói dịch vụ" className="space-y-6">
      <p
        role="status"
        className="rounded-lg border border-heritage-border bg-heritage-primary/5 px-4 py-3 text-sm leading-6 text-heritage-muted"
      >
        Tham khảo các lựa chọn lưu trữ dưới đây. Hiện chưa mở đăng ký hoặc thanh toán.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {PRICING_CATALOG.map((plan) => (
          <article
            key={plan.name}
            className="flex min-w-0 flex-col rounded-xl border border-heritage-border bg-heritage-surface p-6"
          >
            <CreditCard className="mb-5 size-6 text-heritage-gold" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-heritage-primary">{plan.name}</h2>
            <p className="mt-5 text-2xl font-semibold text-heritage-primary">
              {plan.price === 0
                ? "Miễn phí"
                : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    plan.price,
                  )}
            </p>
            <p className="mt-2 text-xs text-heritage-muted">{plan.duration}</p>
            <dl className="my-6 grid grid-cols-2 gap-3 border-y border-heritage-border py-4">
              <div>
                <dt className="text-xs text-heritage-muted">Dung lượng</dt>
                <dd className="mt-1 text-sm font-semibold">{plan.storage} MiB</dd>
              </div>
              <div>
                <dt className="text-xs text-heritage-muted">Tối đa</dt>
                <dd className="mt-1 text-sm font-semibold">{plan.assets} tài sản</dd>
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
    </section>
  );
}
/** Không hiển thị bảng giá mẫu hoặc tự nhận diện gói hiện tại từ fixture. */
export function PricingPlansPage() {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  if (authenticated)
    return (
      <OwnerWorkspace
        title="Gói dịch vụ"
        description="Lựa chọn dung lượng và dịch vụ phù hợp với nhu cầu lưu trữ."
      >
        <Catalog />
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
