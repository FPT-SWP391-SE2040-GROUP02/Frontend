import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ReceiveGuideTimeline } from "@/entities/handoverRecord";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";

/** Hướng dẫn sáu bước nhận tài sản, mở sẵn toàn bộ. */
export function BeneficiaryGuidePage() {
  return (
    <RecipientLayout active="guide">
      <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3.5">
        <div>
          <h1 className="text-3xl font-semibold text-heritage-primary">
            Quy trình nhận tài sản (6 bước)
          </h1>
          <p className="mt-1 max-w-[64ch] text-sm text-heritage-muted">
            LegacyVault chia việc rõ giữa bạn, luật sư và Người thực thi để tài sản đến đúng người
            nhận.
          </p>
        </div>
        <Link to={ROUTES.BENEFICIARY.CLAIM} className={buttonStyles.dark}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Về Việc cần làm
        </Link>
      </header>
      <Panel labelledBy="guide-steps" className="bg-white">
        <ReceiveGuideTimeline />
      </Panel>
    </RecipientLayout>
  );
}
