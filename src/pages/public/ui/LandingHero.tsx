/* Lucian UX/UI Prompt #216 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#216 */
/* Lucian UX/UI Prompt #231 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#231 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { FileText, KeyRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import { clamp01, prefersReducedMotion, useScrollFrame } from "../model/motion";
import { useLandingContent } from "../model/usePublicContent";
import { AnimatedGuilloche, FOCUS_RING, HEADING } from "./LandingChrome";
import { GOLD_BUTTON, OUTLINE_BUTTON } from "./landingParts";
import "./lucian/u216.css";

/** Độ trễ (ms) của từng khối, giữ nguyên nhịp của phần tử #216. */
function delay(value: number): CSSProperties {
  return { "--d": value } as CSSProperties;
}

const ROW_ICONS: LucideIcon[] = [Wallet, KeyRound, FileText];

/** Màn hình tài sản minh họa, toàn bộ là dữ liệu mẫu. */
function SampleScreen() {
  const screen = useLandingContent().hero.screen;
  const stats: ReactNode[] = [];
  for (const stat of screen.stats) {
    stats.push(
      <div key={stat.label} className="rounded-xl bg-heritage-sunken p-3 sm:p-4">
        <p className="text-sm text-heritage-muted">{stat.label}</p>
        <p className={`${HEADING} mt-1 text-xl text-heritage-primary sm:text-2xl`}>{stat.value}</p>
      </div>,
    );
  }

  const rows: ReactNode[] = [];
  let index = 0;
  for (const row of screen.rows) {
    const Icon = ROW_ICONS[index];
    rows.push(
      <li key={row.title} className="flex items-center gap-3 py-3 sm:gap-4">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-heritage-primary text-heritage-gold-soft">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-heritage-primary sm:text-base">
            {row.title}
          </p>
          <p className="truncate text-sm text-heritage-muted">{row.recipient}</p>
        </div>
        <div className="w-24 shrink-0 text-right sm:w-36">
          <p className="text-sm text-heritage-success">{screen.status}</p>
          <span className="mt-1 block h-1.5 rounded-full bg-heritage-sunken">
            <span className="u231-fill" style={{ "--i": index } as CSSProperties} />
          </span>
        </div>
      </li>,
    );
    index = index + 1;
  }

  return (
    <div className="ux u231-win text-left">
      <div aria-hidden="true" className="flex gap-1.5 bg-heritage-sunken px-4 py-3">
        <i className="size-2.5 rounded-full bg-heritage-border-strong" />
        <i className="size-2.5 rounded-full bg-heritage-border-strong" />
        <i className="size-2.5 rounded-full bg-heritage-border-strong" />
      </div>
      <div className="p-4 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`${HEADING} text-xl text-heritage-primary sm:text-2xl`}>{screen.title}</p>
          <span className="rounded-full border border-heritage-gold px-3 py-1 text-sm text-heritage-warning">
            {screen.sample}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">{stats}</div>
        <ul className="mt-3 divide-y divide-heritage-border">{rows}</ul>
      </div>
    </div>
  );
}

/** Màn mở đầu: câu khẩu hiệu hiện từng chữ, rồi màn hình tài sản dựng thẳng dần theo cuộn. */
export function HeroSection() {
  const content = useLandingContent();
  const [entered, setEntered] = useState(prefersReducedMotion);

  useEffect(() => {
    if (entered) {
      return;
    }
    // Chờ trình duyệt vẽ trạng thái ẩn trước, nếu không chuyển động vào cảnh sẽ không chạy.
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [entered]);

  const stageRef = useRef<HTMLDivElement>(null);
  const paint = useCallback(() => {
    const stage = stageRef.current;
    if (stage === null) {
      return;
    }
    let progress = 1;
    if (!prefersReducedMotion()) {
      progress = clamp01(window.scrollY / (window.innerHeight * 0.45));
    }
    const eased = 1 - Math.pow(1 - progress, 2);
    const tilt = (34 * (1 - eased)).toFixed(2);
    const scale = (0.84 + 0.16 * eased).toFixed(3);
    const lift = (-18 * eased).toFixed(1);
    stage.style.transform = `rotateX(${tilt}deg) scale(${scale}) translateY(${lift}px)`;
    stage.style.setProperty("--sy", `${(10 + 24 * eased).toFixed(1)}px`);
    stage.style.setProperty("--sb", `${(20 + 34 * eased).toFixed(1)}px`);
    stage.classList.toggle("is-flat", progress > 0.88);
  }, []);
  useScrollFrame(paint);

  const words: ReactNode[] = [];
  let wordIndex = 0;
  for (const word of content.hero.tagline.split(" ")) {
    if (wordIndex > 0) {
      words.push(" ");
    }
    words.push(
      <span key={`${wordIndex}-${word}`} className="u216-w">
        <span style={delay(300 + wordIndex * 70)}>{word}</span>
      </span>,
    );
    wordIndex = wordIndex + 1;
  }

  let stateClass = "";
  if (entered) {
    stateClass = "is-in";
  }

  return (
    <section
      className={`ux ux-night u216 relative overflow-hidden bg-heritage-primary pb-16 sm:pb-24 ${stateClass}`}
    >
      {/* Hoa chìm làm nền: phủ rộng sau chữ, mờ dần ra mép để chữ vẫn dễ đọc. */}
      <AnimatedGuilloche className="landing-flower-in pointer-events-none absolute left-1/2 top-[22rem] size-[48rem] -translate-x-1/2 -translate-y-1/2 opacity-50 sm:size-[64rem]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,transparent_30%,var(--primary)_85%)]"
      />
      <div
        id="landing-content"
        tabIndex={-1}
        className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-44 text-center focus:outline-none sm:px-8 sm:pt-40"
      >
        <p
          data-s
          style={delay(180)}
          className="inline-flex items-center gap-2 rounded-full border border-heritage-gold-soft/40 px-4 py-1.5 text-sm text-heritage-gold-soft"
        >
          <LegacyVaultMark className="size-5" />
          {content.brand}
        </p>
        <h1 className={`${HEADING} mt-7 text-4xl leading-[1.18] sm:text-6xl lg:text-7xl`}>
          {words}
        </h1>
        <p
          data-s
          style={delay(620)}
          className="mt-7 max-w-2xl text-base leading-7 text-heritage-sunken/80 sm:text-lg sm:leading-8"
        >
          {content.hero.description}
        </p>
        <div data-s style={delay(760)} className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to={ROUTES.AUTH.REGISTER} className={GOLD_BUTTON}>
            {content.hero.start}
          </Link>
          <a href="#van-de" className={OUTLINE_BUTTON}>
            {content.hero.explore}
          </a>
        </div>
        {/* Lối vào cho người thân: chưa đăng nhập thì ProtectedRoute đưa qua đăng nhập rồi quay lại đúng trang. */}
        <p
          data-s
          style={delay(760)}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-2 text-sm text-heritage-sunken/80"
        >
          {content.hero.receiveQuestion}
          <Link
            to={ROUTES.DASHBOARD.RECEIVE_ASSETS}
            className={`inline-flex min-h-11 items-center font-semibold text-heritage-gold-soft underline underline-offset-4 ${FOCUS_RING}`}
          >
            {content.hero.receiveAction}
          </Link>
        </p>
      </div>
      <div className="u216-persp relative mx-auto mt-12 max-w-3xl px-4 sm:px-8">
        <div
          data-s
          style={delay(900)}
          className="u216-sc"
          role="img"
          aria-label={content.hero.screen.label}
        >
          <div ref={stageRef} className="u231-st">
            <SampleScreen />
          </div>
        </div>
      </div>
    </section>
  );
}
