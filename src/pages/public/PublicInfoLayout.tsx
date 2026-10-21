import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { PUBLIC_INFO_COMMON as common } from "./model/publicInfo.content";
import {
  AnimatedGuilloche,
  FOCUS_RING,
  HEADING,
  LandingFooter,
  LandingHeader,
} from "./ui/LandingChrome";

const INFO_LINKS = [
  { label: "Hỏi đáp", to: ROUTES.PUBLIC.FAQ },
  { label: "Liên hệ", to: ROUTES.PUBLIC.CONTACT },
  { label: "Điều khoản", to: ROUTES.PUBLIC.TERMS },
  { label: "Quyền riêng tư", to: ROUTES.PUBLIC.PRIVACY },
] as const;

interface PublicInfoLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Đường dẫn trang đang mở, để đánh dấu mục điều hướng hiện tại. */
  currentPath: string;
  children: ReactNode;
}

/**
 * Khung chung cho các trang công khai ngoài landing (Hỏi đáp, Liên hệ, Điều khoản, Quyền riêng tư).
 * Dùng lại thanh đầu, hoa và chân trang của landing để hai bên giống nhau.
 */
export function PublicInfoLayout({
  eyebrow,
  title,
  description,
  currentPath,
  children,
}: PublicInfoLayoutProps) {
  const tabs: ReactNode[] = [];
  for (const link of INFO_LINKS) {
    let current: "page" | undefined;
    let style = "border-[#E6C98B]/30 text-[#F3EFE6]/80 hover:border-[#E6C98B] hover:text-[#E6C98B]";
    if (link.to === currentPath) {
      current = "page";
      style = "border-[#E6C98B] bg-[#E6C98B]/10 text-[#E6C98B]";
    }
    tabs.push(
      <Link
        key={link.to}
        to={link.to}
        aria-current={current}
        className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${style} ${FOCUS_RING}`}
      >
        {link.label}
      </Link>,
    );
  }

  return (
    <div id="top" className="min-h-screen bg-[#EFECE6] font-sans text-[#14241C]">
      <section className="relative overflow-hidden bg-[#0A281E] text-[#F3EFE6]">
        <AnimatedGuilloche className="pointer-events-none absolute -right-24 top-4 size-80 opacity-40 sm:size-[26rem]" />
        <div className="relative">
          <LandingHeader onLanding={false} />
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-8">
            <p className={`${HEADING} text-base italic text-[#E6C98B]`}>{eyebrow}</p>
            <h1 className={`${HEADING} mt-2 text-4xl leading-tight sm:text-6xl`}>{title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#F3EFE6]/80">{description}</p>
            <nav aria-label={common.navLabel} className="mt-8 flex flex-wrap gap-3">
              {tabs}
            </nav>
          </div>
        </div>
      </section>
      <main id="public-info-content" className="mx-auto max-w-4xl px-4 py-12 sm:px-8 sm:py-16">
        {children}
      </main>
      <LandingFooter onLanding={false} />
    </div>
  );
}

interface LegalSection {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

/** Danh sách mục văn bản (điều khoản, chính sách) dùng chung cho hai trang pháp lý. */
export function LegalSections({ sections }: { sections: readonly LegalSection[] }) {
  const blocks: ReactNode[] = [];
  for (const section of sections) {
    const paragraphs: ReactNode[] = [];
    for (const paragraph of section.paragraphs) {
      paragraphs.push(
        <p key={paragraph} className="mt-3 text-base leading-7 text-[#33463C]">
          {paragraph}
        </p>,
      );
    }
    let bullets: ReactNode = null;
    if (section.bullets) {
      const rows: ReactNode[] = [];
      for (const bullet of section.bullets) {
        rows.push(<li key={bullet}>{bullet}</li>);
      }
      bullets = (
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-[#33463C]">{rows}</ul>
      );
    }
    blocks.push(
      <section
        key={section.title}
        aria-labelledby={`legal-${section.title}`}
        className="mt-10 first:mt-0"
      >
        <h2 id={`legal-${section.title}`} className={`${HEADING} text-2xl text-[#0A281E]`}>
          {section.title}
        </h2>
        {paragraphs}
        {bullets}
      </section>,
    );
  }
  return <div>{blocks}</div>;
}
