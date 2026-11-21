import { useSearchParams } from "react-router-dom";
import { RecipientReviewDetail } from "./RecipientReviewDetail";
import { RecipientReviewList } from "./RecipientReviewList";

/**
 * Mục Danh tính người nhận của luật sư: danh sách hồ sơ chờ kiểm, hoặc màn kiểm một hồ sơ khi có ?submissionId=.
 * Chỉ hiện hồ sơ của biên bản được giao cho mình; Backend quyết định, màn hình không tự lọc.
 */
export function RecipientReviewQueue() {
  const [params, setParams] = useSearchParams();
  const selected = params.get("submissionId");
  if (selected) {
    return (
      <RecipientReviewDetail
        id={selected}
        onBack={() => {
          const next = new URLSearchParams(params);
          next.delete("submissionId");
          setParams(next);
        }}
      />
    );
  }
  return (
    <RecipientReviewList
      onOpen={(id) => {
        const next = new URLSearchParams(params);
        next.set("submissionId", id);
        setParams(next);
      }}
    />
  );
}
