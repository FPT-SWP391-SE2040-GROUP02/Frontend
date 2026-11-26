/* Lucian UX/UI Prompt #251 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#251 */
import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Clock, Lock, ShieldCheck, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prefersReducedMotion } from "../model/motion";
import { useLandingContent } from "../model/usePublicContent";
import { HEADING } from "./LandingChrome";
import { PadlockDemo } from "./LandingPadlock";
import { Reveal } from "./Reveal";
import "./lucian/u251.css";

/**
 * Gắn `is-in` cho các khối `data-rv` khi cuộn tới. Cuộn ngược lên cho khối ra khỏi đáy màn hình thì gỡ ra,
 * để lần cuộn xuống sau diễn lại.
 */
function useReplayReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    const blocks = Array.from(root.querySelectorAll("[data-rv]"));
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      for (const block of blocks) {
        block.classList.add("is-in");
      }
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
          } else if (
            entry.rootBounds !== null &&
            entry.boundingClientRect.top > entry.rootBounds.bottom - 1
          ) {
            entry.target.classList.remove("is-in");
          }
        }
      },
      { threshold: 0.18 },
    );
    for (const block of blocks) {
      observer.observe(block);
    }
    return () => observer.disconnect();
  }, []);
  return rootRef;
}

/** Mục bảo mật: ổ khóa minh họa, bốn điểm mạnh và ba giới hạn nói thật. */
export function SecuritySection() {
  const content = useLandingContent();
  const rootRef = useReplayReveal();
  const icons: LucideIcon[] = [Lock, ShieldCheck, UserCheck, Clock];

  const cards: ReactNode[] = [];
  let index = 0;
  for (const item of content.trust.items) {
    const Icon = icons[index];
    // Cột bên phải dâng chậm hơn cột trái một nhịp.
    const style = { "--d": `${(index % 2) * 0.09}s` } as CSSProperties;
    cards.push(
      <li key={item.title} data-rv="" className="u251-cd" style={style}>
        <span className="u251-ic">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h3 className={`${HEADING} mt-4 text-2xl text-heritage-sunken`}>{item.title}</h3>
        <p className="mt-2 text-base leading-7 text-heritage-sunken/75">{item.detail}</p>
      </li>,
    );
    index = index + 1;
  }

  const limits: ReactNode[] = [];
  let limitIndex = 0;
  for (const item of content.honesty) {
    limits.push(
      <Reveal key={item.title} delay={limitIndex * 120}>
        <h4 className={`${HEADING} text-xl text-heritage-gold-soft`}>{item.title}</h4>
        <p className="mt-2 text-sm leading-6 text-heritage-sunken/70">{item.detail}</p>
      </Reveal>,
    );
    limitIndex = limitIndex + 1;
  }

  return (
    <section id="bao-mat" className="bg-heritage-text px-4 py-24 sm:px-8 sm:py-32">
      <div ref={rootRef} className="ux ux-night u251 mx-auto max-w-6xl">
        <div data-rv="" className="u251-hd max-w-3xl">
          <p className={`${HEADING} text-lg italic text-heritage-gold`}>{content.trust.eyebrow}</p>
          <div className="mt-3">
            <h2 className={`${HEADING} text-4xl leading-snug text-heritage-sunken sm:text-5xl`}>
              {content.trust.title}
            </h2>
          </div>
          <p className="mt-6 text-lg leading-8 text-heritage-sunken/75">
            {content.trust.description}
          </p>
        </div>
        <div className="mt-16 grid gap-5 lg:grid-cols-[1fr_1.8fr]">
          <PadlockDemo />
          <ul className="grid content-start gap-5 sm:grid-cols-2">{cards}</ul>
        </div>
        <div className="mt-20 border-t border-heritage-sunken/15 pt-12">
          <Reveal>
            <h3 className={`${HEADING} text-3xl text-heritage-sunken`}>
              {content.trust.limitsTitle}
            </h3>
          </Reveal>
          <div className="mt-8 grid gap-8 md:grid-cols-3">{limits}</div>
        </div>
      </div>
    </section>
  );
}
