import { LANDING_CONTENT as content } from "./model/landing.content";
import { LandingFooter, LandingHeader } from "./ui/LandingChrome";
import { ClosingSection } from "./ui/LandingClosing";
import { FaqSection } from "./ui/LandingFaq";
import { FeaturesSection } from "./ui/LandingFeatures";
import { HandoverSection } from "./ui/LandingHandover";
import { HeroSection } from "./ui/LandingHero";
import { PricingSection } from "./ui/LandingPricing";
import { ProblemSection } from "./ui/LandingProblem";
import { SecuritySection } from "./ui/LandingSecurity";

/*
 * Landing công khai gồm tám mục, mỗi mục một kiểu chuyển động lấy từ thư viện Lucian UX/UI (mã `uNNN`
 * trong `ui/lucian/`). Màu cố định theo bản thiết kế (nền xanh đậm / kem) nên không đổi theo chế độ tối.
 */

/** Landing công khai; điều hướng đăng nhập/đăng ký dùng route thật của client. */
export function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-heritage-primary font-sans text-heritage-text">
      <a
        href="#landing-content"
        className="sr-only z-50 rounded-lg bg-heritage-surface p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {content.skip}
      </a>

      <LandingHeader onLanding />

      {/* Thân trang nằm trên, kéo lên để lộ chân trang ở cuối (#236). */}
      <main className="u236-mn">
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HandoverSection />
        <SecuritySection />
        <PricingSection />
        <FaqSection />
        <ClosingSection />
      </main>

      <LandingFooter onLanding />
    </div>
  );
}
