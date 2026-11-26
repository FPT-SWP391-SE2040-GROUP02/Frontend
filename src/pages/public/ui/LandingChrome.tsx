/* Lucian UX/UI Prompt #212 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#212 */
/* Lucian UX/UI Prompt #236 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#236 */
import { useCallback, useRef } from "react";
import type { FocusEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { ROUTES } from "@/shared/config/routes.config";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import guillocheMarkup from "@/shared/assets/legacyvault-guilloche.svg?raw";
import { LANDING_CONTENT as content } from "../model/landing.content";
import { clamp01, useScrollFrame } from "../model/motion";
import "../landing.css";
import "./lucian/tokens.css";
import "./lucian/u212.css";
import "./lucian/u236.css";

/*
 * Phần khung dùng chung của landing và các trang công khai (hỗ trợ, pháp lý): hoa hero, thanh đầu trang,
 * chân trang. Màu cố định theo bản thiết kế (nền xanh đậm / kem) nên không đổi theo chế độ tối.
 */
export const FOCUS_RING =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-heritage-gold-soft";
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

/**
 * Thanh trên cùng của trang giới thiệu (#212): trong suốt ở đỉnh, cuộn xuống thì ẩn, cuộn lên thì hiện lại.
 * Tab vào một liên kết trên thanh khi nó đang ẩn thì hiện ra ngay.
 */
function ScrollHeader({ children }: { children: ReactNode }) {
  const barRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const lastY = useRef(0);
  const travelled = useRef(0);

  const update = useCallback(() => {
    const bar = barRef.current;
    if (bar === null) {
      return;
    }
    const y = window.scrollY;
    const delta = y - lastY.current;
    lastY.current = y;
    // Cộng dồn quãng cuộn cùng chiều để rung tay không làm thanh nhấp nháy.
    if (delta > 0 === travelled.current > 0) {
      travelled.current = travelled.current + delta;
    } else {
      travelled.current = delta;
    }
    bar.classList.toggle("is-solid", y > 20);
    if (y < 60) {
      bar.classList.remove("is-hide");
    } else if (travelled.current > 8) {
      bar.classList.add("is-hide");
    } else if (travelled.current < -6) {
      bar.classList.remove("is-hide");
    }
    if (progressRef.current !== null) {
      const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progressRef.current.style.width = `${(clamp01(y / distance) * 100).toFixed(1)}%`;
    }
  }, []);
  useScrollFrame(update);

  function showBar(event: FocusEvent<HTMLElement>): void {
    event.currentTarget.classList.remove("is-hide");
  }

  return (
    <header ref={barRef} className="u212-hd" onFocus={showBar}>
      {children}
      <span ref={progressRef} className="u212-pg" aria-hidden="true" />
    </header>
  );
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
        className={`inline-flex min-h-11 shrink-0 items-center text-sm text-heritage-sunken/80 transition-colors duration-200 hover:text-heritage-gold-soft ${FOCUS_RING}`}
      >
        {item.label}
      </a>,
    );
  }

  const bar = (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-8 sm:py-4">
      <Link
        to={accountHome}
        aria-label={`${content.brand}, về trang chủ`}
        className={`flex min-h-11 items-center gap-1.5 font-serif text-base sm:gap-2 sm:text-lg ${FOCUS_RING}`}
      >
        <LegacyVaultMark className="size-7 sm:size-8" />
        {/* Màn hẹp chỉ giữ biểu tượng để logo và hai nút nằm chung một hàng. */}
        <span className="max-[430px]:sr-only">{content.brand}</span>
      </Link>
      {/* Căn giữa "an toàn": màn hẹp thì bắt đầu từ mục đầu để cuộn ngang tới được mọi mục. */}
      <nav
        aria-label={content.navLabel}
        className="order-3 flex w-full gap-6 overflow-x-auto [justify-content:safe_center] md:order-none md:w-auto"
      >
        {navLinks}
      </nav>
      <div className="flex items-center gap-2">
        <Link
          to={loginTarget}
          className={`inline-flex min-h-11 items-center rounded-md border border-heritage-gold-soft/60 px-3 text-sm text-heritage-gold-soft transition-colors duration-200 hover:bg-heritage-gold-soft/10 sm:px-4 ${FOCUS_RING}`}
        >
          {loginLabel}
        </Link>
        {/* Chỉ khách chưa đăng nhập mới thấy nút Đăng ký. */}
        {isGuest && (
          <Link
            to={ROUTES.AUTH.REGISTER}
            className={`inline-flex min-h-11 items-center rounded-md landing-press bg-heritage-gold px-3 text-sm font-semibold text-heritage-primary hover:bg-heritage-gold-soft sm:px-4 ${FOCUS_RING}`}
          >
            {content.register}
          </Link>
        )}
      </div>
    </div>
  );

  // Trang hỗ trợ, pháp lý giữ thanh đầu trang đứng yên.
  if (onLanding) {
    return <ScrollHeader>{bar}</ScrollHeader>;
  }
  return <header>{bar}</header>;
}

function FooterBullets({ items }: { items: readonly string[] }) {
  const rows: ReactNode[] = [];
  for (const item of items) {
    rows.push(
      <li key={item} className="flex items-start gap-2 font-serif text-lg text-heritage-sunken">
        <span className="text-heritage-gold-soft" aria-hidden="true">
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
        <Link to={item.to} className={`hover:text-heritage-gold-soft ${FOCUS_RING}`}>
          {item.label}
        </Link>
      </li>,
    );
  }
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-heritage-sunken/70">{rows}</ul>
    </div>
  );
}

/** Chân trang đầy đủ của landing, dùng lại ở các trang hỗ trợ và pháp lý để giao diện thống nhất. */
export function LandingFooter({ onLanding }: { onLanding: boolean }) {
  const productLinks: ReactNode[] = [];
  for (const link of content.footer.productLinks) {
    productLinks.push(
      <li key={link.href}>
        <a
          href={anchorHref(link.href, onLanding)}
          className={`hover:text-heritage-gold-soft ${FOCUS_RING}`}
        >
          {link.label}
        </a>
      </li>,
    );
  }

  const curtainRef = useRef<HTMLDivElement>(null);

  /** #236: ghim chân trang dưới thân trang và cho nó lớn, sáng dần theo quãng đã lộ ra. */
  const reveal = useCallback(() => {
    const curtain = curtainRef.current;
    if (curtain === null || !onLanding) {
      return;
    }
    const height = curtain.offsetHeight;
    const fits = height > 0 && height <= window.innerHeight;
    curtain.classList.toggle("is-curtain", fits);
    if (fits) {
      const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      curtain.style.setProperty("--r", clamp01(1 - remaining / height).toFixed(3));
    }
  }, [onLanding]);
  useScrollFrame(reveal);

  /** Liên kết ở chân trang đang bị che mà được tab tới thì cuộn xuống cho thấy. */
  function showFooter(): void {
    if (curtainRef.current?.classList.contains("is-curtain")) {
      window.scrollTo({ top: document.documentElement.scrollHeight });
    }
  }

  let wordmark: ReactNode = null;
  if (onLanding) {
    wordmark = (
      <div className={`u236-wm ${HEADING}`} aria-hidden="true">
        {content.brand}
      </div>
    );
  }

  // Ở landing chân trang xếp gọn hơn để vừa một màn hình, có vậy mới lộ dần được.
  let outerSpace = "pb-10 pt-14";
  let innerSpace = "space-y-10";
  if (onLanding) {
    outerSpace = "pb-4 pt-10";
    innerSpace = "space-y-6";
  }

  const footer = (
    <footer
      className={`landing-footer bg-heritage-primary px-4 text-heritage-sunken sm:px-8 ${outerSpace}`}
      onFocus={showFooter}
    >
      <div className={`mx-auto max-w-6xl ${innerSpace}`}>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-3 font-serif text-2xl">
              <LegacyVaultMark className="size-10 shrink-0" />
              {content.brand}
            </p>
            <p className={`${HEADING} mt-3 text-base italic text-heritage-gold-soft`}>
              {content.footer.tagline}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-heritage-gold-soft">{content.footer.commitmentTitle}</h3>
            <FooterBullets items={content.footer.commitments} />
          </div>
        </div>
        <div className="grid gap-8 border-t border-heritage-sunken/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold">{content.footer.productTitle}</h3>
            <ul className="mt-4 space-y-3 text-sm text-heritage-sunken/70">{productLinks}</ul>
          </div>
          <FooterTextColumn
            title={content.footer.supportTitle}
            items={content.footer.supportItems}
          />
          <FooterTextColumn title={content.footer.legalTitle} items={content.footer.legalItems} />
          <p className="text-sm leading-5 text-heritage-sunken/60 lg:text-right">
            {content.footer.sampleNote}
            <br />
            {content.footer.address}
          </p>
        </div>
        <p className="text-sm text-heritage-sunken/60">
          © {new Date().getFullYear()} {content.brand}. {content.footer.legal}
        </p>
        {wordmark}
      </div>
    </footer>
  );

  if (onLanding) {
    return (
      <div ref={curtainRef} className="u236">
        {footer}
      </div>
    );
  }
  return footer;
}
