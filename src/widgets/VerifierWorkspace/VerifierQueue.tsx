import { useSearchParams } from "react-router-dom";
import {
  VerifierCaseDetail,
  VerifierCaseList,
  VerifierReviewModals,
  useVerifierCase,
} from "@/features/verifier-review";

/**
 * Nội dung trang Hàng chờ: chưa chọn hồ sơ thì hiện danh sách, chọn rồi (?caseId=) thì hiện chi tiết
 * và các hộp thoại ra quyết định. Vai trò Verifier do Backend xác minh từ DB (ROLE-04).
 */
export function VerifierQueue() {
  const [params, setParams] = useSearchParams();
  const caseId = params.get("caseId");
  const detailQuery = useVerifierCase(caseId);
  if (!caseId) {
    return (
      <VerifierCaseList
        scope="open"
        onSelect={(id) => {
          const next = new URLSearchParams(params);
          next.set("caseId", id);
          next.delete("modal");
          next.delete("flagId");
          setParams(next);
        }}
      />
    );
  }
  return (
    <>
      <VerifierCaseDetail key={caseId} caseId={caseId} />
      {detailQuery.data && !detailQuery.isError && (
        <VerifierReviewModals caseId={caseId} detail={detailQuery.data} />
      )}
    </>
  );
}
