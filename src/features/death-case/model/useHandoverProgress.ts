import { useQuery } from "@tanstack/react-query";
import { deathCaseService } from "../api/deathCaseService";

/** Query key nằm dưới ["death-case", caseId] để làm mới hồ sơ thì tiến độ cũng được làm mới. */
export const handoverProgressKey = (caseId: string) =>
  ["death-case", caseId, "handover-progress"] as const;

/** Tiến độ bàn giao chỉ đọc của một hồ sơ; không retry để 404 quyền không bị gọi lặp. */
export function useHandoverProgress(caseId: string) {
  return useQuery({
    queryKey: handoverProgressKey(caseId),
    queryFn: ({ signal }) => deathCaseService.handoverProgress(caseId, signal),
    retry: false,
  });
}
