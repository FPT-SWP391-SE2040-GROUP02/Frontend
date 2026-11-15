import { useQuery } from "@tanstack/react-query";
import { systemExecutorsService } from "../api/systemExecutorsService";

export const systemExecutorKeys = {
  list: () => ["system-executors"] as const,
};

/** Danh bạ ít đổi trong một phiên: giữ 5 phút. */
const DIRECTORY_STALE_MS = 5 * 60 * 1000;

export function useSystemExecutors(enabled = true) {
  return useQuery({
    queryKey: systemExecutorKeys.list(),
    queryFn: ({ signal }) => systemExecutorsService.list(signal),
    enabled,
    staleTime: DIRECTORY_STALE_MS,
    retry: 1,
  });
}
