import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Chip } from "./heritageKit";
import { LegacyVaultMark, LogoutIcon } from "./LegacyVaultArtwork";
import { PageTransition } from "./PageTransition";

/** Shared presentation contract; role navigation and account data remain with the caller. */
export interface WorkspaceShellProps {
  className?: string;
  brand: string;
  homeHref: string;
  logoutHref: string;
  logoutLabel: string;
  navigation: ReactNode;
  footer: ReactNode;
  /** Thanh trên của trang (thường là `WorkspaceTopbar`). Không truyền thì khung không có thanh trên. */
  topbar?: ReactNode;
  children: ReactNode;
}

/** Mục menu chưa mở: lý do ngắn và nơi bấm để mở khóa. Mục vẫn bấm được; trang đích tự kiểm tra quyền. */
export interface NavLock {
  /** Câu ngắn, ví dụ "Cần thêm ít nhất một tài sản và một người nhận". */
  reason: string;
  /** Bước mở khóa, ví dụ `${ROUTES.SETUP}?step=recipients`. */
  unlockHref: string;
}

/** Một mắt xích của đường dẫn trang; mắt xích cuối là trang hiện tại nên không cần `to`. */
export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface WorkspaceTopbarProps {
  breadcrumb: BreadcrumbItem[];
  /** Tên vai đang dùng, ví dụ "Chủ kho". */
  roleLabel: string;
  /** Lối sang vai khác (chỉ truyền khi tài khoản có vai đó). */
  roleAction?: ReactNode;
}

/** Nội dung thanh trên: đường dẫn trang bên trái, vai đang dùng và lối đổi vai bên phải. */
export function WorkspaceTopbar({ breadcrumb, roleLabel, roleAction }: WorkspaceTopbarProps) {
  return (
    <>
      <nav aria-label="Đường dẫn trang" className="min-w-0">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-heritage-muted">
          {breadcrumb.map((item, index) => {
            const last = index === breadcrumb.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
                {item.to && !last ? (
                  <Link
                    to={item.to}
                    className="rounded px-1 hover:text-heritage-primary hover:underline focus-visible:outline-2 focus-visible:outline-heritage-gold"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={last ? "truncate px-1 font-semibold text-heritage-primary" : "px-1"}
                  >
                    {item.label}
                  </span>
                )}
                {!last && <ChevronRight className="size-4 shrink-0" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Chip tone="neutral">Vai: {roleLabel}</Chip>
        {roleAction}
      </div>
    </>
  );
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
  topbar,
  children,
}: WorkspaceShellProps) {
  return (
    <div
      className={`min-h-screen bg-heritage-canvas text-heritage-text lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] ${className}`}
    >
      <a
        href="#workspace-content"
        className="sr-only z-50 rounded-lg bg-heritage-surface px-4 py-3 text-heritage-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Đến nội dung chính
      </a>
      <aside className="flex flex-col border-b border-heritage-border bg-heritage-sidebar text-white lg:sticky lg:top-0 lg:row-span-2 lg:h-dvh lg:overflow-y-auto lg:border-b-0">
        <div className="flex min-h-20 shrink-0 items-center justify-between gap-2 px-4 lg:px-5">
          <Link
            to={homeHref}
            className="flex min-h-11 min-w-0 items-center gap-2 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            <LegacyVaultMark className="size-8 shrink-0" />
            {brand}
          </Link>
          <Link
            to={logoutHref}
            aria-label={logoutLabel}
            title={logoutLabel}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-heritage-gold lg:hidden"
          >
            <LogoutIcon className="size-5" aria-hidden="true" />
          </Link>
        </div>
        {navigation}
        <div className="mt-auto hidden border-t border-white/15 p-4 lg:block">
          {footer}
          <Link
            to={logoutHref}
            className="mt-3 flex min-h-11 items-center gap-2 text-sm text-white/80 hover:text-heritage-gold focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            <LogoutIcon className="size-4" aria-hidden="true" />
            {logoutLabel}
          </Link>
        </div>
      </aside>
      {topbar && (
        <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-heritage-border bg-heritage-canvas/95 px-4 py-2 backdrop-blur sm:px-6 lg:col-start-2 lg:px-8">
          {topbar}
        </header>
      )}
      <main
        id="workspace-content"
        tabIndex={-1}
        className="min-w-0 px-4 py-6 focus:outline-none sm:px-6 lg:col-start-2 lg:px-8 lg:py-8"
      >
        <PageTransition className="mx-auto w-full max-w-7xl space-y-6 [&_h1]:text-2xl [&_h1]:tracking-normal">
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
