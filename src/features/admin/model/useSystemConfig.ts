import { useQuery } from "@tanstack/react-query";
import { systemConfigService } from "../api/systemConfigService";
import { adminKeys } from "./useAdmin";

export const systemConfigKeys = {
  all: [...adminKeys.all, "system-config"] as const,
};

/** Các dịch vụ ngoài đã nối; không tự retry để 404/401 hiện ngay như các màn Admin khác. */
export function useSystemConfig() {
  return useQuery({
    queryKey: systemConfigKeys.all,
    queryFn: ({ signal }) => systemConfigService.list(signal),
    staleTime: 15_000,
    retry: false,
  });
}
