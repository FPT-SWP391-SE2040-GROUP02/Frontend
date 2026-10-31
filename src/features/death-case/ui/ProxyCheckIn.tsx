import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { deathCaseService } from "../api/deathCaseService";
import { executorVaultsKey } from "../model/useExecutorVaults";

/**
 * Nút điểm danh thay chủ kho. Chỉ đặt khi chủ kho quá hạn và kho chưa có hồ sơ chứng tử đang mở.
 * Không optimistic: chờ Backend xác nhận rồi tải lại danh sách kho, khi đó kho hết quá hạn và nút tự ẩn.
 */
export function ProxyCheckIn({ vaultId }: { vaultId: string }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const checkIn = () =>
    void action.execute(
      () => deathCaseService.checkInForOwner(vaultId),
      () => {
        void client.invalidateQueries({ queryKey: executorVaultsKey });
      },
    );
  return (
    <div className="space-y-1">
      <button
        type="button"
        className={buttonStyles.outline}
        onClick={checkIn}
        disabled={action.pending}
      >
        {action.pending ? "Đang điểm danh…" : "Điểm danh thay chủ kho"}
      </button>
      <p className="text-xs text-heritage-muted">
        Điểm danh hộ owner cho đến khi có giấy chứng tử.
      </p>
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
    </div>
  );
}
