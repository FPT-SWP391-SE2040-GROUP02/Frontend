import { useQuery } from "@tanstack/react-query";
import { checkInService } from "../api/checkInService";
import { checkInRefreshInterval } from "./dailyCheckIn";
/** Query đọc khi kho đã sẵn sàng; không POST khi mount hoặc retry. */
export function useCheckIn(vaultId: string) {
  return useQuery({
    queryKey: ["vault-check-in", vaultId],
    queryFn: ({ signal }) => checkInService.get(undefined, signal),
    enabled: Boolean(vaultId),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    refetchInterval: (query) => checkInRefreshInterval(query.state.data?.serverTime),
  });
}
