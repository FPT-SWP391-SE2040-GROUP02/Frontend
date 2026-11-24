import { useSearchParams } from "react-router-dom";
import { RecipientReviewQueue } from "@/features/recipient-review";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Danh tính người nhận chờ kiểm: danh sách, hoặc chi tiết một hồ sơ khi có ?submissionId=. */
export function VerifierRecipientsPage() {
  const [params] = useSearchParams();
  const hasSubmission = Boolean(params.get("submissionId"));
  return (
    <VerifierShell
      title="Danh tính người nhận"
      description={
        hasSubmission
          ? "Bạn chịu trách nhiệm xác nhận đúng người: đối chiếu căn cước với thông tin trong biên bản, rồi xác nhận hoặc yêu cầu làm lại."
          : "Bước 2 của biên bản bàn giao: người nhận có tên trong biên bản nộp căn cước để bạn kiểm."
      }
    >
      <RecipientReviewQueue />
    </VerifierShell>
  );
}
