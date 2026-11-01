import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { deathCaseService } from "../api/deathCaseService";
import { executorVaultsKey } from "../model/useExecutorVaults";

/**
 * Nút điểm danh thay chủ kho. Chỉ đặt khi chủ kho quá hạn và kho chưa có hồ sơ chứng tử đang mở.
 * Điểm danh thay mở cả một kỳ mới và hoãn bàn giao, không hoàn tác được, nên phải xác nhận trước khi gửi.
 * Không optimistic: chờ Backend xác nhận rồi tải lại danh sách kho, khi đó kho hết quá hạn và nút tự ẩn.
 */
export function ProxyCheckIn({ vaultId }: { vaultId: string }) {
  const [confirming, setConfirming] = useState(false);
  const client = useQueryClient();
  const action = usePrivateAction();
  const checkIn = () =>
    void action.execute(
      () => deathCaseService.checkInForOwner(vaultId),
      () => {
        setConfirming(false);
        void client.invalidateQueries({ queryKey: executorVaultsKey });
      },
    );
  return (
    <div className="space-y-1">
      <button
        type="button"
        className={buttonStyles.outline}
        onClick={() => {
          action.reset();
          setConfirming(true);
        }}
      >
        Điểm danh thay chủ kho
      </button>
      <p className="text-xs text-heritage-muted">
        Điểm danh hộ owner cho đến khi có giấy chứng tử.
      </p>
      {confirming && (
        <Dialog open onOpenChange={(open) => !open && !action.pending && setConfirming(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Điểm danh thay chủ kho?</DialogTitle>
              <DialogDescription>
                Kỳ điểm danh đang quá hạn sẽ đóng lại và một kỳ mới bắt đầu theo chu kỳ của Chủ kho.
                Việc bàn giao bị hoãn tới hết kỳ mới, và thao tác này không hoàn tác được. Chỉ dùng
                khi bạn biết Chủ kho còn sống, hoặc đang chờ giấy chứng tử.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-heritage-muted">
              Chủ kho sẽ thấy lần điểm danh này trong nhật ký kho, ghi là do Executor thực hiện.
            </p>
            {action.error && (
              <p role="alert" className="text-sm text-destructive">
                {action.error}
              </p>
            )}
            <DialogFooter>
              <button
                type="button"
                className={buttonStyles.outline}
                disabled={action.pending}
                onClick={() => setConfirming(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={buttonStyles.gold}
                disabled={action.pending}
                onClick={checkIn}
              >
                {action.pending ? "Đang điểm danh…" : "Xác nhận điểm danh thay"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
