import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { ROUTES } from "@/shared/config/routes.config";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import guillocheMarkup from "@/shared/assets/legacyvault-guilloche.svg?raw";
import { LANDING_CONTENT as content } from "./model/landing.content";
import "./landing.css";

/*
 * Landing công khai theo Mẫu G "Bông hoa là logo". Màu cố định theo bản thiết kế (nền xanh đậm / kem)
 * nên không đổi theo chế độ tối của ứng dụng.
 */
const FOCUS_RING =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#E6C98B]";
const GOLD_BUTTON = `inline-flex min-h-12 items-center justify-center rounded-md bg-[#B68F4C] px-6 text-sm font-semibold text-[#0A281E] transition-colors hover:bg-[#E6C98B] ${FOCUS_RING}`;
const HEADING = "font-serif font-normal tracking-normal";

/**
 * Hoa nhúng trực tiếp để CSS của trang điều khiển được phần `.spin` bên trong SVG
 * (thẻ img không cho CSS ngoài vào). Nguồn là asset của dự án, không phải dữ liệu người dùng.
 */
function AnimatedGuilloche({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`landing-flower ${className}`}
      dangerouslySetInnerHTML={{ __html: guillocheMarkup }}
    />
  );
}

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  description: string;
  dark?: boolean;
}

function SectionHead({ eyebrow, title, description, dark }: SectionHeadProps) {
  let titleColor = "text-[#0A281E]";
  let descriptionColor = "text-[#4E6257]";
  if (dark) {
    titleColor = "text-[#F3EFE6]";
    descriptionColor = "text-[#F3EFE6]/75";
  }
  return (
    <div>
      <p className={`${HEADING} text-base italic text-[#B68F4C]`}>{eyebrow}</p>
      <h2 className={`${HEADING} mt-2 text-3xl leading-tight sm:text-4xl ${titleColor}`}>
        {title}
      </h2>
      <p className={`mt-4 text-base leading-7 ${descriptionColor}`}>{description}</p>
    </div>
  );
}

function LayerCards() {
  const cards: ReactNode[] = [];
  let layerNumber = 0;
  for (const layer of content.meaning.layers) {
    layerNumber = layerNumber + 1;
    cards.push(
      <li key={layer.title} className="rounded-lg border border-[#E0DACB] bg-[#FAF9F5] p-5">
        <span className={`${HEADING} text-3xl italic text-[#B68F4C]`}>{layerNumber}</span>
        <h3 className={`${HEADING} mt-2 text-xl leading-snug text-[#0A281E]`}>{layer.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#4E6257]">{layer.detail}</p>
      </li>,
    );
  }
  return <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards}</ol>;
}

function HowSteps() {
  const rows: ReactNode[] = [];
  let stepNumber = 0;
  for (const step of content.how.steps) {
    stepNumber = stepNumber + 1;
    rows.push(
      <li key={step.title} className="flex gap-5 border-b border-[#F3EFE6]/15 py-5 first:pt-0">
        <span className={`${HEADING} w-10 shrink-0 text-2xl italic text-[#B68F4C]`}>
          {String(stepNumber).padStart(2, "0")}
        </span>
        <div>
          <h3 className={`${HEADING} text-xl text-[#F3EFE6]`}>{step.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#F3EFE6]/70">{step.detail}</p>
        </div>
      </li>,
    );
  }
  return <ol>{rows}</ol>;
}

function HonestyColumns() {
  const columns: ReactNode[] = [];
  for (const item of content.honesty) {
    columns.push(
      <div key={item.title}>
        <h3 className={`${HEADING} text-xl text-[#0A281E]`}>{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#4E6257]">{item.detail}</p>
      </div>,
    );
  }
  return <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">{columns}</div>;
}

function PricingCards() {
  const cards: ReactNode[] = [];
  for (const plan of content.pricing.plans) {
    const features: ReactNode[] = [];
    for (const feature of plan.features) {
      features.push(
        <li key={feature} className="flex gap-2 text-sm leading-6 text-[#2C4136]">
          <span className="text-[#B68F4C]" aria-hidden="true">
            –
          </span>
          {feature}
        </li>,
      );
    }
    let cardBorder = "border-[#D8D2C4]";
    if (plan.name === content.pricing.featuredPlan) {
      cardBorder = "border-[#B68F4C]";
    }
    cards.push(
      <li key={plan.name} className={`rounded-lg border bg-[#FAF9F5] p-6 ${cardBorder}`}>
        <h3 className={`${HEADING} text-2xl text-[#0A281E]`}>{plan.name}</h3>
        <p className="mt-3 font-semibold text-[#7A5B24]">{plan.price}</p>
        <ul className="mt-4 space-y-2">{features}</ul>
      </li>,
    );
  }
  return <ul className="mt-10 grid gap-4 md:grid-cols-3">{cards}</ul>;
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

interface FooterPanelProps {
  title: string;
  items: readonly string[];
  cannot?: boolean;
}

/** Khung "Làm được" (dấu ✓ vàng) và "Chưa làm được" (dấu × xám). */
function FooterPanel({ title, items, cannot }: FooterPanelProps) {
  let mark = "✓";
  let markColor = "text-[#E6C98B]";
  if (cannot) {
    mark = "×";
    markColor = "text-[#F3EFE6]/50";
  }
  const rows: ReactNode[] = [];
  for (const item of items) {
    rows.push(
      <li key={item} className="flex items-start gap-3 text-xs text-[#F3EFE6]/85">
        <span className={markColor} aria-hidden="true">
          {mark}
        </span>
        {item}
      </li>,
    );
  }
  return (
    <div className="rounded-xl border border-[#E6C98B]/20 bg-[#F3EFE6]/5 p-5">
      <h3 className={`${HEADING} text-base text-[#E6C98B]`}>{title}</h3>
      <ul className="mt-4 space-y-3">{rows}</ul>
    </div>
  );
}

/** Cột chữ thuần: chưa có trang đích thật nên không tạo liên kết giả. */
function FooterTextColumn({ title, items }: { title: string; items: readonly string[] }) {
  const rows: ReactNode[] = [];
  for (const item of items) {
    rows.push(<li key={item}>{item}</li>);
  }
  return (
    <div>
      <h3 className="text-xs font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3 text-xs text-[#F3EFE6]/70">{rows}</ul>
    </div>
  );
}

/** Landing công khai; điều hướng đăng nhập/đăng ký dùng route thật của client. */
export function LandingPage() {
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
        href={item.href}
        className={`inline-flex min-h-11 shrink-0 items-center text-sm text-[#F3EFE6]/80 hover:text-[#E6C98B] ${FOCUS_RING}`}
      >
        {item.label}
      </a>,
    );
  }

  const productLinks: ReactNode[] = [];
  for (const link of content.footer.productLinks) {
    productLinks.push(
      <li key={link.href}>
        <a href={link.href} className={`hover:text-[#E6C98B] ${FOCUS_RING}`}>
          {link.label}
        </a>
      </li>,
    );
  }

  return (
    <div id="top" className="min-h-screen bg-[#EFECE6] font-sans text-[#14241C]">
      <a
        href="#landing-content"
        className="sr-only z-50 rounded-lg bg-[#FAF9F5] p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {content.skip}
      </a>

      <section className="bg-[#0A281E] text-[#F3EFE6]">
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
        <div
          id="landing-content"
          tabIndex={-1}
          className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-20 pt-8 text-center focus:outline-none sm:px-8 sm:pb-28"
        >
          <AnimatedGuilloche className="pointer-events-none size-72 sm:size-96" />
          <h1 className={`${HEADING} mt-6 text-5xl sm:text-7xl`}>{content.brand}</h1>
          <p className={`${HEADING} mt-4 text-xl italic text-[#E6C98B] sm:text-2xl`}>
            {content.hero.tagline}
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#F3EFE6]/80">
            {content.hero.description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={ROUTES.AUTH.REGISTER} className={GOLD_BUTTON}>
              {content.hero.start}
            </Link>
            <a
              href="#cach-hoat-dong"
              className={`inline-flex min-h-12 items-center justify-center rounded-md border border-[#E6C98B]/60 px-6 text-sm font-semibold text-[#E6C98B] hover:bg-[#E6C98B]/10 ${FOCUS_RING}`}
            >
              {content.hero.explore}
            </a>
          </div>
        </div>
      </section>

      <section id="y-nghia" className="px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <SectionHead
              eyebrow={content.meaning.eyebrow}
              title={content.meaning.title}
              description={content.meaning.description}
            />
          </div>
          <LayerCards />
        </div>
      </section>

      <section id="cach-hoat-dong" className="bg-[#14241C] px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-20">
          <SectionHead
            eyebrow={content.how.eyebrow}
            title={content.how.title}
            description={content.how.description}
            dark
          />
          <HowSteps />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-8 sm:py-20">
        <HonestyColumns />
      </section>

      <section id="goi" className="bg-[#E6E1D4] px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <SectionHead
              eyebrow={content.pricing.eyebrow}
              title={content.pricing.title}
              description={content.pricing.description}
            />
          </div>
          <PricingCards />
          <Link to={ROUTES.AUTH.REGISTER} className={`${GOLD_BUTTON} mt-8`}>
            {content.pricing.action}
          </Link>
        </div>
      </section>

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
          <div className="grid gap-4 md:grid-cols-2">
            <FooterPanel title={content.footer.canTitle} items={content.footer.can} />
            <FooterPanel title={content.footer.cannotTitle} items={content.footer.cannot} cannot />
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
    </div>
  );
}
