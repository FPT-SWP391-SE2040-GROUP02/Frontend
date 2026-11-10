import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { executorKeyService } from "../api/executorKeyService";
import type { ExecutorKeyIssued } from "./executorKey.schema";
import { executorKeyKeys } from "./useExecutorKey";

/**
 * Tạo hoặc đổi mã mở gói. Mã gốc chỉ đi qua callback `onIssued`, không nằm trong cache, storage hay state của hook.
 * Việc hỏi PIN do transport lo: người dùng hủy PIN hay Backend báo lỗi thì hook chỉ giữ thông báo lỗi.
 */
export function useExecutorKeyIssue(vaultId: string) {
  const client = useQueryClient();
  const action = usePrivateAction();

  function refreshStatus(): void {
    void client.invalidateQueries({ queryKey: executorKeyKeys.status(vaultId) });
  }

  /** Tạo mã lần đầu (mode "issue") hoặc đổi mã mới (mode "reissue"). */
  async function run(
    mode: "issue" | "reissue",
    onIssued: (result: ExecutorKeyIssued) => void,
  ): Promise<boolean> {
    return action.execute(
      () => {
        if (mode === "reissue") {
          return executorKeyService.reissue(vaultId);
        }
        return executorKeyService.issue(vaultId);
      },
      (result) => {
        onIssued(result);
        refreshStatus();
      },
      refreshStatus,
    );
  }

  /**
   * Dùng ngay sau khi kích hoạt kế hoạch: đọc trạng thái, chỉ cấp khi kho chưa có mã và còn cấp được.
   * Kế hoạch đã chạy dù bước này lỗi; khi đó màn kế hoạch hiện dải "chưa có mã mở gói" để tạo mã.
   */
  async function issueIfMissing(onIssued: (result: ExecutorKeyIssued) => void): Promise<boolean> {
    return action.execute(
      async () => {
        const status = await executorKeyService.getStatus(vaultId);
        if (status.hasKey || !status.canIssue) {
          return null;
        }
        return executorKeyService.issue(vaultId);
      },
      (result) => {
        if (result !== null) {
          onIssued(result);
        }
        refreshStatus();
      },
      refreshStatus,
    );
  }

  return {
    run,
    issueIfMissing,
    pending: action.pending,
    error: action.error,
    reset: action.reset,
  };
}
