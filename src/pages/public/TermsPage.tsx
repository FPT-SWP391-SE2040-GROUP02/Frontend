import { ROUTES } from "@/shared/config/routes.config";
import { PUBLIC_INFO_COMMON } from "./model/publicInfo.content";
import { useTermsContent } from "./model/usePublicContent";
import { LegalSections, PublicInfoLayout } from "./PublicInfoLayout";

/** Trang Điều khoản sử dụng công khai (bản nháp chờ rà soát pháp lý). */
export function TermsPage() {
  const content = useTermsContent();
  return (
    <PublicInfoLayout
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      currentPath={ROUTES.PUBLIC.TERMS}
    >
      <p
        role="note"
        className="mb-8 rounded-xl border border-heritage-gold/50 bg-heritage-warning-bg p-4 text-sm leading-6 text-heritage-warning"
      >
        {content.draftNotice}
      </p>
      <LegalSections sections={content.sections} />
      <p className="mt-10 text-sm text-heritage-muted">
        {PUBLIC_INFO_COMMON.updatedPrefix} {PUBLIC_INFO_COMMON.updatedAt}
      </p>
    </PublicInfoLayout>
  );
}
