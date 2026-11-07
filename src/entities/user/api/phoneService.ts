import { apiClient } from "@/shared/api";
import { toAuthUserViewModel } from "../lib/adapters";
import { backendUserResponseSchema } from "../model/backendUser.schema";

const PHONE_PATH = "/me/phone";

/** Số điện thoại của người đang đăng nhập; Backend chỉ nhận số di động Việt Nam. */
export const phoneService = {
  /** Đặt hoặc đổi số điện thoại. Trả người dùng đã cập nhật để đưa vào phiên. */
  async setPhone(phone: string) {
    const body = await apiClient.put<unknown, unknown>(PHONE_PATH, { phone });
    return toAuthUserViewModel(backendUserResponseSchema.parse(body));
  },
};
