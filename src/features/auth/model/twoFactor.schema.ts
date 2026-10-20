import { z } from "zod";
import { authSessionResponseSchema } from "@/entities/user/model/authContract.schema";

/** Thử thách trả thay cho phiên khi Admin đã bật TOTP: chưa có token, chưa có cookie (BE mục 6.2a). */
export const twoFactorChallengeSchema = z.object({
  twoFactorRequired: z.literal(true),
  challengeToken: z.string().min(1).max(512),
  expiresIn: z.number().int().positive(),
});
export type TwoFactorChallenge = z.infer<typeof twoFactorChallengeSchema>;

/** Login và link-confirm trả hoặc phiên hoặc thử thách; thử thách xét trước vì có `twoFactorRequired`. */
export const loginOutcomeSchema = z.union([twoFactorChallengeSchema, authSessionResponseSchema]);

/** Phân nhánh kết quả đăng nhập; không suy đoán từ vai trò. */
export function isTwoFactorChallenge(
  value: z.infer<typeof loginOutcomeSchema>,
): value is TwoFactorChallenge {
  return "twoFactorRequired" in value;
}

/** Mã TOTP 6 số. */
export const totpCodeSchema = z.string().regex(/^\d{6}$/, "Mã xác thực gồm đúng 6 chữ số.");

/** Mã khôi phục dạng XXXXXX-XXXXXX, không phân biệt hoa thường; BE là nơi kiểm tra cuối. */
export const recoveryCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{6}-?[A-Za-z0-9]{6}$/, "Mã khôi phục có dạng XXXXXX-XXXXXX.");

/** TOTP hoặc mã khôi phục (disable và verify nhận cả hai). */
export const twoFactorCodeSchema = z.union([totpCodeSchema, recoveryCodeSchema]);

export const twoFactorVerifyRequestSchema = z.object({
  challengeToken: z.string().min(1).max(512),
  code: twoFactorCodeSchema,
});

export const twoFactorStatusSchema = z.object({
  enabled: z.boolean(),
  setupPending: z.boolean(),
  recoveryCodesRemaining: z.number().int().nonnegative(),
});
export const twoFactorSetupSchema = z.object({
  secret: z.string().min(1),
  otpAuthUri: z.string().min(1),
});
export const twoFactorEnableSchema = z.object({
  recoveryCodes: z.array(z.string().min(1)).min(1),
});
export type TwoFactorStatus = z.infer<typeof twoFactorStatusSchema>;
export type TwoFactorSetup = z.infer<typeof twoFactorSetupSchema>;
