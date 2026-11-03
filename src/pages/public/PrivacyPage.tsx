import { ROUTES } from "@/shared/config/routes.config";
import { PRIVACY_CONTENT as content, PUBLIC_INFO_COMMON } from "./model/publicInfo.content";
import { LegalSections, PublicInfoLayout } from "./PublicInfoLayout";

/** Trang Chính sách quyền riêng tư công khai (bản nháp chờ rà soát pháp lý). */
export function PrivacyPage() {
  return (
    <PublicInfoLayout
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      currentPath={ROUTES.PUBLIC.PRIVACY}
    >
      <p
        role="note"
        className="mb-8 rounded-xl border border-[#B68F4C]/50 bg-[#FAF3E0] p-4 text-sm leading-6 text-[#5C4720]"
      >
        {content.draftNotice}
      </p>
      <LegalSections sections={content.sections} />
      <p className="mt-10 text-sm text-[#4E6257]">
        {PUBLIC_INFO_COMMON.updatedPrefix} {PUBLIC_INFO_COMMON.updatedAt}
      </p>
    </PublicInfoLayout>
  );
}
