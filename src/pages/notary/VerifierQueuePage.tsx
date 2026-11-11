import { useSearchParams } from "react-router-dom";
import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Hồ sơ báo tin: danh sách hồ sơ, hoặc chi tiết một hồ sơ khi có ?caseId=. */
export function VerifierQueuePage() {
  const [params] = useSearchParams();
  const hasCase = Boolean(params.get("caseId"));
  return (
    <VerifierShell
      title="Hồ sơ báo tin"
      description={
        hasCase
          ? "Xem giấy tờ, kiểm tra các cảnh báo rồi ra quyết định."
          : "Các hồ sơ báo tin Người thực thi đã nộp. Bạn chỉ xác nhận hồ sơ, không xem nội dung kho."
      }
    >
      <VerifierQueue />
    </VerifierShell>
  );
}
