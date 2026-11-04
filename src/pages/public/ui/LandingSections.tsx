import {
  Check,
  Clock,
  FileText,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { LANDING_CONTENT as content } from "../model/landing.content";
import { FAQ_CONTENT } from "../model/publicInfo.content";
import { HEADING } from "./LandingChrome";
import { GOLD_BUTTON, OUTLINE_BUTTON, SectionHead } from "./landingParts";
import { Reveal } from "./Reveal";

/*
 * Các mục thân trang landing. Nền xen kẽ kem / xanh đậm để mỗi mục là một "màn" riêng, chữ lớn, khoảng
 * thở rộng. Màu cố định theo bản thiết kế, không đổi theo chế độ tối của ứng dụng.
 */
const SECTION_SPACE = "px-4 py-24 sm:px-8 sm:py-32";

/** Mục 1: vấn đề, ba loại tài sản thật của kho. */
export function ProblemSection() {
  const icons: LucideIcon[] = [Wallet, KeyRound, FileText];
  const cards: ReactNode[] = [];
  let index = 0;
  for (const item of content.problem.items) {
    const Icon = icons[index];
    cards.push(
      <Reveal
        as="li"
        key={item.title}
        delay={index * 120}
        className="landing-lift rounded-lg border border-[#E0DACB] bg-[#FAF9F5] p-7"
      >
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#0A281E] text-[#E6C98B]">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h3 className={`${HEADING} mt-5 text-2xl text-[#0A281E]`}>{item.title}</h3>
        <p className="mt-3 text-base leading-7 text-[#4E6257]">{item.detail}</p>
      </Reveal>,
    );
    index = index + 1;
  }
  return (
    <section id="van-de" className={`${SECTION_SPACE} bg-[#EFECE6]`}>
      <div className="mx-auto max-w-6xl">
        <SectionHead
          center
          eyebrow={content.problem.eyebrow}
          title={content.problem.title}
          description={content.problem.description}
        />
        <ul className="mt-16 grid gap-5 md:grid-cols-3">{cards}</ul>
        <Reveal className="mt-14 text-center">
          <p className={`${HEADING} text-2xl italic text-[#7A5B24] sm:text-3xl`}>
            {content.problem.closing}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** Mục 2: một câu khẳng định lớn trên nền xanh đậm, như dải nhấn giữa trang. */
export function StatementSection() {
  return (
    <section className="flex min-h-[70vh] items-center bg-[#14241C] px-4 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p
          className={`${HEADING} text-3xl leading-snug text-[#F3EFE6] sm:text-5xl sm:leading-tight`}
        >
          {content.statement.text}
        </p>
      </Reveal>
    </section>
  );
}

/** Mục 3: ba nguyên tắc, mỗi nguyên tắc một cột với số lớn. */
export function PrinciplesSection() {
  const columns: ReactNode[] = [];
  let index = 0;
  for (const item of content.principles.items) {
    columns.push(
      <Reveal key={item.title} delay={index * 140} className="border-t-2 border-[#B68F4C] pt-6">
        <span className={`${HEADING} text-5xl italic text-[#B68F4C]`}>{index + 1}</span>
        <h3 className={`${HEADING} mt-3 text-3xl text-[#0A281E]`}>{item.title}</h3>
        <p className="mt-4 text-base leading-7 text-[#4E6257]">{item.detail}</p>
      </Reveal>,
    );
    index = index + 1;
  }
  return (
    <section className={`${SECTION_SPACE} bg-[#EFECE6]`}>
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow={content.principles.eyebrow} title={content.principles.title} />
        <div className="mt-16 grid gap-10 md:grid-cols-3">{columns}</div>
      </div>
    </section>
  );
}

interface PillarRow {
  title: string;
  detail: string;
}

const PILLAR_ICONS: LucideIcon[][] = [
  [Wallet, KeyRound, FileText],
  [UserCheck, Users, ShieldCheck, Lock],
  [Clock, UserCheck, ShieldCheck, Users, Clock, Check],
];

/** Hình minh họa của một trụ cột: thẻ danh sách dựng bằng CSS, dùng dữ liệu mẫu. */
function PillarVisual({
  pillarIndex,
  title,
  rows,
}: {
  pillarIndex: number;
  title: string;
  rows: readonly PillarRow[];
}) {
  const icons = PILLAR_ICONS[pillarIndex];
  const items: ReactNode[] = [];
  let index = 0;
  for (const row of rows) {
    const Icon = icons[index];
    items.push(
      <li key={row.title} className="flex items-center gap-4 px-4 py-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0A281E] text-[#E6C98B]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#0A281E]">{row.title}</p>
          <p className="text-xs text-[#4E6257]">{row.detail}</p>
        </div>
      </li>,
    );
    index = index + 1;
  }
  return (
    <div className="rounded-xl border border-[#D8D2C4] bg-[#FAF9F5] p-5 shadow-[0_12px_24px_-10px_rgb(10_40_30/0.18)] sm:p-6">
      <p className={`${HEADING} mb-4 text-lg text-[#0A281E]`}>{title}</p>
      <ul className="divide-y divide-[#E0DACB]/70 overflow-hidden rounded-lg border border-[#E0DACB] bg-white">
        {items}
      </ul>
    </div>
  );
}

/**
 * Mục 4: ba trụ cột. Trên màn lớn mỗi trụ cột là một màn cao bằng khung nhìn và dính lên đầu trang,
 * màn sau trượt chồng lên màn trước; trên điện thoại chúng xếp dọc bình thường.
 */
export function PillarsSection() {
  const backgrounds = ["bg-[#FAF9F5]", "bg-[#F3EFE6]", "bg-[#E6E1D4]"];
  const screens: ReactNode[] = [];
  let index = 0;
  for (const pillar of content.pillars.items) {
    const points: ReactNode[] = [];
    for (const point of pillar.points) {
      points.push(
        <li key={point} className="flex gap-3 text-base leading-7 text-[#2C4136]">
          <Check className="mt-1 size-5 shrink-0 text-[#B68F4C]" aria-hidden="true" />
          {point}
        </li>,
      );
    }
    screens.push(
      <article
        key={pillar.tag}
        className={`${backgrounds[index]} flex items-center px-4 py-20 sm:px-8 lg:sticky lg:top-0 lg:min-h-screen lg:border-t lg:border-[#D8D2C4] lg:shadow-[0_-12px_20px_-15px_rgb(10_40_30/0.25)]`}
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className={`${HEADING} text-lg italic text-[#B68F4C]`}>{pillar.tag}</p>
            <h3 className={`${HEADING} mt-3 text-4xl leading-tight text-[#0A281E] sm:text-5xl`}>
              {pillar.title}
            </h3>
            <p className="mt-5 text-lg leading-8 text-[#4E6257]">{pillar.detail}</p>
            <ul className="mt-8 space-y-3">{points}</ul>
          </Reveal>
          <Reveal delay={150}>
            <PillarVisual pillarIndex={index} title={pillar.visualTitle} rows={pillar.rows} />
          </Reveal>
        </div>
      </article>,
    );
    index = index + 1;
  }
  return (
    <section id="he-thong">
      <div className="bg-[#EFECE6] px-4 pb-16 pt-24 sm:px-8 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow={content.pillars.eyebrow}
            title={content.pillars.title}
            description={content.pillars.description}
          />
        </div>
      </div>
      {screens}
    </section>
  );
}

/** Mục 5: bốn lớp xác nhận, dòng thời gian ngang trên nền xanh đậm. */
export function LayersSection() {
  const steps: ReactNode[] = [];
  let index = 0;
  for (const layer of content.meaning.layers) {
    steps.push(
      <Reveal as="li" key={layer.title} delay={index * 140} className="relative pt-10">
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 size-4 rounded-full border-2 border-[#E6C98B] bg-[#0A281E]"
        />
        <span className={`${HEADING} text-5xl italic text-[#B68F4C]`}>{index + 1}</span>
        <h3 className={`${HEADING} mt-3 text-2xl leading-snug text-[#F3EFE6]`}>{layer.title}</h3>
        <p className="mt-3 text-base leading-7 text-[#F3EFE6]/70">{layer.detail}</p>
      </Reveal>,
    );
    index = index + 1;
  }
  return (
    <section id="y-nghia" className={`${SECTION_SPACE} relative bg-[#0A281E]`}>
      <div className="mx-auto max-w-6xl">
        <SectionHead
          dark
          eyebrow={content.meaning.eyebrow}
          title={content.meaning.title}
          description={content.meaning.description}
        />
        <div className="relative mt-16">
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 top-2 hidden h-px bg-[#E6C98B]/40 lg:block"
          />
          <ol className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">{steps}</ol>
        </div>
      </div>
    </section>
  );
}

/** Mục 6: bốn bước thiết lập, thẻ lớn trên nền kem. */
export function HowSection() {
  const cards: ReactNode[] = [];
  let index = 0;
  for (const step of content.how.steps) {
    cards.push(
      <Reveal
        as="li"
        key={step.title}
        delay={index * 120}
        className="landing-lift rounded-lg border border-[#E0DACB] bg-[#FAF9F5] p-7"
      >
        <span className={`${HEADING} text-4xl italic text-[#B68F4C]`}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className={`${HEADING} mt-4 text-2xl text-[#0A281E]`}>{step.title}</h3>
        <p className="mt-3 text-base leading-7 text-[#4E6257]">{step.detail}</p>
      </Reveal>,
    );
    index = index + 1;
  }
  return (
    <section id="cach-hoat-dong" className={`${SECTION_SPACE} bg-[#EFECE6]`}>
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow={content.how.eyebrow}
          title={content.how.title}
          description={content.how.description}
        />
        <ol className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{cards}</ol>
      </div>
    </section>
  );
}

/** Mục 7: bảo mật nói thật, bốn điểm mạnh rồi ba giới hạn. */
export function TrustSection() {
  const icons: LucideIcon[] = [Lock, ShieldCheck, UserCheck, Clock];
  const cards: ReactNode[] = [];
  let index = 0;
  for (const item of content.trust.items) {
    const Icon = icons[index];
    cards.push(
      <Reveal
        as="li"
        key={item.title}
        delay={index * 100}
        className="rounded-lg border border-[#F3EFE6]/15 bg-[#F3EFE6]/5 p-7 transition-colors duration-300 hover:border-[#B68F4C]"
      >
        <Icon className="size-8 text-[#E6C98B]" aria-hidden="true" />
        <h3 className={`${HEADING} mt-5 text-2xl text-[#F3EFE6]`}>{item.title}</h3>
        <p className="mt-3 text-base leading-7 text-[#F3EFE6]/70">{item.detail}</p>
      </Reveal>,
    );
    index = index + 1;
  }
  const limits: ReactNode[] = [];
  let limitIndex = 0;
  for (const item of content.honesty) {
    limits.push(
      <Reveal key={item.title} delay={limitIndex * 120}>
        <h4 className={`${HEADING} text-xl text-[#E6C98B]`}>{item.title}</h4>
        <p className="mt-2 text-sm leading-6 text-[#F3EFE6]/70">{item.detail}</p>
      </Reveal>,
    );
    limitIndex = limitIndex + 1;
  }
  return (
    <section id="bao-mat" className={`${SECTION_SPACE} bg-[#14241C]`}>
      <div className="mx-auto max-w-6xl">
        <SectionHead
          dark
          eyebrow={content.trust.eyebrow}
          title={content.trust.title}
          description={content.trust.description}
        />
        <ul className="mt-16 grid gap-5 sm:grid-cols-2">{cards}</ul>
        <div className="mt-20 border-t border-[#F3EFE6]/15 pt-12">
          <Reveal>
            <h3 className={`${HEADING} text-3xl text-[#F3EFE6]`}>{content.trust.limitsTitle}</h3>
          </Reveal>
          <div className="mt-8 grid gap-8 md:grid-cols-3">{limits}</div>
        </div>
      </div>
    </section>
  );
}

/** Mục 8: gói dịch vụ. */
export function PricingSection() {
  const cards: ReactNode[] = [];
  let index = 0;
  for (const plan of content.pricing.plans) {
    const features: ReactNode[] = [];
    for (const feature of plan.features) {
      features.push(
        <li key={feature} className="flex gap-3 text-base leading-7 text-[#2C4136]">
          <Check className="mt-1 size-5 shrink-0 text-[#B68F4C]" aria-hidden="true" />
          {feature}
        </li>,
      );
    }
    let cardBorder = "border-[#D8D2C4]";
    if (plan.name === content.pricing.featuredPlan) {
      cardBorder = "border-[#B68F4C] shadow-[0_10px_20px_-10px_rgb(182_143_76/0.45)]";
    }
    cards.push(
      <Reveal
        as="li"
        key={plan.name}
        delay={index * 120}
        className={`landing-lift rounded-lg border bg-[#FAF9F5] p-8 ${cardBorder}`}
      >
        <h3 className={`${HEADING} text-3xl text-[#0A281E]`}>{plan.name}</h3>
        <p className="mt-3 text-lg font-semibold text-[#7A5B24]">{plan.price}</p>
        <ul className="mt-6 space-y-3">{features}</ul>
      </Reveal>,
    );
    index = index + 1;
  }
  return (
    <section id="goi" className={`${SECTION_SPACE} bg-[#E6E1D4]`}>
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow={content.pricing.eyebrow}
          title={content.pricing.title}
          description={content.pricing.description}
        />
        <ul className="mt-16 grid gap-5 md:grid-cols-3">{cards}</ul>
        <Reveal delay={200} className="mt-10">
          <Link to={ROUTES.AUTH.REGISTER} className={GOLD_BUTTON}>
            {content.pricing.action}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/** Mục 9: hỏi đáp, lấy các câu đầu của trang Hỏi đáp để hai nơi không lệch nhau. */
export function FaqSection() {
  const rows: ReactNode[] = [];
  let count = 0;
  for (const group of FAQ_CONTENT.groups) {
    for (const item of group.items) {
      if (count >= content.faq.limit) {
        break;
      }
      rows.push(
        <details key={item.question} className="landing-faq group border-b border-[#D8D2C4]">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className={`${HEADING} text-xl text-[#0A281E] sm:text-2xl`}>{item.question}</span>
            <span
              aria-hidden="true"
              className="text-3xl leading-[1.3] text-[#B68F4C] transition-transform duration-300 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="landing-faq-answer max-w-prose pb-6 pr-10 text-base leading-7 text-[#4E6257]">
            {item.answer}
          </p>
        </details>,
      );
      count = count + 1;
    }
  }
  return (
    <section id="hoi-dap" className={`${SECTION_SPACE} bg-[#EFECE6]`}>
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <SectionHead eyebrow={content.faq.eyebrow} title={content.faq.title} />
          <Reveal delay={150} className="mt-8">
            <Link
              to={ROUTES.PUBLIC.FAQ}
              className="text-base font-semibold text-[#7A5B24] underline underline-offset-4 hover:text-[#0A281E]"
            >
              {content.faq.all}
            </Link>
          </Reveal>
        </div>
        <Reveal delay={100}>{rows}</Reveal>
      </div>
    </section>
  );
}

/** Mục cuối: lời mời bắt đầu, nền xanh đậm như phần hero. */
export function FinalCtaSection() {
  return (
    <section className="flex min-h-[60vh] items-center bg-[#0A281E] px-4 py-24 text-center sm:px-8">
      <Reveal className="mx-auto max-w-3xl">
        <h2 className={`${HEADING} text-4xl text-[#F3EFE6] sm:text-6xl`}>{content.cta.title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#F3EFE6]/75">
          {content.cta.description}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to={ROUTES.AUTH.REGISTER} className={GOLD_BUTTON}>
            {content.cta.primary}
          </Link>
          <Link to={ROUTES.AUTH.LOGIN} className={OUTLINE_BUTTON}>
            {content.cta.secondary}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
