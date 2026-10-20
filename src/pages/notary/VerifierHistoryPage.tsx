import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { VerifierCaseList } from "@/features/verifier-review";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Lịch sử: các hồ sơ đã có kết quả. Mở một hồ sơ sẽ chuyển sang trang chi tiết ở Hàng chờ. */
export function VerifierHistoryPage() {
  const navigate = useNavigate();
  return (
    <VerifierShell title="Lịch sử xét duyệt" description="Các hồ sơ bạn đã xử lý.">
      <VerifierCaseList
        scope="closed"
        onSelect={(id) => navigate(`${ROUTES.NOTARY.QUEUE}?caseId=${id}`)}
      />
    </VerifierShell>
  );
}
