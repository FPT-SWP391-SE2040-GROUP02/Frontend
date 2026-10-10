import { Link, useLocation, useSearchParams } from "react-router-dom";
import { QrCode, CircleCheck, CircleAlert } from "lucide-react";
import { WorkspaceFrame } from "@/widgets/WorkspaceFrame/WorkspaceFrame";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes.config";
import { CHECKOUT_UI_CONTENT as content } from "./model/checkout.content";

/** Checkout UI độc lập, không tạo đơn, gửi thanh toán hoặc kích hoạt gói. */
export function CheckoutPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const preview = import.meta.env.DEV && location.pathname.startsWith("/preview/");
  const requested = params.get("state");
  const state =
    preview && requested && Object.hasOwn(content.states, requested)
      ? (requested as keyof typeof content.states)
      : "pending";
  const result = content.states[state];
  // TODO: [P1][BILLING-05] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Thay checkout mẫu bằng order/status/subscription thực.
  // 2. [INPUT & OUTPUT]: planId + phiên -> QR/giá/hạn/trạng thái đơn được BE xác nhận.
  // 3. [CÁC BƯỚC]: Sau BILLING-01..03 dùng service/hooks; tạo khi xác nhận; polling có terminal; chỉ hiển thị entitlement từ subscription BE; bỏ paid/amount lấy từ URL.
  // 4. [HÀM / THƯ VIỆN]: RHF/Zod, TanStack Query, billingService/queryKeys, shared/ui.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không optimistic payment; đơn muộn/trùng/cancel/expired phải đối soát; không auto-activate kho; không poll vô hạn hoặc tạo lại đơn khi mất mạng.
  return (
    <WorkspaceFrame title={content.title} description={content.description} preview={preview}>
      {preview && (
        <nav aria-label={content.nav} className="flex flex-wrap gap-2">
          {Object.entries(content.states).map(([key, item]) => (
            <Link
              key={key}
              to={`?state=${key}`}
              aria-current={state === key ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-xl border px-4 text-sm ${state === key ? "border-heritage-primary bg-heritage-primary text-white" : "border-heritage-border bg-heritage-surface"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      <div className="grid items-start gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{content.summary}</h2>
          <p className="mt-6 font-medium">{content.plan}</p>
          <p className="mt-2 text-xs text-heritage-muted">{content.id}</p>
          <div className="mt-6 border-t border-heritage-border pt-6">
            <p className="text-sm text-heritage-muted">{content.price}</p>
            <p className="mt-3 text-xl font-semibold">{content.waitingPrice}</p>
          </div>
          <Button size="lg" disabled className="mt-8 w-full">
            {content.create}
          </Button>
          <Link
            className="mt-4 flex min-h-11 items-center justify-center text-sm underline underline-offset-4"
            to={ROUTES.BILLING.PLANS}
          >
            {content.back}
          </Link>
        </section>
        <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{content.qrTitle}</h2>
          <div className="mx-auto mt-6 flex aspect-square max-w-60 flex-col items-center justify-center rounded-xl border border-dashed border-heritage-border bg-heritage-canvas p-6 text-center">
            <QrCode aria-hidden="true" className="size-16 text-heritage-muted" />
            <p className="mt-4 text-xs leading-6 text-heritage-muted">{content.noQr}</p>
          </div>
          <p className="mt-5 text-sm leading-7 text-heritage-muted">{content.qrHint}</p>
          <p className="mt-3 text-xs leading-6 text-heritage-muted">{content.notPay}</p>
        </section>
      </div>
      <section
        aria-live="polite"
        className="flex gap-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      >
        {state === "paid" ? (
          <CircleCheck aria-hidden="true" className="size-8 shrink-0 text-emerald-700" />
        ) : (
          <CircleAlert aria-hidden="true" className="size-8 shrink-0 text-heritage-gold" />
        )}
        <div>
          <h2 className="font-semibold">{result.title}</h2>
          <p className="mt-2 text-sm leading-7 text-heritage-muted">{result.detail}</p>
        </div>
      </section>
    </WorkspaceFrame>
  );
}
