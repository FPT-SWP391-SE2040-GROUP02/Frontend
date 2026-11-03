import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { FAQ_CONTENT as content } from "./model/publicInfo.content";
import { PublicInfoLayout } from "./PublicInfoLayout";

const FOCUS_RING =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-heritage-gold";

/** Trang Hỏi đáp công khai: nhóm câu hỏi dùng thẻ details gốc nên bàn phím và trình đọc màn hình dùng được. */
export function FaqPage() {
  const groups: ReactNode[] = [];
  for (const group of content.groups) {
    const items: ReactNode[] = [];
    for (const item of group.items) {
      items.push(
        <details
          key={item.question}
          className="group rounded-xl border border-heritage-text/10 bg-heritage-surface px-5 py-4"
        >
          <summary
            className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium text-heritage-primary ${FOCUS_RING}`}
          >
            {item.question}
            <span
              aria-hidden="true"
              className="text-heritage-gold transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-2 text-base leading-7 text-[#33463C]">{item.answer}</p>
        </details>,
      );
    }
    groups.push(
      <section
        key={group.title}
        aria-labelledby={`faq-${group.title}`}
        className="mt-10 first:mt-0"
      >
        <h2 id={`faq-${group.title}`} className="font-serif text-2xl text-heritage-primary">
          {group.title}
        </h2>
        <div className="mt-4 space-y-3">{items}</div>
      </section>,
    );
  }

  return (
    <PublicInfoLayout
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      currentPath={ROUTES.PUBLIC.FAQ}
    >
      {groups}
      <div className="mt-12 rounded-xl border border-heritage-gold/40 bg-heritage-surface p-6">
        <p className="font-serif text-xl text-heritage-primary">{content.stillNeedHelp}</p>
        <Link
          to={ROUTES.PUBLIC.CONTACT}
          className={`mt-4 inline-flex min-h-11 items-center rounded-md bg-heritage-sidebar px-5 text-sm font-semibold text-heritage-canvas hover:bg-[#14402F] ${FOCUS_RING}`}
        >
          {content.contactAction}
        </Link>
      </div>
    </PublicInfoLayout>
  );
}
