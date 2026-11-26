/* Lucian UX/UI Prompt #370 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#370 */
import { useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { clamp01, prefersReducedMotion, useScrollFrame } from "../model/motion";
import { useLandingContent } from "../model/usePublicContent";
import { HEADING } from "./LandingChrome";
import { SignatureLine } from "./LandingSignatures";
import { SectionHead } from "./landingParts";
import "./lucian/u370.css";

/** Mục bàn giao: các bước từ lúc người nhận gửi yêu cầu tới lúc tải về, sáng dần theo cuộn. */
export function HandoverSection() {
  const content = useLandingContent();
  const handover = content.handover;
  const timelineRef = useRef<HTMLDivElement>(null);

  const paint = useCallback(() => {
    const timeline = timelineRef.current;
    if (timeline === null) {
      return;
    }
    const box = timeline.getBoundingClientRect();
    // Đầu vạch sáng nằm ở 60% chiều cao màn hình.
    const tip = window.innerHeight * 0.6 - box.top;
    let progress = 1;
    const still = prefersReducedMotion();
    if (!still && box.height > 0) {
      progress = clamp01(tip / box.height);
    }
    timeline.style.setProperty("--p", progress.toFixed(4));
    for (const step of Array.from(timeline.querySelectorAll<HTMLElement>(".u370-ev"))) {
      const reached = still || step.getBoundingClientRect().top - box.top + 32 <= tip;
      step.classList.toggle("on", reached);
    }
  }, []);
  useScrollFrame(paint);

  const steps: ReactNode[] = [];
  let index = 0;
  for (const step of handover.steps) {
    let extra: ReactNode = null;
    if (step.signing) {
      extra = <SignatureLine />;
    }
    steps.push(
      <li key={step.title} className="u370-ev">
        <span className="u370-dot" aria-hidden="true" />
        <div className="u370-cd">
          <p className={`${HEADING} text-3xl italic text-heritage-gold-soft`}>{index + 1}</p>
          <h3 className={`${HEADING} mt-2 text-2xl leading-snug text-heritage-sunken`}>
            {step.title}
          </h3>
          <p className="mt-3 text-base leading-7 text-heritage-sunken/75">{step.detail}</p>
          {extra}
        </div>
      </li>,
    );
    index = index + 1;
  }

  return (
    <section id="cach-hoat-dong" className="bg-heritage-primary px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionHead
          dark
          center
          eyebrow={handover.eyebrow}
          title={handover.title}
          description={handover.description}
        />
        <div ref={timelineRef} className="ux ux-night u370 u370-tl mt-16">
          <span className="u370-ln" aria-hidden="true">
            <i />
          </span>
          <ol>{steps}</ol>
        </div>
      </div>
    </section>
  );
}
