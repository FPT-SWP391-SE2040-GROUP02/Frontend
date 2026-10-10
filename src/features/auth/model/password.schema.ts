import { z } from "zod";
import { APP_MESSAGES } from "@/shared/constants";

/** Quy tắc tạo mật khẩu mới theo yêu cầu; không áp dụng cho xác thực mật khẩu hiện có. */
export const PASSWORD_POLICY = {
  minimumLength: 8,
  uppercase: /\p{Lu}/u,
  specialCharacter: /[\p{P}\p{S}]/u,
} as const;

/** Hướng dẫn dùng chung trên form đăng ký và đặt lại mật khẩu. */
export const NEW_PASSWORD_HINT = `Tối thiểu ${PASSWORD_POLICY.minimumLength} ký tự, có ít nhất một chữ hoa và một ký tự đặc biệt.`;

/**
 * @description Validate mật khẩu mới: độ dài, chữ hoa Unicode, dấu câu hoặc ký hiệu.
 * Giữ nguyên giá trị nhập; không trim và không tự yêu cầu thêm chữ thường/chữ số.
 * @example newPasswordSchema.safeParse("Abcdefg!");
 */
export const newPasswordSchema = z
  .string()
  .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Mật khẩu"))
  .min(PASSWORD_POLICY.minimumLength, APP_MESSAGES.VALIDATION.MIN_LENGTH("Mật khẩu", PASSWORD_POLICY.minimumLength))
  .regex(PASSWORD_POLICY.uppercase, APP_MESSAGES.VALIDATION.PASSWORD_UPPERCASE)
  .regex(PASSWORD_POLICY.specialCharacter, APP_MESSAGES.VALIDATION.PASSWORD_SPECIAL_CHARACTER);
