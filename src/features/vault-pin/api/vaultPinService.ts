import { axiosClient } from "@/shared/api/axiosClient";
import {
  changePinFormSchema,
  resetPinFormSchema,
  setPinFormSchema,
  vaultPinStatusSchema,
  type ChangePinFormValues,
  type ResetPinFormValues,
  type SetPinFormValues,
} from "../model/vaultPin.schema";

function pinUrl(vaultId: string): string {
  return `/vaults/${encodeURIComponent(vaultId)}/pin`;
}

/**
 * Mã PIN của kho (BE mục 6.20). Đặt, đổi, quên PIN tự xử lý lỗi trên form; các thao tác khác của kho gửi PIN
 * qua header X-Vault-Pin do shared/api/vaultPin.ts thêm khi Backend đòi.
 */
export const vaultPinService = {
  async getStatus(vaultId: string, signal?: AbortSignal) {
    return vaultPinStatusSchema.parse(
      await axiosClient.get<unknown, unknown>(pinUrl(vaultId), { signal }),
    );
  },
  /** Đặt PIN lần đầu; đã có PIN thì 409 VAULT_PIN_ALREADY_SET. */
  async set(vaultId: string, values: SetPinFormValues) {
    const { pin, confirmPin } = setPinFormSchema.parse(values);
    return vaultPinStatusSchema.parse(
      await axiosClient.post<unknown, unknown>(pinUrl(vaultId), { pin, confirmPin }),
    );
  },
  /** Đổi PIN bằng PIN cũ; sai PIN cũ thì 403 INVALID_VAULT_PIN, bị khóa thì 423. */
  async change(vaultId: string, values: ChangePinFormValues) {
    const { currentPin, newPin, confirmPin } = changePinFormSchema.parse(values);
    return vaultPinStatusSchema.parse(
      await axiosClient.post<unknown, unknown>(`${pinUrl(vaultId)}/change`, {
        currentPin,
        newPin,
        confirmPin,
      }),
    );
  },
  /** Quên PIN: đúng mật khẩu tài khoản thì đặt PIN mới ngay và gỡ khóa; sai mật khẩu thì 401 REAUTHENTICATION_FAILED. */
  async reset(vaultId: string, values: ResetPinFormValues) {
    const { password, newPin, confirmPin } = resetPinFormSchema.parse(values);
    return vaultPinStatusSchema.parse(
      await axiosClient.post<unknown, unknown>(`${pinUrl(vaultId)}/reset`, {
        password,
        newPin,
        confirmPin,
      }),
    );
  },
};
