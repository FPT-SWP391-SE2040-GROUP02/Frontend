/* Lucian UX/UI Prompt #425 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#425 */
import type { PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { useLandingContent } from "../model/usePublicContent";
import { HEADING } from "./LandingChrome";
import { OUTLINE_BUTTON } from "./landingParts";
import { Reveal } from "./Reveal";
import "./lucian/u425.css";

/** Quầng sáng đi theo con trỏ. */
function followPointer(event: PointerEvent<HTMLDivElement>): void {
  const card = event.currentTarget;
  const box = card.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) {
    return;
  }
  const x = ((event.clientX - box.left) / box.width) * 100;
  const y = ((event.clientY - box.top) / box.height) * 100;
  card.style.setProperty("--mx", `${x.toFixed(1)}%`);
  card.style.setProperty("--my", `${y.toFixed(1)}%`);
}

/** Mục cuối: lời mời bắt đầu. */
export function ClosingSection() {
  const content = useLandingContent().cta;
  return (
    <section className="bg-heritage-canvas px-4 pb-24 pt-8 sm:px-8 sm:pb-32">
      <Reveal className="mx-auto max-w-5xl">
        <div
          className="ux ux-night u425-cd px-6 py-20 text-center sm:px-12 sm:py-24"
          onPointerMove={followPointer}
        >
          <i className="b b1" aria-hidden="true" />
          <i className="b b2" aria-hidden="true" />
          <span className="u425-gl" aria-hidden="true" />
          <h2 className={`${HEADING} text-4xl leading-snug sm:text-6xl`}>{content.title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-heritage-sunken/85">
            {content.description}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to={ROUTES.AUTH.REGISTER} className="u425-go">
              <span>{content.primary}</span>
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 6h7M6.5 3l3 3-3 3" />
              </svg>
            </Link>
            <Link to={ROUTES.AUTH.LOGIN} className={OUTLINE_BUTTON}>
              {content.secondary}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
