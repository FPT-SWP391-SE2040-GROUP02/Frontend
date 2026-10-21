import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { ROUTES } from "@/shared/config/routes.config";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import guillocheMarkup from "@/shared/assets/legacyvault-guilloche.svg?raw";
import { LANDING_CONTENT as content } from "../model/landing.content";
import "../landing.css";

/*
 * Phần khung dùng chung của landing và các trang công khai (hỗ trợ, pháp lý): hoa hero, thanh đầu trang,
 * chân trang. Màu cố định theo bản thiết kế (nền xanh đậm / kem) nên không đổi theo chế độ tối.
 */
export const FOCUS_RING =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#E6C98B]";
export const HEADING = "font-serif font-normal tracking-normal";

/**
 * Hoa nhúng trực tiếp để CSS của trang điều khiển được phần `.spin` bên trong SVG
 * (thẻ img không cho CSS ngoài vào). Nguồn là asset của dự án, không phải dữ liệu người dùng.
 */
export function AnimatedGuilloche({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`landing-flower ${className}`}
      dangerouslySetInnerHTML={{ __html: guillocheMarkup }}
    />
  );
}

/** Mục neo của landing: ở landing là `#goi`, ở trang khác phải về trang chủ trước (`/#goi`). */
function anchorHref(href: string, onLanding: boolean): string {
  if (onLanding) {
    return href;
  }
  return `${ROUTES.HOME}${href}`;
}

/** Thanh đầu trang: logo, điều hướng các mục landing, nút đăng nhập hoặc về dashboard. */
export function LandingHeader({ onLanding }: { onLanding: boolean }) {
  const accountHome = useAccountHome();
  const isGuest = accountHome === ROUTES.HOME;
  let loginTarget: string = accountHome;
  let loginLabel: string = content.dashboard;
  if (isGuest) {
    loginTarget = ROUTES.AUTH.LOGIN;
    loginLabel = content.login;
  }

  const navLinks: ReactNode[] = [];
  for (const item of content.nav) {
    navLinks.push(
      <a
        key={item.href}
        href={anchorHref(item.href, onLanding)}
        className={`inline-flex min-h-11 shrink-0 items-center text-sm text-[#F3EFE6]/80 hover:text-[#E6C98B] ${FOCUS_RING}`}
      >
        {item.label}
      </a>,
    );
  }

  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
      <Link
        to={accountHome}
        aria-label={`${content.brand}, về trang chủ`}
        className={`flex min-h-11 items-center gap-2 font-serif text-lg ${FOCUS_RING}`}
      >
        <LegacyVaultMark className="size-8" />
        {content.brand}
      </Link>
      <nav
        aria-label={content.navLabel}
        className="order-3 flex w-full justify-center gap-6 overflow-x-auto md:order-none md:w-auto"
      >
        {navLinks}
      </nav>
      <Link
        to={loginTarget}
        className={`inline-flex min-h-11 items-center rounded-md border border-[#E6C98B]/60 px-4 text-sm text-[#E6C98B] hover:bg-[#E6C98B]/10 ${FOCUS_RING}`}
      >
        {loginLabel}
      </Link>
    </header>
  );
}

function FooterBullets({ items }: { items: readonly string[] }) {
  const rows: ReactNode[] = [];
  for (const item of items) {
    rows.push(
      <li key={item} className="flex items-start gap-2 font-serif text-lg text-[#F3EFE6]">
        <span className="text-[#E6C98B]" aria-hidden="true">
          •
        </span>
        {item}
      </li>,
    );
  }
  return <ul className="mt-3 space-y-1">{rows}</ul>;
}

interface FooterLinkItem {
  label: string;
  to: string;
}

/** Cột liên kết tới các trang công khai (hỗ trợ, pháp lý). */
function FooterTextColumn({ title, items }: { title: string; items: readonly FooterLinkItem[] }) {
  const rows: ReactNode[] = [];
  for (const item of items) {
    rows.push(
      <li key={item.to}>
        <Link to={item.to} className={`hover:text-[#E6C98B] ${FOCUS_RING}`}>
          {item.label}
        </Link>
      </li>,
    );
  }
  return (
    <div>
      <h3 className="text-xs font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3 text-xs text-[#F3EFE6]/70">{rows}</ul>
    </div>
  );
}

/** Chân trang đầy đủ của landing, dùng lại ở các trang hỗ trợ và pháp lý để giao diện thống nhất. */
export function LandingFooter({ onLanding }: { onLanding: boolean }) {
  const productLinks: ReactNode[] = [];
  for (const link of content.footer.productLinks) {
    productLinks.push(
      <li key={link.href}>
        <a href={anchorHref(link.href, onLanding)} className={`hover:text-[#E6C98B] ${FOCUS_RING}`}>
          {link.label}
        </a>
      </li>,
    );
  }

  return (
    <footer className="landing-footer bg-[#0A281E] px-4 pb-10 pt-14 text-[#F3EFE6] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-3 font-serif text-2xl">
              <LegacyVaultMark className="size-10 shrink-0" />
              {content.brand}
            </p>
            <p className={`${HEADING} mt-3 text-base italic text-[#E6C98B]`}>
              {content.footer.tagline}
            </p>
          </div>
          <div>
            <h3 className="text-xs text-[#E6C98B]">{content.footer.commitmentTitle}</h3>
            <FooterBullets items={content.footer.commitments} />
          </div>
        </div>
        <div className="grid gap-8 border-t border-[#F3EFE6]/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-xs font-semibold">{content.footer.productTitle}</h3>
            <ul className="mt-4 space-y-3 text-xs text-[#F3EFE6]/70">{productLinks}</ul>
          </div>
          <FooterTextColumn
            title={content.footer.supportTitle}
            items={content.footer.supportItems}
          />
          <FooterTextColumn title={content.footer.legalTitle} items={content.footer.legalItems} />
          <p className="text-xs leading-5 text-[#F3EFE6]/60 lg:text-right">
            {content.footer.sampleNote}
            <br />
            {content.footer.address}
          </p>
        </div>
        <p className="text-xs text-[#F3EFE6]/60">
          © {new Date().getFullYear()} {content.brand}. {content.footer.legal}
        </p>
      </div>
    </footer>
  );
}
