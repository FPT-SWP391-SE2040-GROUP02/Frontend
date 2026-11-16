import { isAxiosError } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import {
  executorHandoverKeySchema,
  systemExecutorListSchema,
} from "../model/systemExecutor.schema";

/** Câu hiện cho Người thực thi khi kho chưa tới bước bàn giao nên chưa xem được mã mở gói. */
export const HANDOVER_NOT_STARTED_MESSAGE =
  "Mã mở gói sẽ hiện khi hồ sơ được duyệt và bàn giao bắt đầu.";

/**
 * Lỗi 409 HANDOVER_NOT_ALLOWED với reason HANDOVER_NOT_STARTED: Người thực thi hợp lệ nhưng kho chưa bắt đầu bàn giao.
 * Đây là trạng thái chờ bình thường, không phải lỗi, nên giao diện hiện câu hướng dẫn thay vì khung lỗi.
 */
export function isHandoverNotStarted(error: unknown): boolean {
  if (!isAxiosError<{ code?: string; reason?: string }>(error)) {
    return false;
  }
  const data = error.response?.data;
  if (error.response?.status !== 409 || data === undefined || data === null) {
    return false;
  }
  return data.code === "HANDOVER_NOT_ALLOWED" && data.reason === "HANDOVER_NOT_STARTED";
}

export const systemExecutorsService = {
  /** Danh bạ Người thực thi hệ thống đang hoạt động (cần đăng nhập). */
  async list(signal?: AbortSignal) {
    return systemExecutorListSchema.parse(
      await apiClient.get<unknown, unknown>("/system-executors", { signal }),
    );
  },
  /**
   * Mã mở gói của kho mình phụ trách. Chỉ Người thực thi đã chấp nhận đọc được; người khác nhận 404. Kho chưa
   * bắt đầu bàn giao (hồ sơ chưa được duyệt) nhận 409 HANDOVER_NOT_ALLOWED, reason HANDOVER_NOT_STARTED
   * (xem isHandoverNotStarted); mã cấp trước khi có tính năng gửi trên hệ thống nhận 409 EXECUTOR_KEY_NOT_ISSUED.
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
