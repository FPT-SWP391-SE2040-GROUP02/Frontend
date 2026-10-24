import { z } from "zod";
import { axiosClient } from "@/shared/api/axiosClient";
import {
  changePasswordMethodSchema,
  linkGoogleMethodSchema,
  loginMethodSchema,
  removePasswordMethodSchema,
  setPasswordMethodSchema,
  unlinkGoogleMethodSchema,
  verifyPasswordMethodSchema,
} from "../model/loginMethods.schema";

const BASE = "/me/login-methods";

/**
 * Phương thức đăng nhập của người đang đăng nhập (BE mục 6.4). Chỉ Bearer RAM, không cần CSRF;
 * BE giới hạn 10 yêu cầu/phút và bắt xác thực lại bằng mật khẩu và/hoặc Google ID token mới.
 */
export const loginMethodsService = {
  async list(signal?: AbortSignal) {
    return z
      .array(loginMethodSchema)
      .parse(await axiosClient.get<unknown, unknown>(BASE, { signal }));
  },
  /** Kiểm tra mật khẩu hiện tại (204), không đổi gì; sai thì 401 REAUTHENTICATION_FAILED. */
  async verifyPassword(request: z.infer<typeof verifyPasswordMethodSchema>): Promise<void> {
    await axiosClient.post<unknown, unknown>(
      `${BASE}/password/verify`,
      verifyPasswordMethodSchema.parse(request),
    );
  },
  /** Thêm Google: cần Google ID token mới và mật khẩu hiện tại. */
  async linkGoogle(request: z.infer<typeof linkGoogleMethodSchema>) {
    return loginMethodSchema.parse(
      await axiosClient.post<unknown, unknown>(
        `${BASE}/google`,
        linkGoogleMethodSchema.parse(request),
      ),
    );
  },
  /** Gỡ Google (204); chưa liên kết thì vẫn thành công. */
  async unlinkGoogle(request: z.infer<typeof unlinkGoogleMethodSchema>): Promise<void> {
    await axiosClient.post<unknown, unknown>(
      `${BASE}/google/unlink`,
      unlinkGoogleMethodSchema.parse(request),
    );
  },
  /** Tài khoản chỉ có Google đặt thêm mật khẩu: xác thực lại bằng Google ID token mới. */
  async setPassword(request: z.infer<typeof setPasswordMethodSchema>): Promise<void> {
    await axiosClient.post<unknown, unknown>(
      `${BASE}/password`,
      setPasswordMethodSchema.parse(request),
    );
  },
  /** Đổi mật khẩu app khi đang đăng nhập (204): cần mật khẩu hiện tại; sai thì 401 REAUTHENTICATION_FAILED. */
  async changePassword(request: z.infer<typeof changePasswordMethodSchema>): Promise<void> {
    await axiosClient.post<unknown, unknown>(
      `${BASE}/password/change`,
      changePasswordMethodSchema.parse(request),
    );
  },
  /** Gỡ mật khẩu, chỉ còn Google: cần mật khẩu hiện tại và Google ID token mới. */
  async removePassword(request: z.infer<typeof removePasswordMethodSchema>): Promise<void> {
    await axiosClient.post<unknown, unknown>(
      `${BASE}/password/remove`,
      removePasswordMethodSchema.parse(request),
    );
  },
};
