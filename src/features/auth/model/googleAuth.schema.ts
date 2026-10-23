import { z } from "zod";
import { authSessionResponseSchema } from "@/entities/user/model/authContract.schema";

/** Request C# GoogleLoginRequest; idToken/nonce không được trim hoặc lưu storage. */
export const googleLoginRequestSchema = z.object({
  idToken: z
    .string()
    .min(1)
    .max(4096)
    .refine((value) => value.trim().length > 0),
  nonce: z.string().max(256).optional(),
  rememberMe: z.boolean(),
  returnUrl: z.string().max(2048).optional(),
});
/** Vé liên kết phải do Backend cấp; email không thay cho vé. */
export const googleLinkRequestSchema = z.object({
  linkTicket: z
    .string()
    .min(1)
    .max(256)
    .refine((value) => value.trim().length > 0),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean(),
});
/** Response Google có hai nhánh, không nhầm challenge thành session. */
export const googleLoginResponseSchema = z.union([
  z.object({
    signedIn: z.literal(true),
    accountCreated: z.boolean(),
    returnUrl: z.string().nullable(),
    session: authSessionResponseSchema,
  }),
  /** Admin đã bật 2FA: có thử thách, chưa có phiên (dạng phẳng của BE). */
  z.object({
    signedIn: z.literal(false),
    twoFactorRequired: z.literal(true),
    challengeToken: z.string().min(1).max(512),
    challengeExpiresIn: z.number().int().positive(),
  }),
  z.object({
    signedIn: z.literal(false),
    accountCreated: z.boolean(),
    returnUrl: z.string().nullable(),
    linkTicket: z.string().min(1).max(256),
    maskedEmail: z.string(),
  }),
]);
