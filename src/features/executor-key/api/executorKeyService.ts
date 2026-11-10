import { axiosClient } from "@/shared/api/axiosClient";
import { executorKeyIssuedSchema, executorKeyStatusSchema } from "../model/executorKey.schema";

function keyUrl(vaultId: string): string {
  return `/vaults/${encodeURIComponent(vaultId)}/executor-key`;
}

/**
 * Mã mở gói Chủ kho giao cho Người thực thi (BE ExecutorKeyController). Tạo mới và đổi mã mới đòi mã PIN kho:
 * transport tự hỏi PIN khi Backend yêu cầu. Mã gốc không cache, chỉ nằm trong kết quả trả về của lần cấp.
 */
export const executorKeyService = {
  async getStatus(vaultId: string, signal?: AbortSignal) {
    return executorKeyStatusSchema.parse(
      await axiosClient.get<unknown, unknown>(keyUrl(vaultId), { signal }),
    );
  },
  /** Tạo mã lần đầu; đã có thì 409 EXECUTOR_KEY_ALREADY_ISSUED. */
  async issue(vaultId: string) {
    return executorKeyIssuedSchema.parse(await axiosClient.post<unknown, unknown>(keyUrl(vaultId)));
  },
  /** Đổi mã mới: tạo mã khác, mã cũ hết dùng được; chưa cấp lần nào thì 409 EXECUTOR_KEY_NOT_ISSUED. */
  async reissue(vaultId: string) {
    return executorKeyIssuedSchema.parse(
      await axiosClient.post<unknown, unknown>(`${keyUrl(vaultId)}/reissue`),
    );
  },
};
