/* Lucian UX/UI Prompt #214 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#214 */
import { useEffect, useRef } from "react";
import type { CSSProperties, FocusEvent, PointerEvent, ReactNode } from "react";
import { FileSignature, FileText, KeyRound, ShieldCheck, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prefersReducedMotion } from "../model/motion";
import { useLandingContent } from "../model/usePublicContent";
import { HEADING } from "./LandingChrome";
import { SectionHead } from "./landingParts";
import "./lucian/u214.css";

const TYPE_STEP_MS = 45;
const ASSET_ICONS: LucideIcon[] = [Wallet, KeyRound, FileText];
const STRIP_ICONS: LucideIcon[] = [Wallet, FileSignature, KeyRound, Users, FileText, ShieldCheck];
const KEY_BARS: readonly number[] = [0.45, 0.7, 0.55, 0.9, 0.75, 1];
const MATCH_WIDTHS: readonly number[] = [0.92, 0.7, 0.82];

function cssVars(values: Record<string, number>): CSSProperties {
  return values as CSSProperties;
}

function TileHead({ title, detail }: { title: string; detail: string }) {
  return (
    <>
      <h3 className={`${HEADING} text-2xl text-heritage-primary`}>{title}</h3>
      <p className="mt-2 text-sm leading-6 text-heritage-muted">{detail}</p>
    </>
  );
}

/** Mục tính năng: năm ô ghép, mỗi ô tự diễn khi được rê chuột, chạm hoặc tab tới. */
export function FeaturesSection() {
  const content = useLandingContent();
  const features = content.features;
  const gridRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | undefined>(undefined);

  /** Gõ lại dòng chữ của ô đầu, mỗi 45ms một ký tự như phần tử gốc. */
  function typeLine(): void {
    const target = typedRef.current;
    if (target === null || prefersReducedMotion()) {
      return;
    }
    window.clearTimeout(typingTimer.current);
    const characters = Array.from(features.assets.typing);
    let count = 0;
    function step(): void {
      count = count + 1;
      if (target !== null) {
        target.textContent = characters.slice(0, count).join("");
      }
      if (count < characters.length) {
        typingTimer.current = window.setTimeout(step, TYPE_STEP_MS);
      }
    }
    step();
  }

  function turnOn(tile: HTMLElement): void {
    tile.classList.add("is-on");
    if (tile.classList.contains("u214-a")) {
      typeLine();
    }
  }

  function handleEnter(event: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>): void {
    turnOn(event.currentTarget);
  }

  function handleLeave(event: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>): void {
    event.currentTarget.classList.remove("is-on");
  }

  useEffect(() => () => window.clearTimeout(typingTimer.current), []);

  // Màn cảm ứng không có rê chuột: ô diễn cảnh khi cuộn tới giữa màn hình.
  useEffect(() => {
    const grid = gridRef.current;
    if (grid === null || typeof IntersectionObserver === "undefined") {
      return;
    }
    if (typeof window.matchMedia !== "function" || !window.matchMedia("(hover: none)").matches) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("is-on", entry.isIntersecting);
        }
      },
      { threshold: 0.7 },
    );
    for (const tile of Array.from(grid.querySelectorAll(".u214-t"))) {
      observer.observe(tile);
    }
    return () => observer.disconnect();
  }, []);

  const tileEvents = {
    tabIndex: 0,
    onPointerEnter: handleEnter,
    onPointerLeave: handleLeave,
    onFocus: handleEnter,
    onBlur: handleLeave,
  };

  const assetIcons: ReactNode[] = [];
  let assetIndex = 0;
  for (const Icon of ASSET_ICONS) {
    assetIcons.push(
      <i key={assetIndex}>
        <Icon className="size-5" />
      </i>,
    );
    assetIndex = assetIndex + 1;
  }

  const matches: ReactNode[] = [];
  let matchIndex = 0;
  for (const match of features.recipients.rows) {
    matches.push(
      <div key={match.asset}>
        <p>
          <span>{match.asset}</span>
          <span>{match.recipient}</span>
        </p>
        <i style={cssVars({ "--w": MATCH_WIDTHS[matchIndex], "--i": matchIndex })} />
      </div>,
    );
    matchIndex = matchIndex + 1;
  }

  const bars: ReactNode[] = [];
  let barIndex = 0;
  for (const height of KEY_BARS) {
    bars.push(<i key={barIndex} style={cssVars({ "--h": height, "--i": barIndex })} />);
    barIndex = barIndex + 1;
  }

  // Dải biểu tượng lặp hai lần để vòng chạy liền mạch.
  const strip: ReactNode[] = [];
  for (let copy = 0; copy < 4; copy += 1) {
    let stripIndex = 0;
    for (const Icon of STRIP_ICONS) {
      strip.push(
        <i key={`${copy}-${stripIndex}`}>
          <Icon className="size-5" />
        </i>,
      );
      stripIndex = stripIndex + 1;
    }
  }

  return (
    <section id="he-thong" className="bg-heritage-sunken px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow={features.eyebrow}
          title={features.title}
          description={features.description}
        />
        <div ref={gridRef} className="ux u214 u214-gd mt-16">
          <div className="u214-t u214-a" {...tileEvents}>
            <TileHead title={features.assets.title} detail={features.assets.detail} />
            <span className="u214-av" aria-hidden="true">
              {assetIcons}
            </span>
            <div ref={typedRef} className="u214-ty" aria-hidden="true">
              {features.assets.typing}
            </div>
          </div>
          <div className="u214-t u214-b" {...tileEvents}>
            <TileHead title={features.recipients.title} detail={features.recipients.detail} />
            <div className="u214-rs" aria-hidden="true">
              {matches}
            </div>
          </div>
          <div className="u214-t u214-c" {...tileEvents}>
            <TileHead title={features.executor.title} detail={features.executor.detail} />
            <div className="u214-br" aria-hidden="true">
              {bars}
            </div>
          </div>
          <div className="u214-t u214-d" {...tileEvents}>
            <TileHead title={features.encryption.title} detail={features.encryption.detail} />
            <span className="u214-sh" aria-hidden="true">
              <svg viewBox="0 0 30 34">
                <path
                  d="M15 2l11 4.5v8.5c0 8-5 13.5-11 16.5C9 28.5 4 23 4 15V6.5z"
                  fill="currentColor"
                  opacity=".18"
                />
                <path
                  d="M15 2l11 4.5v8.5c0 8-5 13.5-11 16.5C9 28.5 4 23 4 15V6.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M10.5 16.5l3 3 6-6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="u214-t u214-e" {...tileEvents}>
            <TileHead title={features.record.title} detail={features.record.detail} />
            <div className="u214-lg" aria-hidden="true">
              <div className="u214-lt">{strip}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
