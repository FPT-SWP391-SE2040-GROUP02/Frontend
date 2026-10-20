import { useSearchParams } from "react-router-dom";
import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Hàng chờ: danh sách hồ sơ, hoặc chi tiết một hồ sơ khi có ?caseId=. */
export function VerifierQueuePage() {
  const [params] = useSearchParams();
  const hasCase = Boolean(params.get("caseId"));
  return (
    <VerifierShell
      title={hasCase ? "Xét duyệt hồ sơ" : "Hàng chờ"}
      description={
        hasCase
          ? "Xem giấy tờ, kiểm tra các cờ rồi ra quyết định."
          : "Các hồ sơ chứng tử đang được giao cho bạn xét."
      }
    >
      <VerifierQueue />
    </VerifierShell>
  );
}
