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

/* Chân trang: một tông vàng cho tiêu đề cột, một tông kem cho liên kết; chữ từ 16px, vùng bấm cao 44px. */
const FOOTER_TITLE = "text-base font-semibold text-[#7A5B24]";
const FOOTER_LIST = "mt-3 space-y-1";
const FOOTER_LINK =
  "inline-flex min-h-11 items-center text-base text-[#2C4136] hover:text-[#7A5B24] hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#7A5B24]";

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
        className={`inline-flex min-h-11 shrink-0 items-center text-sm text-[#F3EFE6]/80 transition-colors duration-200 hover:text-[#E6C98B] ${FOCUS_RING}`}
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
      <div className="flex items-center gap-2">
        <Link
          to={loginTarget}
          className={`inline-flex min-h-11 items-center rounded-md border border-[#E6C98B]/60 px-4 text-sm text-[#E6C98B] transition-colors duration-200 hover:bg-[#E6C98B]/10 ${FOCUS_RING}`}
        >
          {loginLabel}
        </Link>
        {/* Chỉ khách chưa đăng nhập mới thấy nút Đăng ký. */}
        {isGuest && (
          <Link
            to={ROUTES.AUTH.REGISTER}
            className={`inline-flex min-h-11 items-center rounded-md landing-press bg-[#B68F4C] px-4 text-sm font-semibold text-[#0A281E] hover:bg-[#E6C98B] ${FOCUS_RING}`}
          >
            {content.register}
          </Link>
        )}
      </div>
    </header>
  );
}

function FooterBullets({ items }: { items: readonly string[] }) {
  const rows: ReactNode[] = [];
  for (const item of items) {
    rows.push(
      <li key={item} className="flex items-start gap-2 font-serif text-lg text-[#14241C]">
        <span className="text-[#7A5B24]" aria-hidden="true">
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
        <Link to={item.to} className={FOOTER_LINK}>
          {item.label}
        </Link>
      </li>,
    );
  }
  return (
    <div>
      <h3 className={FOOTER_TITLE}>{title}</h3>
      <ul className={FOOTER_LIST}>{rows}</ul>
    </div>
  );
}

/** Chân trang đầy đủ của landing, dùng lại ở các trang hỗ trợ và pháp lý để giao diện thống nhất. */
export function LandingFooter({ onLanding }: { onLanding: boolean }) {
  const productLinks: ReactNode[] = [];
  for (const link of content.footer.productLinks) {
    productLinks.push(
      <li key={link.href}>
        <a href={anchorHref(link.href, onLanding)} className={FOOTER_LINK}>
          {link.label}
        </a>
      </li>,
    );
  }

  return (
    <footer className="landing-footer bg-white px-4 pb-10 pt-14 text-[#14241C] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-3 font-serif text-2xl">
              <LegacyVaultMark className="size-10 shrink-0" />
              {content.brand}
            </p>
            <p className={`${HEADING} mt-3 text-base italic text-[#7A5B24]`}>
              {content.footer.tagline}
            </p>
          </div>
          <div>
            <h3 className={FOOTER_TITLE}>{content.footer.commitmentTitle}</h3>
            <FooterBullets items={content.footer.commitments} />
          </div>
        </div>
        <div className="grid gap-8 border-t border-[#14241C]/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className={FOOTER_TITLE}>{content.footer.productTitle}</h3>
            <ul className={FOOTER_LIST}>{productLinks}</ul>
          </div>
          <FooterTextColumn
            title={content.footer.supportTitle}
            items={content.footer.supportItems}
          />
          <FooterTextColumn title={content.footer.legalTitle} items={content.footer.legalItems} />
          <p className="text-sm leading-6 text-[#4E6257] lg:text-right">
            {content.footer.sampleNote}
            <br />
            {content.footer.address}
          </p>
        </div>
        <p className="text-sm text-[#4E6257]">
          ©{new Date().getFullYear()} {content.brand}. {content.footer.legal}
        </p>
      </div>
    </footer>
  );
}
