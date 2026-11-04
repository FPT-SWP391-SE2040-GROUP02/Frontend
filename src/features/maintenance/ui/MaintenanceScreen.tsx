import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import {
  MAINTENANCE_ADMIN_LOGIN_HREF,
  MAINTENANCE_CONTENT as content,
} from "../model/maintenance.content";
import { MAINTENANCE_RECHECK_MS, type MaintenanceStatus } from "../model/useMaintenanceStatus";
import { MaintenanceBackdrop } from "./MaintenanceBackdrop";
import { MaintenanceGears } from "./MaintenanceGears";
import "./maintenance.css";

/** Độ trễ để các khối hiện lần lượt từ trên xuống. */
function rise(delayMs: number): CSSProperties {
  return { "--maintenance-delay": `${delayMs}ms` } as CSSProperties;
}

/** Thuộc tính màn hình bảo trì: trạng thái lấy từ useMaintenanceStatus. */
export interface MaintenanceScreenProps {
  status: MaintenanceStatus;
}

/**
 * Màn hình thay thế toàn bộ ứng dụng khi đang bảo trì (trừ Quản trị viên). Tối giản một cột thông tin:
 * bánh răng tương tác, một thông điệp chính, một hành động duy nhất. Luôn nền tối nên dùng
 * màu cố định, không đổi theo giao diện sáng hay tối. Không hiển thị giờ xong hay phần trăm vì Backend không có số liệu này.
 */
export function MaintenanceScreen({ status }: MaintenanceScreenProps) {
  const lastChecked = status.lastCheckedAt
    ? new Date(status.lastCheckedAt).toLocaleTimeString("vi-VN")
    : null;

  return (
    <div className="maintenance-surface relative flex min-h-screen flex-col overflow-hidden px-[clamp(24px,5vw,72px)] py-8 font-sans text-[#EFECE3]">
      <MaintenanceBackdrop />

      <header className="relative z-10 flex items-center gap-3">
        <LegacyVaultMark className="size-10 text-[#EFECE3]" />
        <span className="text-[22px] font-semibold">{content.brand}</span>
      </header>

      <main className="relative z-10 flex flex-1 flex-wrap items-center justify-center gap-[clamp(32px,6vw,96px)] py-10">
        <div className="maintenance-rise flex flex-none justify-center" style={rise(0)}>
          <MaintenanceGears label={content.gearLabel} />
        </div>

        <section
          aria-labelledby="maintenance-title"
          className="flex w-full max-w-[500px] flex-col gap-4"
        >
          <span
            className="maintenance-rise inline-flex items-center gap-2 self-start rounded-full border border-[#E0C486] px-3.5 py-1.5 text-sm font-semibold text-[#E0C486]"
            style={rise(80)}
          >
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full rounded-full bg-[#E0C486] opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-[#E0C486]" />
            </span>
            {content.statusPill}
          </span>

          <h1
            id="maintenance-title"
            className="maintenance-rise m-0 text-[clamp(32px,4vw,46px)] font-bold leading-[1.15]"
            style={rise(160)}
          >
            {content.title}
          </h1>

          <p className="maintenance-rise m-0 text-[17px] text-[#C5D1CA]" style={rise(240)}>
            {content.description}
          </p>

          <div
            role="progressbar"
            aria-label={content.progressLabel}
            className="maintenance-rise h-2.5 overflow-hidden rounded-full bg-[#2F5E4D]"
            style={rise(320)}
          >
            <div className="maintenance-stripes h-full" />
          </div>

          <div
            className="maintenance-rise mt-4 flex flex-wrap items-center gap-x-4 gap-y-2"
            style={rise(400)}
          >
            <button
              type="button"
              onClick={status.recheck}
              disabled={status.isChecking}
              className="inline-flex min-h-[50px] min-w-[168px] cursor-pointer items-center justify-center rounded-[10px] bg-[#E0C486] px-7 text-base font-bold text-[#0A281E] transition-colors hover:bg-[#EAD3A0] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B68F4C] disabled:cursor-wait disabled:opacity-80"
            >
              {status.isChecking ? content.checking : content.recheck}
            </button>
            <p className="m-0 text-[13px] text-[#9DB0A5]" aria-live="polite">
              {content.autoRecheck(MAINTENANCE_RECHECK_MS / 1000)}
              {lastChecked && ` · ${content.lastChecked} ${lastChecked}`}
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#9DB0A5]">
        <span>{content.note}</span>
        <span>
          {content.adminPrompt}{" "}
          <Link
            to={MAINTENANCE_ADMIN_LOGIN_HREF}
            className="font-semibold text-[#E0C486] underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B68F4C]"
          >
            {content.adminLogin}
          </Link>
        </span>
      </footer>
    </div>
  );
}
