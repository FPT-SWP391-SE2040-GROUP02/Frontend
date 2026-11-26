import { MyClaimsPanel } from "@/features/handover-request";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";

/** Giấy tờ và yêu cầu nhận tài sản: kết quả luật sư xét giấy tờ đã nộp và nộp bổ sung khi được yêu cầu. */
export function BeneficiaryRequestsPage() {
  return (
    <RecipientLayout active="requests">
      <header>
        <h1 className="text-3xl font-semibold text-heritage-primary">
          Giấy tờ và yêu cầu nhận tài sản
        </h1>
        <p className="mt-1 max-w-[64ch] text-sm text-heritage-muted">
          Theo dõi kết quả luật sư xét giấy tờ bạn đã nộp và bổ sung khi được yêu cầu.
        </p>
      </header>
      <MyClaimsPanel />
    </RecipientLayout>
  );
}
