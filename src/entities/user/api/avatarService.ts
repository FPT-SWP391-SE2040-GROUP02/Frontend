import { apiClient } from "@/shared/api";
import { toAuthUserViewModel } from "../lib/adapters";
import { backendUserResponseSchema } from "../model/backendUser.schema";

const AVATAR_PATH = "/me/avatar";

/**
 * Ảnh đại diện của người đang đăng nhập (api-contract 6.4a). Ảnh lưu mã hóa ở Backend, không có link công khai:
 * mọi lần đọc đều đi kèm Bearer và trả blob tạm, caller tự thu hồi object URL.
 */
export const avatarService = {
  /** Tải ảnh của chính mình. 404 khi chưa có ảnh. */
  async download(signal?: AbortSignal): Promise<Blob> {
    return apiClient.get<Blob, Blob>(AVATAR_PATH, { responseType: "blob", signal });
  },

  /** Đặt ảnh mới (multipart: file). Trả người dùng đã cập nhật để đưa vào phiên. */
  async upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    const body = await apiClient.put<unknown, unknown>(AVATAR_PATH, form, {
      headers: { "Content-Type": undefined },
    });
    return toAuthUserViewModel(backendUserResponseSchema.parse(body));
  },

  /** Xóa ảnh. Chưa có ảnh vẫn thành công. Trả người dùng đã cập nhật. */
  async remove() {
    const body = await apiClient.delete<unknown, unknown>(AVATAR_PATH);
    return toAuthUserViewModel(backendUserResponseSchema.parse(body));
  },
};
