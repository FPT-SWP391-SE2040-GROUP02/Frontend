import { useSearchParams } from "react-router-dom";
import { RecipientReviewQueue } from "@/features/recipient-review";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Hồ sơ người nhận chờ duyệt: danh sách, hoặc chi tiết một hồ sơ khi có ?submissionId=. */
export function VerifierRecipientsPage() {
  const [params] = useSearchParams();
  const hasSubmission = Boolean(params.get("submissionId"));
  return (
    <VerifierShell
      title={hasSubmission ? "Duyệt hồ sơ người nhận" : "Hồ sơ người nhận"}
      description={
        hasSubmission
          ? "Đối chiếu ảnh căn cước với kết quả khớp, rồi duyệt hoặc yêu cầu bổ sung."
          : "Người nhận nộp căn cước và chọn Chấp nhận hoặc Từ chối cho các kho bạn đã duyệt hồ sơ chứng tử."
      }
    >
      <RecipientReviewQueue />
    </VerifierShell>
  );
}
