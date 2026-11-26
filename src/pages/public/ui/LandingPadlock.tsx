/* Lucian UX/UI Prompt #350 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#350 */
import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { User } from "lucide-react";
import { prefersReducedMotion } from "../model/motion";
import { useLandingContent } from "../model/usePublicContent";
import { HEADING } from "./LandingChrome";
import "./lucian/u350.css";

const SHACKLE_UP = "translateY(-15px)";
const AVATAR_COLORS: readonly (readonly [string, string])[] = [
  ["#b88e4c", "#7a5b25"],
  ["#2f8f6a", "#10382b"],
  ["#5b7f9c", "#2d4a63"],
];

/** Minh họa: tài sản đang khóa, và chỉ mở cho người nhận khi đủ điều kiện. */
export function PadlockDemo() {
  const content = useLandingContent().trust.lock;
  const [open, setOpen] = useState(false);
  const shackleRef = useRef<SVGPathElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const keyholeRef = useRef<SVGGElement>(null);
  const running = useRef<Animation[]>([]);

  function play(
    element: SVGElement | null,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ): void {
    if (element === null) {
      return;
    }
    if (prefersReducedMotion() || typeof element.animate !== "function") {
      element.style.transform = String(frames[frames.length - 1].transform);
      return;
    }
    running.current.push(element.animate(frames, { ...options, fill: "forwards" }));
  }

  /** Chuỗi chuyển động chép nguyên thời lượng và đường cong của phần tử gốc. */
  function toggle(): void {
    const next = !open;
    for (const animation of running.current) {
      if (typeof animation.commitStyles === "function") {
        animation.commitStyles();
      }
      animation.cancel();
    }
    running.current = [];
    setOpen(next);
    if (next) {
      play(keyholeRef.current, [{ transform: "none" }, { transform: "rotate(-90deg)" }], {
        duration: 220,
        easing: "cubic-bezier(.4,0,.2,1)",
      });
      play(
        shackleRef.current,
        [
          { transform: "none" },
          { transform: "translateY(-19px)", offset: 0.55 },
          { transform: SHACKLE_UP },
        ],
        { duration: 480, delay: 200, easing: "cubic-bezier(.2,.9,.3,1)" },
      );
      play(
        bodyRef.current,
        [
          { transform: "none" },
          { transform: "translateY(2px) scale(1.02,.97)", offset: 0.3 },
          { transform: "none" },
        ],
        { duration: 360, delay: 200, easing: "ease-out" },
      );
      return;
    }
    play(
      shackleRef.current,
      [
        { transform: SHACKLE_UP },
        { transform: "translateY(-21px)", offset: 0.25 },
        { transform: "translateY(1.5px)", offset: 0.75 },
        { transform: "none" },
      ],
      { duration: 440, easing: "cubic-bezier(.5,0,.4,1)" },
    );
    play(
      bodyRef.current,
      [
        { transform: "none", offset: 0 },
        { transform: "none", offset: 0.62 },
        { transform: "translateY(2px) scale(1.04,.94)", offset: 0.78 },
        { transform: "none" },
      ],
      { duration: 560 },
    );
    play(keyholeRef.current, [{ transform: "rotate(-90deg)" }, { transform: "none" }], {
      duration: 220,
      delay: 380,
      easing: "cubic-bezier(.4,0,.2,1)",
    });
  }

  let state: { tag: string; detail: string } = content.locked;
  let wrapperClass = "ux ux-night u350";
  let ringClass = "u350-ring";
  if (open) {
    state = content.open;
    wrapperClass = "ux ux-night u350 is-open";
    ringClass = "u350-ring is-pulse";
  }

  const avatars: ReactNode[] = [];
  let index = 0;
  for (const colors of AVATAR_COLORS) {
    const style = { "--i": index, "--a": colors[0], "--b": colors[1] } as CSSProperties;
    avatars.push(
      <span key={colors[0]} className="u350-av" style={style}>
        <User className="size-4" />
      </span>,
    );
    index = index + 1;
  }

  return (
    <div className={wrapperClass}>
      <button
        type="button"
        className="u350-lk"
        aria-label={content.label}
        aria-pressed={!open}
        onClick={toggle}
      >
        <span className={ringClass} aria-hidden="true" />
        <svg viewBox="0 0 96 112" aria-hidden="true">
          <path ref={shackleRef} className="u350-sh" d="M28 70 V40 a20 20 0 0 1 40 0 V60" />
          <g ref={bodyRef} className="u350-bd">
            <rect x="12" y="52" width="72" height="56" rx="16" />
            <g ref={keyholeRef} className="u350-kh">
              <circle cx="48" cy="76" r="7" />
              <rect x="45" y="78" width="6" height="13" rx="3" />
            </g>
          </g>
        </svg>
      </button>
      <p className={`${HEADING} mt-5 text-2xl text-heritage-sunken`}>{content.file}</p>
      <div aria-live="polite">
        <p className="mt-3 inline-block rounded-full border border-heritage-sunken/20 px-3 py-1 text-sm text-heritage-gold-soft">
          {state.tag}
        </p>
        <p className="mt-2 text-sm leading-6 text-heritage-sunken/75">{state.detail}</p>
      </div>
      <div className="u350-ppl" aria-hidden="true">
        {avatars}
      </div>
      <p className="mt-4 text-sm text-heritage-sunken/60">{content.hint}</p>
    </div>
  );
}
