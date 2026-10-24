import { z } from "zod";

const timestamp = z.string().datetime({ offset: true });

/** `LoginMethodResponse` của BE (mục 6.4); OTP và passkey chưa có API nên không nằm ở đây. */
export const loginMethodSchema = z.object({
  method: z.enum(["PASSWORD", "GOOGLE"]),
  email: z.string().nullable(),
  linkedAt: timestamp.nullable(),
  lastUsedAt: timestamp.nullable(),
  /** false khi là phương thức cuối: khóa nút gỡ (BE vẫn chặn bằng LAST_LOGIN_METHOD). */
  canRemove: z.boolean(),
});
export type LoginMethod = z.infer<typeof loginMethodSchema>;

/** Google ID token mới dùng để xác thực lại; không trim, không lưu storage. */
const googleToken = z.string().min(1).max(4096);
const nonce = z.string().max(256).optional();
const currentPassword = z.string().min(1, "Nhập mật khẩu hiện tại.").max(128);

export const linkGoogleMethodSchema = z.object({
  idToken: googleToken,
  nonce,
  currentPassword,
});
export const unlinkGoogleMethodSchema = z.object({ currentPassword });
/** Chỉ kiểm tra mật khẩu hiện tại, không đổi dữ liệu (mở bước chọn Google khi liên kết). */
export const verifyPasswordMethodSchema = z.object({ currentPassword });
export const removePasswordMethodSchema = z.object({
  currentPassword,
  googleIdToken: googleToken,
  nonce,
});
/** Mật khẩu mới theo BE: 8–128 ký tự và khớp xác nhận. */
export const newPasswordFieldsSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
      .max(128, "Mật khẩu tối đa 128 ký tự."),
    confirmPassword: z.string().max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"],
  });
export const changePasswordMethodSchema = z.object({
  currentPassword,
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().max(128),
});
export const setPasswordMethodSchema = z.object({
  googleIdToken: googleToken,
  nonce,
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().max(128),
});

export const methodLabels: Record<LoginMethod["method"], string> = {
  PASSWORD: "Mật khẩu",
  GOOGLE: "Google",
};
