import { z } from "zod";

/** UserResponse từ Backend chính thức; tách khỏi DTO cookie của repository mẫu test. */
export const backendUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().nullable(),
  role: z.enum(["USER", "VERIFIER", "ADMIN"]),
  status: z.enum(["ACTIVE", "LOCKED", "DISABLED"]),
  emailVerified: z.boolean(),
  hasPassword: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

/** DTO công khai của Backend; không chứa token, password hash hay cập nhật Redux tự động. */
export type BackendUserResponse = z.infer<typeof backendUserResponseSchema>;
