import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { CONTACT_CONTENT as content, CONTACT_PLACEHOLDERS } from "./model/publicInfo.content";
import { PublicInfoLayout } from "./PublicInfoLayout";

const FOCUS_RING =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B68F4C]";
const CARD = "rounded-xl border border-[#14241C]/10 bg-[#FAF9F5] p-6";

/** Trang Liên hệ công khai. Giá trị liên hệ còn là giữ chỗ nên không tạo liên kết mailto giả. */
export function ContactPage() {
  const channels: ReactNode[] = [];
  for (const channel of content.channels) {
    channels.push(
      <li key={channel.title} className={CARD}>
        <h2 className="font-serif text-xl text-[#0A281E]">{channel.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#4E6257]">{channel.detail}</p>
        <p className="mt-4 break-words text-base font-medium text-[#14241C]">
          {CONTACT_PLACEHOLDERS[channel.valueKey]}
        </p>
      </li>,
    );
  }

  const tips: ReactNode[] = [];
  for (const tip of content.tips) {
    tips.push(<li key={tip}>{tip}</li>);
  }

  return (
    <PublicInfoLayout
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      currentPath={ROUTES.PUBLIC.CONTACT}
    >
      <ul className="grid gap-4 md:grid-cols-2">{channels}</ul>

      <section aria-labelledby="contact-info" className={`${CARD} mt-6`}>
        <h2 id="contact-info" className="font-serif text-xl text-[#0A281E]">
          {content.infoTitle}
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[#4E6257]">{content.companyLabel}</dt>
            <dd className="mt-1 font-medium">{CONTACT_PLACEHOLDERS.company}</dd>
          </div>
          <div>
            <dt className="text-[#4E6257]">{content.addressLabel}</dt>
            <dd className="mt-1 font-medium">{CONTACT_PLACEHOLDERS.address}</dd>
          </div>
          <div>
            <dt className="text-[#4E6257]">{content.hoursLabel}</dt>
            <dd className="mt-1 font-medium">{CONTACT_PLACEHOLDERS.hours}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="contact-tips" className="mt-10">
        <h2 id="contact-tips" className="font-serif text-xl text-[#0A281E]">
          {content.tipsTitle}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-[#33463C]">{tips}</ul>
        <p className="mt-6 text-base text-[#33463C]">{content.faqHint}</p>
        <Link
          to={ROUTES.PUBLIC.FAQ}
          className={`mt-3 inline-flex min-h-11 items-center rounded-md bg-[#0A281E] px-5 text-sm font-semibold text-[#F3EFE6] hover:bg-[#14402F] ${FOCUS_RING}`}
        >
          {content.faqAction}
        </Link>
      </section>
    </PublicInfoLayout>
  );
}
