import { apiClient } from "@/shared/api";
import { toAuthUserViewModel } from "../lib/adapters";
import { backendUserResponseSchema } from "../model/backendUser.schema";

const PHONE_PATH = "/me/phone";

/**
 * Số điện thoại của người đang đăng nhập (mọi vai trò). Backend chỉ bỏ ký tự phân cách, không kiểm đầu số;
 * mỗi số chỉ thuộc một tài khoản (409 PHONE_ALREADY_EXISTS).
 */
export const phoneService = {
  /** Đặt hoặc đổi số. Trả người dùng đã cập nhật để đưa vào phiên. */
  async set(phone: string) {
    const body = await apiClient.put<unknown, unknown>(PHONE_PATH, { phone });
    return toAuthUserViewModel(backendUserResponseSchema.parse(body));
  },
};
