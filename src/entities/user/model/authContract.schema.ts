import { z } from "zod";
import { backendUserResponseSchema } from "./backendUser.schema";

/** UserResponse raw của Backend, strip properties ngoài hợp đồng. */
export const authUserDtoSchema = backendUserResponseSchema;
/** Login/refresh raw body; token opaque giữ nguyên bytes, không kiểm chữ ký JWT tại FE. */
export const authSessionResponseSchema = z.object({
  accessToken: z
    .string()
    .min(1)
    .refine((token) => token.trim().length > 0),
  expiresIn: z.number().int().nonnegative(),
  user: authUserDtoSchema,
});
/** GET session trả UserResponse trực tiếp. */
export const currentSessionResponseSchema = authUserDtoSchema;
/** Proof không auth credential, không trim/đổi bytes hoặc persist. */
export const authCsrfTokenResponseSchema = z.object({
  requestToken: z.string().refine((token) => token.trim().length > 0),
});
