import { useSearchParams } from "react-router-dom";
import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Biên bản bàn giao: danh sách biên bản, hoặc ba bước của một biên bản khi có ?recordId=. */
export function VerifierQueuePage() {
  const [params] = useSearchParams();
  const hasRecord = Boolean(params.get("recordId"));
  return (
    <VerifierShell
      title="Đang lập phương án chia"
      description={
        hasRecord
          ? "Làm đúng thứ tự: xét giấy tờ và lập phương án chia, chốt phương án rồi ký biên bản; kiểm danh tính từng người nhận khi họ nộp căn cước."
          : "Hồ sơ báo tin chờ bạn kiểm giấy tờ và các biên bản bàn giao được giao cho bạn."
      }
    >
      <VerifierQueue />
    </VerifierShell>
  );
}
