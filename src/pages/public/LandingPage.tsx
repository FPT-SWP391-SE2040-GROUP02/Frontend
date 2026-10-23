import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { LANDING_CONTENT as content } from "./model/landing.content";
import {
  AnimatedGuilloche,
  FOCUS_RING,
  HEADING,
  LandingFooter,
  LandingHeader,
} from "./ui/LandingChrome";

/*
 * Landing công khai theo Mẫu G "Bông hoa là logo". Màu cố định theo bản thiết kế (nền xanh đậm / kem)
 * nên không đổi theo chế độ tối của ứng dụng.
 */
const GOLD_BUTTON = `inline-flex min-h-12 items-center justify-center rounded-md bg-[#B68F4C] px-6 text-sm font-semibold text-[#0A281E] transition-colors hover:bg-[#E6C98B] ${FOCUS_RING}`;

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

/** Landing công khai; điều hướng đăng nhập/đăng ký dùng route thật của client. */
export function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-[#EFECE6] font-sans text-[#14241C]">
      <a
        href="#landing-content"
        className="sr-only z-50 rounded-lg bg-[#FAF9F5] p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {content.skip}
      </a>

      <section className="relative overflow-hidden bg-[#0A281E] text-[#F3EFE6]">
        {/* Hoa chìm làm nền: phủ rộng sau chữ, mờ dần ra mép để chữ vẫn dễ đọc. */}
        <AnimatedGuilloche className="pointer-events-none absolute left-1/2 top-1/2 size-[48rem] -translate-x-1/2 -translate-y-1/2 opacity-50 sm:size-[64rem]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#0A281E_88%)]"
        />
        <div className="relative">
          <LandingHeader onLanding />
          <div
            id="landing-content"
            tabIndex={-1}
            className="mx-auto flex min-h-[32rem] max-w-3xl flex-col items-center justify-center px-4 pb-24 pt-16 text-center focus:outline-none sm:min-h-[42rem] sm:px-8 sm:pb-32 sm:pt-24"
          >
            <h1 className={`${HEADING} text-6xl sm:text-8xl`}>{content.brand}</h1>
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

      <LandingFooter onLanding />
    </div>
  );
}
