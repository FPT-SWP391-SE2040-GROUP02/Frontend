import { useSearchParams } from "react-router-dom";
import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Biên bản bàn giao: danh sách biên bản, hoặc ba bước của một biên bản khi có ?recordId=. */
export function VerifierQueuePage() {
  const [params] = useSearchParams();
  const hasRecord = Boolean(params.get("recordId"));
  return (
    <VerifierShell
      title="Biên bản bàn giao"
      description={
        hasRecord
          ? "Làm đúng thứ tự: xét giấy tờ và lập biên bản, chốt biên bản rồi ký; kiểm danh tính từng người nhận khi họ nộp căn cước."
          : "Các kho có người nhận gửi yêu cầu nhận tài sản và được giao cho bạn xét giấy tờ, lập biên bản."
      }
    >
      <VerifierQueue />
    </VerifierShell>
  );
}
