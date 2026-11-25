import { useQuery } from "@tanstack/react-query";
import { handoverService } from "../api/handoverService";

/** Hồ sơ danh tính mới nhất của một lượt; khung nộp căn cước và thanh tiến trình dùng chung một lần tải. */
export function useLatestSubmission(turnId: string, enabled = true) {
  return useQuery({
    queryKey: ["handover", "submission", turnId],
    queryFn: ({ signal }) => handoverService.latestSubmission(turnId, signal),
    retry: false,
    enabled,
  });
}
