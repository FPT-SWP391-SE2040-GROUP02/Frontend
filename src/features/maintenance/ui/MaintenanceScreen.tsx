import { Link } from "react-router-dom";
import { KeyRound, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import { buttonVariants } from "@/shared/ui/button";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import guilloche from "@/shared/assets/auth-guilloche.svg";
import {
  MAINTENANCE_ADMIN_LOGIN_HREF,
  MAINTENANCE_CONTENT as content,
} from "../model/maintenance.content";
import { MAINTENANCE_RECHECK_MS, type MaintenanceStatus } from "../model/useMaintenanceStatus";

const POINT_ICONS = [ShieldCheck, RefreshCw] as const;

/** Thuộc tính màn hình bảo trì: trạng thái lấy từ useMaintenanceStatus. */
export interface MaintenanceScreenProps {
  status: MaintenanceStatus;
}

/**
 * Màn hình thay thế toàn bộ ứng dụng khi đang bảo trì (trừ Quản trị viên): nêu rõ tình trạng, trấn an về dữ liệu,
 * tự kiểm tra lại định kỳ, cho kiểm tra ngay và chừa một lối đăng nhập quản trị kín đáo.
 */
export function MaintenanceScreen({ status }: MaintenanceScreenProps) {
  const lastChecked = status.lastCheckedAt
    ? new Date(status.lastCheckedAt).toLocaleTimeString("vi-VN")
    : content.notChecked;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-heritage-surface text-heritage-text">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <span className="inline-flex min-h-11 items-center gap-3 font-heading text-lg font-semibold">
          <LegacyVaultMark className="size-10 text-heritage-primary" />
          {content.brand}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-heritage-gold-border bg-heritage-gold-light px-3 py-1 text-xs font-semibold text-heritage-text">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full rounded-full bg-heritage-gold opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-heritage-gold" />
          </span>
          {content.statusPill}
        </span>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-12 sm:px-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <section aria-labelledby="maintenance-title">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-heritage-primary text-heritage-surface">
            <Wrench className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-heritage-gold">
            {content.eyebrow}
          </p>
          <h1
            id="maintenance-title"
            className="mt-3 font-serif text-3xl leading-tight text-heritage-primary sm:text-4xl lg:text-5xl"
          >
            {content.title}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-heritage-muted sm:text-base">
            {content.description}
          </p>
          <ul className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
            {content.points.map((point, index) => {
              const Icon = POINT_ICONS[index] ?? ShieldCheck;
              return (
                <li
                  key={point.title}
                  className="rounded-xl border border-heritage-border bg-white/60 p-4"
                >
                  <Icon className="size-5 text-heritage-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold">{point.title}</p>
                  <p className="mt-1 text-xs leading-5 text-heritage-muted">{point.detail}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <aside
          aria-labelledby="maintenance-status-title"
          className="relative overflow-hidden rounded-3xl bg-heritage-primary p-7 text-heritage-surface shadow-[0_20px_50px_rgba(11,41,30,0.25)] sm:p-9"
        >
          <img
            src={guilloche}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-32 size-[420px] select-none opacity-30"
          />
          <div className="relative z-10">
            <h2
              id="maintenance-status-title"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-heritage-surface/70"
            >
              {content.panelTitle}
            </h2>
            <p className="mt-4 flex items-center gap-3 font-serif text-2xl">
              <span className="size-3 rounded-full bg-heritage-gold" aria-hidden="true" />
              {content.panelStatus}
            </p>
            <dl className="mt-6 space-y-3 border-t border-heritage-surface/15 pt-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-heritage-surface/70">{content.lastChecked}</dt>
                <dd className="font-semibold tabular-nums" aria-live="polite">
                  {lastChecked}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-heritage-surface/60">
              {content.autoRecheck(MAINTENANCE_RECHECK_MS / 1000)}
            </p>
            <button
              type="button"
              onClick={status.recheck}
              disabled={status.isChecking}
              className={`${buttonVariants({ variant: "gold", size: "lg" })} mt-7 w-full`}
            >
              <RefreshCw
                className={`size-4 ${status.isChecking ? "motion-safe:animate-spin" : ""}`}
                aria-hidden="true"
              />
              {status.isChecking ? content.checking : content.recheck}
            </button>
          </div>
        </aside>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-heritage-border px-6 py-6 text-xs leading-6 text-heritage-muted sm:px-10">
        <span>{content.note}</span>
        <span className="inline-flex items-center gap-2">
          <KeyRound className="size-3.5" aria-hidden="true" />
          {content.adminPrompt}
          <Link
            to={MAINTENANCE_ADMIN_LOGIN_HREF}
            className="font-semibold text-heritage-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
          >
            {content.adminLogin}
          </Link>
        </span>
      </footer>
    </div>
  );
}
