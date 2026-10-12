import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { LegacyVaultMark } from "./LegacyVaultArtwork";

/** Shared presentation contract; role navigation and account data remain with the caller. */
export interface WorkspaceShellProps {
  brand: string;
  homeHref: string;
  logoutHref: string;
  logoutLabel: string;
  navigation: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

/** Responsive workspace geometry shared across roles, with an always reachable logout action. */
export function WorkspaceShell({
  brand,
  homeHref,
  logoutHref,
  logoutLabel,
  navigation,
  footer,
  children,
}: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-heritage-surface text-heritage-text lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-heritage-border bg-heritage-primary text-heritage-surface lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0">
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
            className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-heritage-surface/10 focus-visible:outline-2 focus-visible:outline-heritage-gold lg:hidden"
          >
            <LogOut className="size-5" aria-hidden="true" />
          </Link>
        </div>
        {navigation}
        <div className="mt-auto hidden border-t border-heritage-surface/15 p-4 lg:block">
          {footer}
          <Link
            to={logoutHref}
            className="mt-3 flex min-h-11 items-center gap-2 text-sm text-heritage-surface/80 hover:text-heritage-gold focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {logoutLabel}
          </Link>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-6 [&_h1]:text-2xl [&_h1]:tracking-normal">
          {children}
        </div>
      </main>
    </div>
  );
}
