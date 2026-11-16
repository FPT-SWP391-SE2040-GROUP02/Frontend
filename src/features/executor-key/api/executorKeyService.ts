import { axiosClient } from "@/shared/api/axiosClient";
import { VAULT_PIN_HEADER } from "@/shared/api/vaultPin";
import { executorKeyStatusSchema } from "../model/executorKey.schema";

function keyUrl(vaultId: string): string {
  return `/vaults/${encodeURIComponent(vaultId)}/executor-key`;
}

/**
 * Mã mở gói của kho (BE ExecutorKeyController). Mã do server tạo khi Chủ kho ký kích hoạt và chỉ gửi cho người
 * nhận sau khi hồ sơ được duyệt; Chủ kho không cấp lần đầu và không bao giờ nhận lại mã gốc.
 */
export const executorKeyService = {
  async getStatus(vaultId: string, signal?: AbortSignal) {
    return executorKeyStatusSchema.parse(
      await axiosClient.get<unknown, unknown>(keyUrl(vaultId), { signal }),
    );
  },
  /**
   * Đổi mã mới: mã cũ hết dùng được ngay. Đòi mã PIN kho qua header X-Vault-Pin; hộp thoại đổi mã có ô PIN riêng
   * nên lỗi PIN trả về đó, không mở hộp thoại PIN chung. Response chỉ có trạng thái (số bản), không có mã.
   */
  async reissue(vaultId: string, pin: string) {
    return executorKeyStatusSchema.parse(
      await axiosClient.post<unknown, unknown>(`${keyUrl(vaultId)}/reissue`, null, {
        headers: { [VAULT_PIN_HEADER]: pin },
        skipVaultPinPrompt: true,
      }),
    );
  },
};
