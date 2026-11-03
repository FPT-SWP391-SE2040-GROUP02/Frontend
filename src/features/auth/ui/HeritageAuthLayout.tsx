import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "cn";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { ROUTES } from "@/shared/config/routes.config";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import guilloche from "@/shared/assets/auth-guilloche.svg";
import { AUTH_LAYOUT_CONTENT as content } from "../model/authLayout.content";

/** Thuộc tính của khung thương hiệu dùng chung cho các trang Auth. */
export interface HeritageAuthLayoutProps {
  /** Tiêu đề ở cột thương hiệu. */
  sideTitle?: string;
  /** Mô tả theo ngữ cảnh màn hình. */
  sideSubtitle?: string;
  /** Nhãn trạng thái tùy chọn. */
  sideBadge?: string;
  /** Có thì hiện thẻ chuyển nhanh Đăng nhập ↔ Đăng ký phía trên form. */
  activeTab?: "login" | "register";
  /** Form hoặc thông báo ở cột nội dung. */
  children: ReactNode;
}

/** Khung Auth theo HTML tham khảo, dùng logo vòm từ link prototype mới. */
export function HeritageAuthLayout({
  sideTitle = content.title,
  sideSubtitle = content.subtitle,
  sideBadge,
  activeTab,
  children,
}: HeritageAuthLayoutProps) {
  const accountHome = useAccountHome();
  return (
    <div className="flex min-h-screen w-full flex-col bg-heritage-surface font-sans text-heritage-text lg:flex-row">
      <aside className="relative flex w-full shrink-0 flex-col justify-between overflow-hidden bg-heritage-sidebar p-6 text-white sm:p-8 lg:min-h-screen lg:w-[520px] lg:p-12 xl:w-[560px] xl:p-14">
        <img
          src={guilloche}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -right-48 size-[600px] select-none opacity-40 motion-safe:animate-[spin_180s_linear_infinite] sm:-bottom-60 sm:-right-60 sm:size-[800px]"
        />
        <Link
          to={accountHome}
          className="relative z-10 inline-flex min-h-11 w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-heritage-gold"
        >
          <LegacyVaultMark className="size-11 shrink-0 text-white" />
          <div className="flex flex-col">
            <span className="font-heading text-xl font-semibold tracking-wide">
              {content.brand}
            </span>
            {sideBadge && (
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-heritage-gold">
                {sideBadge}
              </span>
            )}
          </div>
        </Link>
        <div className="relative z-10 hidden max-w-md space-y-4 lg:my-auto lg:block">
          <h2 className="font-serif text-2xl font-normal leading-snug sm:text-3xl xl:text-4xl">
            {sideTitle}
          </h2>
          <p className="text-sm font-light leading-relaxed text-white/80 sm:text-base">
            {sideSubtitle}
          </p>
        </div>
        <div className="relative z-10 hidden flex-wrap justify-between gap-3 border-t border-white/15 pt-6 text-xs leading-6 text-white/70 lg:flex">
          <span>{content.footer}</span>
          <span>{content.note}</span>
        </div>
      </aside>
      <main className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="mx-auto w-full max-w-[460px] py-6">
          {activeTab && (
            <nav
              aria-label="Đăng nhập hoặc đăng ký"
              className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-heritage-border bg-heritage-canvas p-1"
            >
              {(
                [
                  { id: "login", label: "Đăng nhập", to: ROUTES.AUTH.LOGIN },
                  { id: "register", label: "Đăng ký", to: ROUTES.AUTH.REGISTER },
                ] as const
              ).map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.to}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold",
                    activeTab === tab.id
                      ? "bg-heritage-gold-soft text-heritage-on-gold"
                      : "text-heritage-muted hover:bg-heritage-neutral-bg",
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
