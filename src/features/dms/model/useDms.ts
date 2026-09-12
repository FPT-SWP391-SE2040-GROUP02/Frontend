import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dmsService } from "../api/dmsService";
import type { DmsConfigFormInput, PingRequestInput } from "./dms.schema";

/**
 * @file useDms.ts
 * @description React Query custom hooks quản lý server state cho hệ sinh thái Dead Man's Switch (DMS Heartbeat).
 * Hỗ trợ tự động refetch, cache invalidation, và optimistic updates.
 */

/**
 * Khóa cache truy vấn (Query Keys) theo chuẩn FSD
 */
export const dmsKeys = {
  all: ["dms"] as const,
  status: () => [...dmsKeys.all, "status"] as const,
  history: () => [...dmsKeys.all, "history"] as const,
};

/**
 * Hook truy xuất trạng thái Dead Man's Switch thời gian thực
 * @description Lấy thông tin nhịp sinh tồn, chu kỳ, hạn chót và mã băm toàn vẹn ECDSA.
 * @returns React Query useQuery result chứa DmsState
 * @example
 * const { data: dmsState, isLoading, refetch } = useDmsStatus();
 */
export function useDmsStatus() {
  return useQuery({
    queryKey: dmsKeys.status(),
    queryFn: () => dmsService.getDmsStatus(),
    staleTime: 1000 * 60, // 1 phút
    refetchInterval: 1000 * 60 * 5, // Tự động refetch mỗi 5 phút
  });
}

/**
 * Hook gửi nhịp xung sinh tồn (⚡ I'm Alive Pulse Check-in)
 * @description Gửi tín hiệu xác nhận sống sót để reset bộ đếm ngược. Tự động invalidate cache status & history.
 * @returns React Query useMutation result
 * @example
 * const { mutate: sendPing, isPending } = useSendPulsePing();
 * sendPing({ source: "WEB" });
 */
export function useSendPulsePing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: PingRequestInput) => dmsService.sendPulsePing(payload),
    onSuccess: () => {
      // Invalidate và refetch lại dữ liệu trạng thái mới
      queryClient.invalidateQueries({ queryKey: dmsKeys.status() });
      queryClient.invalidateQueries({ queryKey: dmsKeys.history() });
    },
  });
}

/**
 * Hook cập nhật cấu hình Dead Man's Switch (Interval, Grace Period, Channels)
 * @description Cập nhật tham số chu kỳ và các kênh cảnh báo khẩn cấp.
 * @returns React Query useMutation result
 * @example
 * const { mutate: updateConfig, isPending } = useUpdateDmsConfig();
 * updateConfig(newConfigData);
 */
export function useUpdateDmsConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: DmsConfigFormInput) => dmsService.updateDmsConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmsKeys.status() });
    },
  });
}

/**
 * Hook lấy danh sách lịch sử các lần gửi nhịp xung sinh tồn
 * @description Truy xuất audit trail minh bạch của mọi lần ping.
 * @returns React Query useQuery result chứa mảng PingHistoryItem
 * @example
 * const { data: history, isLoading } = usePingHistory();
 */
export function usePingHistory() {
  return useQuery({
    queryKey: dmsKeys.history(),
    queryFn: () => dmsService.getPingHistory(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook bật / tắt chế độ tạm dừng DMS (Vacation Mode)
 * @returns React Query useMutation result
 */
export function useToggleDmsPause() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isPaused: boolean) => dmsService.toggleDmsPause(isPaused),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmsKeys.status() });
    },
  });
}
