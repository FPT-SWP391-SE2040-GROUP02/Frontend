import { useSearchParams } from "react-router-dom";
import { RecipientReviewQueue } from "@/features/recipient-review";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Hồ sơ người nhận chờ duyệt: danh sách, hoặc chi tiết một hồ sơ khi có ?submissionId=. */
export function VerifierRecipientsPage() {
  const [params] = useSearchParams();
  const hasSubmission = Boolean(params.get("submissionId"));
  return (
    <VerifierShell
      title="Hồ sơ người nhận"
      description={
        hasSubmission
          ? "Xem ảnh căn cước và biên bản, rồi duyệt hoặc yêu cầu người nhận bổ sung."
          : "Người nhận nộp căn cước và ký biên bản đồng ý hoặc từ chối cho các kho bạn đã duyệt hồ sơ báo tin."
      }
    >
      <RecipientReviewQueue />
    </VerifierShell>
  );
}
