import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { checkInService } from "../api/checkInService";

/** Điểm danh chủ động trên tổng quan; chờ server xác nhận và đồng bộ cache như màn điểm danh. */
export function QuickCheckIn({
  vaultId,
  planStatus,
  onCheckedIn,
}: {
  vaultId: string;
  planStatus: string;
  /** Widget đồng bộ các khối liên quan; feature điểm danh không import chéo nhật ký. */
  onCheckedIn?: () => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const allowed = ["ACTIVE", "CHECKIN_OVERDUE", "AWAITING_CHECK"].includes(planStatus);
  return (
    <div className="space-y-2">
      <Button
        className="overview-primary-action w-full"
        disabled={!allowed || action.pending}
        onClick={() =>
          void action.execute(
            () => checkInService.checkIn(),
            (result) => {
              client.setQueryData(["vault-check-in", vaultId], result);
              void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
              void client.invalidateQueries({ queryKey: ["owner-vault"] });
              onCheckedIn?.();
            },
          )
        }
      >
        {action.pending ? "Đang xác nhận…" : "Điểm danh"}
      </Button>
      {!allowed && (
        <p className="text-xs">Điểm danh chưa khả dụng trong trạng thái kế hoạch hiện tại.</p>
      )}
      {action.error && (
        <p role="alert" className="text-sm">
          {action.error}
        </p>
      )}
      {action.succeeded && (
        <p role="status" className="text-sm">
          Máy chủ đã ghi nhận điểm danh.
        </p>
      )}
    </div>
  );
}
