import { APP_MESSAGES } from "@/shared/constants";
import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
    .email(APP_MESSAGES.VALIDATION.INVALID_EMAIL),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
