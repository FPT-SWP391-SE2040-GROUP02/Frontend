import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import type { checkInStatusSchema } from "../model/checkIn.schema";
import { checkInService } from "../api/checkInService";
import { dailyCheckInState } from "../model/dailyCheckIn";

type Status = z.infer<typeof checkInStatusSchema>;

/** Nút điểm danh do người dùng chủ động bấm; chỉ ghi nhận sau phản hồi máy chủ, không tự điểm danh khi mở trang. */
export function CheckInNowButton({
  vaultId,
  status,
  label,
  className,
  onCheckedIn,
}: {
  vaultId: string;
  status: Status;
  label: string;
  className?: string;
  onCheckedIn?: () => void;
}) {
  const action = usePrivateAction();
  const client = useQueryClient();
  const { canCheckIn, checkedInToday, executorCheckedInToday, planAllowsCheckIn } =
    dailyCheckInState(status);

  function sync(result: Status): void {
    client.setQueryData(["vault-check-in", vaultId], result);
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    onCheckedIn?.();
  }

  return (
    <div>
      <Button
        size="lg"
        className={className}
        disabled={action.pending || !canCheckIn}
        onClick={() => void action.execute(() => checkInService.checkIn(), sync)}
      >
        {action.pending
          ? "Đang gửi yêu cầu…"
          : executorCheckedInToday
            ? "Executor đã điểm danh hộ"
            : checkedInToday
              ? "Đã điểm danh hôm nay"
              : label}
      </Button>
      {executorCheckedInToday && (
        <p role="status" className="mt-3 text-xs font-medium text-emerald-800">
          Executor đã điểm danh hộ bạn hôm nay. Bạn có thể điểm danh lại từ 00:00 ngày tiếp theo
          (giờ Việt Nam).
        </p>
      )}
      {checkedInToday && (
        <p role="status" className="mt-3 text-xs font-medium text-emerald-800">
          Đã ghi nhận điểm danh hôm nay. Bạn có thể điểm danh lại từ 00:00 ngày tiếp theo (giờ Việt
          Nam).
        </p>
      )}
      {!planAllowsCheckIn && (
        <p className="mt-3 text-xs leading-5 opacity-75">
          Kế hoạch chưa kích hoạt hoặc đang bàn giao nên chưa điểm danh được.
        </p>
      )}
      {action.pending && (
        <p role="status" className="mt-3 text-xs">
          Đang gửi yêu cầu…
        </p>
      )}
      {action.error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {action.error}
        </p>
      )}
    </div>
  );
}
