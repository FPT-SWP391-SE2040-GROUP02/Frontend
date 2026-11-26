/* Lucian UX/UI Prompt #056 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#056 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { RollingNumber } from "@/shared/ui/VaultFx";
import { useLandingContent, type PricingCard } from "../model/usePublicContent";
import { GOLD_BUTTON, SectionHead } from "./landingParts";
import "./lucian/u056.css";

const money = new Intl.NumberFormat("vi-VN");

/** Các kỳ (số năm) đang có giá ở ít nhất một gói, tăng dần. */
function termYears(plans: readonly PricingCard[]): number[] {
  const years: number[] = [];
  for (const plan of plans) {
    for (const term of plan.terms ?? []) {
      if (!years.includes(term.years)) {
        years.push(term.years);
      }
    }
  }
  years.sort((a, b) => a - b);
  return years;
}

/** Giá của một gói ở kỳ đang chọn. Chưa tải được giá theo kỳ thì giữ câu giá có sẵn. */
function PlanPrice({ plan, years }: { plan: PricingCard; years: number | undefined }) {
  if (!plan.terms || plan.terms.length === 0) {
    return <span className="text-base font-semibold text-heritage-warning">{plan.price}</span>;
  }
  for (const term of plan.terms) {
    if (term.years === years) {
      return (
        <>
          <RollingNumber value={`${money.format(term.amount)}đ`} />
          <small className="block text-sm text-heritage-muted">/ {term.serviceDays} ngày</small>
        </>
      );
    }
  }
  return <span className="text-sm text-heritage-muted">Không bán kỳ này</span>;
}

/** Khối chọn kỳ và gói. Giá, dung lượng, mô tả đều lấy từ Backend qua `useLandingContent`. */
function PlanPicker() {
  const content = useLandingContent().pricing;
  const groupName = useId();
  const [chosenName, setChosenName] = useState<string | null>(null);
  const [chosenYears, setChosenYears] = useState<number | null>(null);

  const years = termYears(content.plans);
  let activeYears = years[0];
  if (chosenYears !== null && years.includes(chosenYears)) {
    activeYears = chosenYears;
  }

  let selected = content.plans[0];
  let selectedIndex = 0;
  const wanted = chosenName ?? content.featuredPlan;
  for (let index = 0; index < content.plans.length; index += 1) {
    if (content.plans[index].name === wanted) {
      selected = content.plans[index];
      selectedIndex = index;
    }
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);

  /** Đặt nút trượt và khung viền đúng chỗ của lựa chọn hiện tại. */
  const place = useCallback(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    const option = root.querySelector<HTMLElement>('.u056-sw button[aria-checked="true"]');
    if (option !== null && knobRef.current !== null) {
      knobRef.current.style.setProperty("--x", `${option.offsetLeft - 4}px`);
      knobRef.current.style.setProperty("--w", `${option.offsetWidth}px`);
    }
    const card = root.querySelectorAll<HTMLElement>(".u056-p")[selectedIndex];
    if (card !== undefined && ringRef.current !== null) {
      ringRef.current.style.setProperty("--y", `${card.offsetTop}px`);
      ringRef.current.style.setProperty("--h", `${card.offsetHeight}px`);
    }
  }, [selectedIndex]);

  useEffect(() => {
    place();
    if (typeof ResizeObserver === "undefined" || rootRef.current === null) {
      return;
    }
    const observer = new ResizeObserver(place);
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [place, activeYears, content.plans]);

  /** Mũi tên trái/phải chuyển kỳ, đúng hành vi nhóm radio. */
  function moveTerm(event: KeyboardEvent<HTMLButtonElement>): void {
    let step = 0;
    if (event.key === "ArrowRight") {
      step = 1;
    } else if (event.key === "ArrowLeft") {
      step = -1;
    }
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const next = (years.indexOf(activeYears) + step + years.length) % years.length;
    setChosenYears(years[next]);
    const buttons = rootRef.current?.querySelectorAll<HTMLButtonElement>(".u056-sw button");
    buttons?.[next]?.focus();
  }

  const options: ReactNode[] = [];
  for (const value of years) {
    const active = value === activeYears;
    let tabIndex = -1;
    if (active) {
      tabIndex = 0;
    }
    options.push(
      <button
        key={value}
        type="button"
        role="radio"
        aria-checked={active}
        tabIndex={tabIndex}
        onClick={() => setChosenYears(value)}
        onKeyDown={moveTerm}
      >
        {value} năm
      </button>,
    );
  }

  const cards: ReactNode[] = [];
  for (const plan of content.plans) {
    cards.push(
      <label key={plan.name} className="u056-p">
        <input
          type="radio"
          name={groupName}
          checked={plan.name === selected.name}
          onChange={() => setChosenName(plan.name)}
        />
        <span className="u056-dot" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <b className="whitespace-nowrap font-serif text-xl font-normal text-heritage-primary sm:text-2xl">
            {plan.name}
          </b>
        </span>
        <span className="text-right">
          <PlanPrice plan={plan} years={activeYears} />
        </span>
      </label>,
    );
  }

  const features: ReactNode[] = [];
  let featureIndex = 0;
  for (const feature of selected.features) {
    features.push(
      <li key={`${selected.name}-${feature}`} style={{ "--i": featureIndex } as CSSProperties}>
        <svg viewBox="0 0 18 18" aria-hidden="true">
          <path d="M4 9.4l3.2 3.2L14 5.6" />
        </svg>
        {feature}
      </li>,
    );
    featureIndex = featureIndex + 1;
  }

  return (
    <div ref={rootRef} className="ux u056">
      {years.length > 1 && (
        <div className="u056-sw" role="radiogroup" aria-label="Kỳ dịch vụ">
          <span ref={knobRef} className="u056-knob" aria-hidden="true" />
          {options}
        </div>
      )}
      <fieldset className="u056-plans">
        <legend className="sr-only">Gói dịch vụ</legend>
        <span ref={ringRef} className="u056-ring" aria-hidden="true" />
        {cards}
      </fieldset>
      <ul className="u056-feat" aria-live="polite">
        {features}
      </ul>
      <Link to={ROUTES.AUTH.REGISTER} className={GOLD_BUTTON}>
        {content.action}
      </Link>
    </div>
  );
}

/** Mục gói dịch vụ. */
export function PricingSection() {
  const content = useLandingContent().pricing;
  return (
    <section id="goi" className="bg-heritage-border px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <SectionHead
            eyebrow={content.eyebrow}
            title={content.title}
            description={content.description}
          />
        </div>
        <PlanPicker />
      </div>
    </section>
  );
}
