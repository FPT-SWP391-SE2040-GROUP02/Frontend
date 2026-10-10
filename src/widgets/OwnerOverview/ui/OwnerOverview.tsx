import { ArrowRight, Circle } from "lucide-react";
import {
  AddIcon,
  ConfirmedIcon,
  LegacyVaultMark,
  LogoutIcon,
} from "@/shared/ui/LegacyVaultArtwork";
import guilloche from "@/shared/assets/legacyvault-guilloche.svg";
import { Link } from "react-router-dom";
import { Card, buttonVariants } from "@/shared/ui";
import { ROUTES } from "@/shared/config/routes.config";
import { OWNER_OVERVIEW as content } from "../model/overview.content";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { OwnerVaultPanel } from "./OwnerVaultPanel";

/** Dựng tổng quan Chủ kho bằng dữ liệu mẫu, tách điểm danh khỏi phản đối bàn giao. */
export function OwnerOverview() {
  const isAuthenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const serverSessionReady = isAuthenticated && Boolean(accessTokenMemory.get());
  // TODO: [P1][VAULT-02] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Thay số liệu tổng quan mẫu bằng summary/chỉ số thật.
  // 2. [INPUT & OUTPUT]: Kho + subscription/check-in + DTO summary -> ViewModel bốn trạng thái.
  // 3. [CÁC BƯỚC]: Sau VAULT-01 chốt summary endpoint với BE2; dùng adapter entity và Query hooks; tái dùng OwnerVaultPanel; tải dữ liệu đúng session/scope.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, TanStack Query, entity adapters, shared/ui.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Lỗi API không biến thành healthy/0; không gửi check-in/báo sống khi mở trang; không suy diễn entitlement từ UI hoặc thông tin preview.
  return (
    <div className="min-h-screen bg-heritage-surface text-heritage-text lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <a
        href="#owner-content"
        className="sr-only z-50 rounded-lg bg-heritage-surface p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {content.skip}
      </a>
      <aside className="border-b border-heritage-border bg-heritage-primary text-heritage-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0">
        <Link
          to={ROUTES.HOME}
          className="flex min-h-20 items-center gap-3 px-6 text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-heritage-gold"
        >
          <LegacyVaultMark className="size-10 text-heritage-surface" />
          {content.brand}
        </Link>
        <p className="hidden px-6 text-sm text-heritage-surface/70 lg:block">{content.caption}</p>
        <nav
          aria-label={content.navLabel}
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-6 lg:shrink-0 lg:flex-col lg:gap-1 lg:overflow-visible"
        >
          {content.nav.map(({ label, to, icon: Icon, active }) => (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-heritage-gold ${active ? "bg-heritage-surface/10 font-semibold text-heritage-gold border-l-2 border-heritage-gold" : "text-heritage-surface/80 hover:bg-heritage-surface/10"}`}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-heritage-surface/15 p-4 lg:mt-auto lg:block">
          <img
            src={guilloche}
            alt=""
            aria-hidden="true"
            className="mx-auto mb-4 size-24 opacity-50"
          />
          <p className="font-semibold">{content.owner}</p>
          <p className="mt-1 text-sm text-heritage-surface/70">{content.role}</p>
          <Link
            to={ROUTES.AUTH.LOGOUT}
            className="mt-4 flex min-h-11 items-center gap-2 text-sm text-heritage-surface/80 hover:text-heritage-gold"
          >
            <LogoutIcon className="size-4" />
            {content.logout}
          </Link>
        </div>
      </aside>
      <main id="owner-content" className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-xl border border-heritage-gold-border bg-heritage-gold-light px-4 py-3">
            <p className="text-sm font-semibold">{content.preview}</p>
            <p className="mt-1 text-xs leading-relaxed text-heritage-muted">{content.notice}</p>
          </div>
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {content.greeting}
              </h1>
              <p className="mt-2 text-sm text-heritage-muted sm:text-base">{content.subtitle}</p>
            </div>
            <Link
              to={`${ROUTES.DASHBOARD.ASSETS}?modal=create`}
              className={`${buttonVariants({ size: "lg" })} rounded-xl`}
            >
              <AddIcon className="size-5" />
              {content.add}
            </Link>
          </header>
          <OwnerVaultPanel enabled={serverSessionReady} />
          <section
            className="relative overflow-hidden rounded-3xl bg-heritage-primary p-6 text-heritage-surface sm:p-8"
            aria-labelledby="owner-status"
          >
            <img
              src={guilloche}
              alt=""
              className="pointer-events-none absolute -right-8 -bottom-12 size-80 opacity-20"
              aria-hidden="true"
            />
            <div className="relative max-w-2xl">
              <p className="flex items-center gap-2 text-sm text-heritage-surface/80">
                <span className="size-2 rounded-full bg-heritage-gold" />
                {content.status}
                <span className="ml-2 text-xs text-heritage-surface/60">{content.statusTag}</span>
              </p>
              <h2 id="owner-status" className="mt-4 text-2xl font-semibold sm:text-3xl">
                {content.statusHeading}
              </h2>
              <p className="mt-3 text-sm leading-7 text-heritage-surface/80">
                {content.statusDescription}
              </p>
            </div>
          </section>
          <section
            aria-label={content.preview}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {content.stats.map(({ label, value, detail, icon: Icon }) => (
              <Card
                key={label}
                className="gap-3 rounded-2xl border-heritage-border bg-heritage-surface p-5 shadow-none"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-heritage-muted">{label}</p>
                  <Icon className="size-5 text-heritage-muted" aria-hidden="true" />
                </div>
                <p className="text-3xl font-semibold tracking-tight">{value}</p>
                <p className="text-xs text-heritage-muted">{detail}</p>
              </Card>
            ))}
          </section>
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card className="gap-0 rounded-2xl border-heritage-border bg-heritage-surface p-6 shadow-none">
              <h2 className="text-lg font-semibold">{content.setupTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-heritage-muted">
                {content.setupDescription}
              </p>
              <div className="mt-5 flex items-center gap-4">
                <progress
                  value={content.setupPercent}
                  max={100}
                  aria-label={content.setupProgress}
                  className="h-2 w-full accent-heritage-primary"
                />
                <span className="shrink-0 text-xs font-medium">{content.setupProgress}</span>
              </div>
              <ul className="mt-5 space-y-3">
                {content.setup.map(({ title, complete }) => (
                  <li key={title} className="flex items-center gap-3 text-sm">
                    {complete ? (
                      <ConfirmedIcon className="size-5 text-heritage-primary" />
                    ) : (
                      <Circle className="size-5 text-heritage-muted" aria-hidden="true" />
                    )}
                    <span>{title}</span>
                    <span className="sr-only">
                      {complete ? content.completeLabel : content.pendingLabel}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to={ROUTES.WILLS.ROOT}
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"
              >
                {content.setupAction}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Card>
            <Card className="gap-0 rounded-2xl border-heritage-gold-border bg-heritage-gold-light p-6 shadow-none">
              <h2 className="text-lg font-semibold">{content.heartbeatTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-heritage-muted">
                {content.heartbeatDescription}
              </p>
              <p className="mt-6 font-semibold">{content.heartbeatDate}</p>
              <p className="mt-2 text-sm text-heritage-muted">{content.heartbeatLast}</p>
              <Link
                to={ROUTES.DMS.ROOT}
                className={`${buttonVariants({ variant: "outline", size: "lg" })} mt-6 w-fit rounded-xl`}
              >
                {content.heartbeatAction}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Card>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="gap-0 overflow-hidden rounded-2xl border-heritage-border bg-heritage-surface p-6 shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{content.assetsTitle}</h2>
                  <p className="mt-2 text-sm text-heritage-muted">{content.assetsDescription}</p>
                </div>
                <Link
                  to={ROUTES.DASHBOARD.ASSETS}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"
                >
                  {content.assetsAction}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <caption className="sr-only">{content.assetsTitle}</caption>
                  <thead>
                    <tr>
                      {content.columns.map((label) => (
                        <th
                          key={label}
                          scope="col"
                          className="border-b border-heritage-border px-2 py-3 text-xs font-medium text-heritage-muted"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {content.assets.map((asset) => (
                      <tr
                        key={asset.name}
                        className="border-b border-heritage-border last:border-0"
                      >
                        <th scope="row" className="px-2 py-4 font-medium">
                          {asset.name}
                        </th>
                        <td className="px-2 py-4 text-heritage-muted">{asset.type}</td>
                        <td className="px-2 py-4">{asset.recipient}</td>
                        <td className="whitespace-nowrap px-2 py-4 text-heritage-muted">
                          {asset.updated}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card className="gap-0 rounded-2xl border-heritage-border bg-heritage-surface p-6 shadow-none">
              <h2 className="text-lg font-semibold">{content.activityTitle}</h2>
              <ul className="mt-5 space-y-5">
                {content.activity.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-heritage-gold" />
                    <div>
                      <p className="text-sm leading-6">{item.title}</p>
                      <p className="mt-1 text-xs text-heritage-muted">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <footer className="pb-4 text-xs leading-6 text-heritage-muted">{content.footer}</footer>
        </div>
      </main>
    </div>
  );
}
