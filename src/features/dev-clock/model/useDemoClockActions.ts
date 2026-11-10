import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { demoClockService } from "@/shared/clock/demoClockService";
import type { DemoClockStatus } from "@/shared/clock/demoClock.schema";
import { demoClockKeys } from "@/shared/clock/useServerNow";

/** Đồng hồ đổi thì mọi dữ liệu phụ thuộc ngày (kế hoạch, điểm danh, thông báo...) đã cũ: đánh dấu cũ để tải lại. */
function refreshAfterClockChange(client: QueryClient, clock: DemoClockStatus): void {
  client.setQueryData(demoClockKeys.status(), clock);
  void client.invalidateQueries({
    predicate: (query) => query.queryKey[0] !== demoClockKeys.all[0],
  });
}

/** Tua tới một ngày: chờ Backend chạy xong mọi bước rồi mới cập nhật đồng hồ (không lạc quan). */
export function useTravelDemoClock() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (targetDate: string) => demoClockService.travel({ targetDate }),
    onSuccess: (result) => refreshAfterClockChange(client, result.clock),
  });
}

/** Về ngày thật. */
export function useResetDemoClock() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => demoClockService.reset(),
    onSuccess: (clock) => refreshAfterClockChange(client, clock),
  });
}
