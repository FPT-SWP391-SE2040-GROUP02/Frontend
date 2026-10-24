import { axiosClient } from "@/shared/api/axiosClient";
import { forgotPasswordSchema } from "../model/forgotPassword.schema";
import { resetPasswordRequestSchema, type ResetPasswordInput } from "../model/resetPassword.schema";

/** Anonymous commands; these endpoints do not mutate auth cookies or require CSRF in BE. */
export const passwordRecoveryService = {
  /** 202: email có tài khoản, link đã được yêu cầu gửi. 404 EMAIL_NOT_FOUND: email chưa đăng ký. */
  async request(email: string): Promise<void> {
    await axiosClient.post<unknown, unknown>(
      "/auth/forgot-password",
      forgotPasswordSchema.parse({ email }),
    );
  },
  /** 204 resets the password and revokes refresh sessions, without issuing a session. */
  async reset(token: string, input: ResetPasswordInput): Promise<void> {
    await axiosClient.post<unknown, unknown>(
      "/auth/reset-password",
      resetPasswordRequestSchema.parse({
        token,
        newPassword: input.password,
        confirmPassword: input.confirmPassword,
      }),
    );
  },
};
