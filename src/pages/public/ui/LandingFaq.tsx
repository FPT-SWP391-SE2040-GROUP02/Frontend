/* Lucian UX/UI Prompt #424 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#424 */
import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { useFaqContent, useLandingContent } from "../model/usePublicContent";
import { HEADING } from "./LandingChrome";
import { SectionHead } from "./landingParts";
import { Reveal } from "./Reveal";
import "./lucian/u424.css";

interface Question {
  question: string;
  answer: string;
}

/** Danh sách câu hỏi mở từng câu một; mũi tên lên/xuống, Home, End để chuyển giữa các câu. */
function Accordion({ items }: { items: readonly Question[] }) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    let target: number | null = null;
    if (event.key === "ArrowDown") {
      target = index + 1;
    } else if (event.key === "ArrowUp") {
      target = index - 1;
    } else if (event.key === "Home") {
      target = 0;
    } else if (event.key === "End") {
      target = items.length - 1;
    }
    if (target === null) {
      return;
    }
    event.preventDefault();
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(".u424-q");
    buttons?.[(target + items.length) % items.length]?.focus();
  }

  const rows: ReactNode[] = [];
  let index = 0;
  for (const item of items) {
    const position = index;
    const open = openIndex === position;
    const questionId = `${baseId}-q${position}`;
    const answerId = `${baseId}-a${position}`;
    let rowClass = "u424-it";
    let nextOpen: number | null = position;
    if (open) {
      rowClass = "u424-it open";
      nextOpen = null;
    }
    rows.push(
      <li key={item.question} className={rowClass}>
        <button
          id={questionId}
          type="button"
          className="u424-q"
          aria-expanded={open}
          aria-controls={answerId}
          onClick={() => setOpenIndex(nextOpen)}
          onKeyDown={(event) => moveFocus(event, position)}
        >
          <span className={`${HEADING} text-lg text-heritage-primary sm:text-xl`}>
            {item.question}
          </span>
          <i className="u424-pm" aria-hidden="true" />
        </button>
        <div
          id={answerId}
          className="u424-a"
          role="region"
          aria-labelledby={questionId}
          inert={!open}
        >
          <div>
            <p>{item.answer}</p>
          </div>
        </div>
      </li>,
    );
    index = index + 1;
  }

  return (
    <ul ref={listRef} className="ux u424-ls">
      {rows}
    </ul>
  );
}

/** Mục hỏi đáp: lấy các câu đầu của trang Hỏi đáp để hai nơi không lệch nhau. */
export function FaqSection() {
  const content = useLandingContent();
  const faq = useFaqContent();
  const questions: Question[] = [];
  for (const group of faq.groups) {
    for (const item of group.items) {
      if (questions.length < content.faq.limit) {
        questions.push(item);
      }
    }
  }
  return (
    <section id="hoi-dap" className="bg-heritage-canvas px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <SectionHead eyebrow={content.faq.eyebrow} title={content.faq.title} />
          <Reveal delay={150} className="mt-8">
            <Link
              to={ROUTES.PUBLIC.FAQ}
              className="inline-flex min-h-11 items-center text-base font-semibold text-heritage-warning underline underline-offset-4 hover:text-heritage-primary"
            >
              {content.faq.all}
            </Link>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <Accordion items={questions} />
        </Reveal>
      </div>
    </section>
  );
}
