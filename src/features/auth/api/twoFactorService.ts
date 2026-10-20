import { axiosClient } from "@/shared/api/axiosClient";
import {
  twoFactorCodeSchema,
  twoFactorEnableSchema,
  twoFactorSetupSchema,
  twoFactorStatusSchema,
} from "../model/twoFactor.schema";

/** Quản lý TOTP của Admin đang đăng nhập (BE mục 6.2a); Bearer RAM, không cần CSRF. */
export const twoFactorService = {
  async status(signal?: AbortSignal) {
    return twoFactorStatusSchema.parse(
      await axiosClient.get<unknown, unknown>("/auth/2fa/status", { signal }),
    );
  },
  /** Tạo bí mật mới; chỉ trả `secret` và `otpAuthUri` ở lần gọi này. */
  async setup() {
    return twoFactorSetupSchema.parse(await axiosClient.post<unknown, unknown>("/auth/2fa/setup"));
  },
  /** Xác nhận bằng mã TOTP đầu tiên; 8 mã khôi phục chỉ hiện một lần. */
  async enable(code: string) {
    return twoFactorEnableSchema.parse(
      await axiosClient.post<unknown, unknown>("/auth/2fa/enable", {
        code: twoFactorCodeSchema.parse(code.trim()),
      }),
    );
  },
  /** Tắt bằng TOTP hoặc mã khôi phục; 204 không body. */
  async disable(code: string): Promise<void> {
    await axiosClient.post<unknown, unknown>("/auth/2fa/disable", {
      code: twoFactorCodeSchema.parse(code.trim()),
    });
  },
};
