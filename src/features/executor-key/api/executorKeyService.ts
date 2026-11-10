import { axiosClient } from "@/shared/api/axiosClient";
import { executorKeyIssuedSchema, executorKeyStatusSchema } from "../model/executorKey.schema";

function keyUrl(vaultId: string): string {
  return `/vaults/${encodeURIComponent(vaultId)}/executor-key`;
}

/**
 * Mã mở gói Chủ kho giao cho Người thực thi (BE ExecutorKeyController). Cấp mới và cấp lại đòi mã PIN kho:
 * transport tự hỏi PIN khi Backend yêu cầu. Mã gốc không cache, chỉ nằm trong kết quả trả về của lần cấp.
 */
export const executorKeyService = {
  async getStatus(vaultId: string, signal?: AbortSignal) {
    return executorKeyStatusSchema.parse(
      await axiosClient.get<unknown, unknown>(keyUrl(vaultId), { signal }),
    );
  },
  /** Cấp mã lần đầu; đã cấp thì 409 EXECUTOR_KEY_ALREADY_ISSUED. */
  async issue(vaultId: string) {
    return executorKeyIssuedSchema.parse(await axiosClient.post<unknown, unknown>(keyUrl(vaultId)));
  },
  /** Mất mã: cấp mã mới, mã cũ hết hiệu lực; chưa cấp lần nào thì 409 EXECUTOR_KEY_NOT_ISSUED. */
  async reissue(vaultId: string) {
    return executorKeyIssuedSchema.parse(
      await axiosClient.post<unknown, unknown>(`${keyUrl(vaultId)}/reissue`),
    );
  },
};
