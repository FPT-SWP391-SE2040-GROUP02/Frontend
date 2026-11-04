import { subscribeMaintenance } from "@/shared/api/maintenance";
import { POLLING_INTERVAL } from "@/shared/config/polling";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { publicSettingsService } from "../api/publicSettingsService";
import { isMaintenanceOn } from "./maintenance.schema";

/** Chu kỳ kiểm tra lại khi đang bảo trì: ngắn để người dùng được đưa trở lại ngay khi hệ thống mở. */
export const MAINTENANCE_RECHECK_MS = 15_000;

export const maintenanceKeys = {
  status: () => ["maintenance", "status"] as const,
};

/** Trạng thái bảo trì cho giao diện. */
export interface MaintenanceStatus {
  /** true khi Backend xác nhận đang bảo trì (cờ công khai hoặc vừa trả 503 MAINTENANCE_MODE). */
  isMaintenance: boolean;
  /** Đang gọi lại Backend để kiểm tra. */
  isChecking: boolean;
  /** Thời điểm nhận kết quả gần nhất (ms), 0 khi chưa có. */
  lastCheckedAt: number;
  /** Kiểm tra lại ngay theo yêu cầu người dùng. */
  recheck: () => void;
}

/**
 * Theo dõi chế độ bảo trì: đọc cờ công khai định kỳ (15 giây khi đang bảo trì, 60 giây khi không)
 * và chuyển ngay sang bảo trì khi bất kỳ API nào trả 503 MAINTENANCE_MODE.
 * Lỗi mạng khi đọc cờ không bị coi là bảo trì, để không khóa nhầm giao diện.
 */
export function useMaintenanceStatus(): MaintenanceStatus {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: maintenanceKeys.status(),
    queryFn: async ({ signal }) =>
      isMaintenanceOn(await publicSettingsService.getPublicSettings(signal)),
    staleTime: 10_000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: (current) =>
      current.state.data === true ? MAINTENANCE_RECHECK_MS : POLLING_INTERVAL.SLOW,
  });

  useEffect(
    () =>
      subscribeMaintenance(() => {
        queryClient.setQueryData(maintenanceKeys.status(), true);
      }),
    [queryClient],
  );

  return {
    isMaintenance: query.data === true,
    isChecking: query.isFetching,
    lastCheckedAt: query.dataUpdatedAt,
    recheck: () => {
      void query.refetch();
    },
  };
}
