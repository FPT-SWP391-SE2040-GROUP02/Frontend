import { apiClient } from "@/shared/api/axiosClient";
import {
  executorHandoverKeySchema,
  systemExecutorListSchema,
} from "../model/systemExecutor.schema";

export const systemExecutorsService = {
  /** Danh bạ Người thực thi hệ thống đang hoạt động (cần đăng nhập). */
  async list(signal?: AbortSignal) {
    return systemExecutorListSchema.parse(
      await apiClient.get<unknown, unknown>("/system-executors", { signal }),
    );
  },
  /**
   * Mã mở gói của kho mình phụ trách. Chỉ Người thực thi đã chấp nhận đọc được; người khác nhận 404,
   * mã cấp trước khi có tính năng gửi trên hệ thống nhận 409 EXECUTOR_KEY_NOT_ISSUED.
   */
  async getHandoverKey(vaultId: string, signal?: AbortSignal) {
    return executorHandoverKeySchema.parse(
      await apiClient.get<unknown, unknown>(
        `/executor/vaults/${encodeURIComponent(vaultId)}/handover-key`,
        { signal },
      ),
    );
  },
};
