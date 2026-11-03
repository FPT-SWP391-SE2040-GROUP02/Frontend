import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { LANDING_CONTENT as content } from "./model/landing.content";
import { AnimatedGuilloche, HEADING, LandingFooter, LandingHeader } from "./ui/LandingChrome";
import {
  FaqSection,
  FinalCtaSection,
  HowSection,
  LayersSection,
  PillarsSection,
  PricingSection,
  PrinciplesSection,
  ProblemSection,
  StatementSection,
  TrustSection,
} from "./ui/LandingSections";
import { GOLD_BUTTON, OUTLINE_BUTTON } from "./ui/landingParts";

/*
 * Landing công khai theo Mẫu G "Bông hoa là logo". Màu cố định theo bản thiết kế (nền xanh đậm / kem)
 * nên không đổi theo chế độ tối của ứng dụng. Các mục thân trang nằm ở `ui/LandingSections.tsx`.
 */

/** Landing công khai; điều hướng đăng nhập/đăng ký dùng route thật của client. */
export function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-heritage-canvas font-sans text-heritage-text">
      <a
        href="#landing-content"
        className="sr-only z-50 rounded-lg bg-heritage-surface p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {content.skip}
      </a>

      <section className="relative overflow-hidden bg-heritage-sidebar text-heritage-canvas">
        {/* Hoa chìm làm nền: phủ rộng sau chữ, mờ dần ra mép để chữ vẫn dễ đọc. */}
        <AnimatedGuilloche className="landing-flower-in pointer-events-none absolute left-1/2 top-1/2 size-[48rem] -translate-x-1/2 -translate-y-1/2 opacity-50 sm:size-[64rem]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#0A281E_88%)]"
        />
        <div className="relative">
          <LandingHeader onLanding />
          <div
            id="landing-content"
            tabIndex={-1}
            className="mx-auto flex min-h-[34rem] max-w-3xl flex-col items-center justify-center px-4 pb-24 pt-16 text-center focus:outline-none sm:min-h-[calc(100vh-5rem)] sm:px-8 sm:pb-32 sm:pt-24"
          >
            <h1 className={`${HEADING} landing-rise text-6xl sm:text-8xl`}>{content.brand}</h1>
            <p
              className={`${HEADING} landing-rise mt-4 text-xl italic text-heritage-gold-soft-hover sm:text-2xl`}
              style={{ animationDelay: "150ms" }}
            >
              {content.hero.tagline}
            </p>
            <p
              className="landing-rise mt-5 max-w-xl text-base leading-7 text-heritage-canvas/80"
              style={{ animationDelay: "300ms" }}
            >
              {content.hero.description}
            </p>
            <div
              className="landing-rise mt-8 flex flex-wrap justify-center gap-3"
              style={{ animationDelay: "450ms" }}
            >
              <Link to={ROUTES.AUTH.REGISTER} className={GOLD_BUTTON}>
                {content.hero.start}
              </Link>
              <a href="#van-de" className={OUTLINE_BUTTON}>
                {content.hero.explore}
              </a>
            </div>
          </div>
        </div>
      </section>

      <ProblemSection />
      <StatementSection />
      <PrinciplesSection />
      <PillarsSection />
      <LayersSection />
      <HowSection />
      <TrustSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />

      <LandingFooter onLanding />
    </div>
  );
}
