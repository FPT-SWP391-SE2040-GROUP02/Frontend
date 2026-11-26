/* Lucian UX/UI Prompt #260 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#260 */
import { useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { FileText, KeyRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clamp01, prefersReducedMotion, useScrollFrame } from "../model/motion";
import { useLandingContent } from "../model/usePublicContent";
import { HEADING } from "./LandingChrome";
import { Reveal } from "./Reveal";
import "./lucian/u260.css";

/** Tách câu thành từng chữ; chữ nằm trong cụm được nhấn sẽ đổi sang màu vàng khi được tô. */
function sentenceWords(sentence: string, highlights: readonly string[]): ReactNode[] {
  const ranges: { start: number; end: number }[] = [];
  for (const phrase of highlights) {
    const start = sentence.indexOf(phrase);
    if (start >= 0) {
      ranges.push({ start, end: start + phrase.length });
    }
  }

  const words: ReactNode[] = [];
  let position = 0;
  for (const word of sentence.split(" ")) {
    let className = "u260-w";
    for (const range of ranges) {
      if (position >= range.start && position < range.end) {
        className = "u260-w em";
      }
    }
    if (position > 0) {
      words.push(" ");
    }
    words.push(
      <span key={position} className={className}>
        {word}
      </span>,
    );
    position = position + word.length + 1;
  }
  return words;
}

/** Mục vấn đề: một câu lớn đậm dần theo cuộn, rồi ba loại tài sản thật. */
export function ProblemSection() {
  const content = useLandingContent();
  const runRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);

  const paint = useCallback(() => {
    const run = runRef.current;
    if (run === null) {
      return;
    }
    const distance = run.offsetHeight - window.innerHeight;
    let progress = 1;
    if (!prefersReducedMotion() && distance > 0) {
      progress = clamp01(-run.getBoundingClientRect().top / distance);
    }
    const words = run.querySelectorAll<HTMLElement>(".u260-w");
    const filled = progress * 1.15 * words.length;
    for (let index = 0; index < words.length; index += 1) {
      const value = clamp01(filled - index);
      words[index].style.setProperty("--f", value.toFixed(2));
      words[index].classList.toggle("on", value >= 1);
    }
    if (barRef.current !== null) {
      barRef.current.style.transform = `scaleY(${clamp01(progress * 1.15).toFixed(3)})`;
    }
    run.classList.toggle("is-done", progress * 1.15 >= 1);
  }, []);
  useScrollFrame(paint);

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
        className="landing-lift rounded-2xl border border-heritage-border bg-heritage-surface p-8"
      >
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-heritage-primary text-heritage-gold-soft">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h3 className={`${HEADING} mt-5 text-2xl text-heritage-primary`}>{item.title}</h3>
        <p className="mt-3 text-base leading-7 text-heritage-muted">{item.detail}</p>
      </Reveal>,
    );
    index = index + 1;
  }

  return (
    <section id="van-de" className="ux bg-heritage-canvas">
      <div ref={runRef} className="u260-run">
        <div className="u260-pin px-6 text-center sm:px-10">
          <p className={`${HEADING} text-lg italic text-heritage-gold`}>
            {content.problem.eyebrow}
          </p>
          <h2 className={`${HEADING} mt-5 max-w-4xl text-4xl leading-[1.35] sm:text-6xl`}>
            {sentenceWords(content.problem.title, content.problem.highlights)}
          </h2>
          <p className="u260-nx mt-8 max-w-2xl text-lg leading-8 text-heritage-muted">
            {content.problem.description}
          </p>
          <span className="u260-pg" aria-hidden="true">
            <i ref={barRef} />
          </span>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-8 sm:pb-32">
        <ul className="grid gap-5 md:grid-cols-3">{cards}</ul>
        <Reveal className="mt-14 text-center">
          <p className={`${HEADING} text-2xl italic text-heritage-warning sm:text-3xl`}>
            {content.problem.closing}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
