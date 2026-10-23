import { useState } from "react";
import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import type { checkInStatusSchema } from "../model/checkIn.schema";
import { checkInService } from "../api/checkInService";

type Status = z.infer<typeof checkInStatusSchema>;

/** Kế hoạch ở các trạng thái này mới điểm danh được; Backend vẫn là nơi quyết định. */
const CHECK_IN_PLAN_STATUSES = ["ACTIVE", "CHECKIN_OVERDUE", "AWAITING_CHECK"];

/** Nút điểm danh do người dùng chủ động bấm; chỉ ghi nhận sau phản hồi máy chủ, không tự điểm danh khi mở trang. */
export function CheckInNowButton({
  vaultId,
  status,
  label,
  className,
}: {
  vaultId: string;
  status: Status;
  label: string;
  className?: string;
}) {
  const action = usePrivateAction();
  const client = useQueryClient();
  const [mountedNow] = useState(() => Date.now());
  const canCheckIn = CHECK_IN_PLAN_STATUSES.includes(status.planStatus);

  const lastCheckInMs = status.lastCheckInAt ? new Date(status.lastCheckInAt).getTime() : 0;
  const serverMs = status.serverTime ? new Date(status.serverTime).getTime() : mountedNow;
  const diffSeconds = Math.floor((serverMs - lastCheckInMs) / 1000);
  const isWithin60Seconds = lastCheckInMs > 0 && diffSeconds >= 0 && diffSeconds < 60;
  const isCheckedIn = action.succeeded || isWithin60Seconds;

  function sync(result: Status): void {
    client.setQueryData(["vault-check-in", vaultId], result);
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
  }

  return (
    <div>
      <Button
        size="lg"
        className={className}
        disabled={action.pending || !canCheckIn || isCheckedIn}
        onClick={() => void action.execute(() => checkInService.checkIn(), sync)}
      >
        {action.pending ? "Đang gửi yêu cầu…" : isCheckedIn ? "Đã điểm danh" : label}
      </Button>
      {isCheckedIn && (
        <p role="status" className="mt-3 text-xs font-medium text-emerald-800">
          Đã ghi nhận điểm danh. Hệ thống chỉ mở kỳ tiếp theo sau 60 giây nếu bạn điểm danh lại.
        </p>
      )}
      {!canCheckIn && (
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
