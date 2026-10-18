import { APP_MESSAGES } from "@/shared/constants";
import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
    .email(APP_MESSAGES.VALIDATION.INVALID_EMAIL)
    .max(256, "Email không được vượt quá 256 ký tự."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
