import { useRef, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LegacyVaultMark, LogoutIcon } from "./LegacyVaultArtwork";
import { RailLabel } from "./sideRail/RailLabel";
import { useNavIndicator } from "./sideRail/useNavIndicator";
import { useIsRailScreen, useRailCollapsed, type RailBreakpoint } from "./sideRail/useSideRail";
import "./sideRail/sideRail.css";

/** Shared presentation contract; role navigation and account data remain with the caller. */
export interface WorkspaceShellProps {
  className?: string;
  brand: string;
  homeHref: string;
  logoutHref: string;
  logoutLabel: string;
  navigation: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  /** "admin": cột menu rộng 272px, nội dung tối đa 1180px và đệm trên dưới theo prototype Admin. */
  variant?: "default" | "admin";
  /** Cỡ màn hình bắt đầu có cột menu thu gọn được; nhỏ hơn thì giữ menu điện thoại. */
  compactFrom?: RailBreakpoint;
}

/** Responsive workspace geometry shared across roles, with an always reachable logout action. */
export function WorkspaceShell({
  className = "",
  brand,
  homeHref,
  logoutHref,
  logoutLabel,
  navigation,
  footer,
  children,
  variant = "default",
  compactFrom = "lg",
}: WorkspaceShellProps) {
  const admin = variant === "admin";
  const rail = useIsRailScreen(compactFrom);
  const [collapsed, toggleCollapsed] = useRailCollapsed();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  useNavIndicator(navRef, indicatorRef, `${rail} ${location.pathname}${location.search}`);

  const railClasses = ["u040"];
  if (rail) {
    railClasses.push("u040--rail");
  }
  if (rail && collapsed) {
    railClasses.push("is-collapsed");
  }
  if (admin) {
    railClasses.push("u040--admin");
  }
  let toggleLabel = "Thu gọn menu";
  let ToggleIcon = PanelLeftClose;
  if (collapsed) {
    toggleLabel = "Mở rộng menu";
    ToggleIcon = PanelLeftOpen;
  }
  return (
    <div
      className={`min-h-screen bg-heritage-canvas text-heritage-text lg:grid ${admin ? "lg:grid-cols-[272px_minmax(0,1fr)]" : "lg:grid-cols-[224px_minmax(0,1fr)]"} ${railClasses.join(" ")} ${className}`}
    >
      <a
        href="#workspace-content"
        className="sr-only z-50 rounded-lg bg-heritage-surface px-4 py-3 text-heritage-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Đến nội dung chính
      </a>
      {/* Từ lg cột menu đứng yên khi cuộn và cao bằng màn hình, để chân menu (chuyển vai, tài khoản, đăng xuất) luôn thấy
          được. */}
      <aside className="flex flex-col border-b border-heritage-border bg-heritage-primary text-heritage-surface lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:border-b-0">
        <div className="u040-brand flex min-h-20 shrink-0 items-center justify-between gap-2 px-4 lg:px-5">
          <Link
            to={homeHref}
            className="u040-home flex min-h-11 min-w-0 items-center gap-2 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            <LegacyVaultMark className="size-8 shrink-0" />
            <RailLabel>{brand}</RailLabel>
          </Link>
          <Link
            to={logoutHref}
            aria-label={logoutLabel}
            title={logoutLabel}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-heritage-surface/10 focus-visible:outline-2 focus-visible:outline-heritage-gold lg:hidden"
          >
            <LogoutIcon className="size-5" aria-hidden="true" />
          </Link>
        </div>
        {rail && (
          <button
            type="button"
            className="u040-toggle"
            aria-expanded={!collapsed}
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={toggleCollapsed}
          >
            <ToggleIcon className="size-[18px]" aria-hidden="true" />
            <RailLabel>Thu gọn</RailLabel>
          </button>
        )}
        <div ref={navRef} className="u040-navwrap">
          {rail && <span ref={indicatorRef} className="u040-hl" aria-hidden="true" />}
          {navigation}
        </div>
        <div className="mt-auto hidden border-t border-heritage-surface/15 p-4 lg:block">
          {footer}
          <Link
            to={logoutHref}
            title={logoutLabel}
            className="u040-action mt-3 flex min-h-11 items-center gap-2 text-sm text-heritage-surface/80 hover:text-heritage-gold focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            <LogoutIcon className="size-4 shrink-0" aria-hidden="true" />
            <RailLabel order={3}>{logoutLabel}</RailLabel>
          </Link>
        </div>
      </aside>
      <main
        id="workspace-content"
        tabIndex={-1}
        className={`min-w-0 px-4 py-6 focus:outline-none sm:px-6 lg:px-8 ${admin ? "pb-28 lg:pb-14 lg:pt-7" : "lg:py-8"}`}
      >
        <div
          key={location.pathname}
          className={`pm-fade mx-auto w-full space-y-6 [&_h1]:text-2xl [&_h1]:tracking-normal ${admin ? "max-w-[1180px]" : "max-w-7xl"}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
