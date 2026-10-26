import { z } from "zod";

/** UserResponse từ Backend chính thức; tách khỏi DTO cookie của repository mẫu test. */
export const backendUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().nullable(),
  role: z.enum(["USER", "VERIFIER", "ADMIN", "EXECUTOR"]),
  status: z.enum(["ACTIVE", "LOCKED", "DISABLED"]),
  emailVerified: z.boolean(),
  hasPassword: z.boolean(),
  /** Có ảnh đại diện; thiếu trường thì coi như chưa có (Backend cũ). */
  hasAvatar: z.boolean().optional(),
  /** Lần đổi ảnh gần nhất; đổi giá trị thì tải lại ảnh. */
  avatarUpdatedAt: z.string().datetime({ offset: true }).nullable().optional(),
  createdAt: z.string().datetime({ offset: true }),
});

/** DTO công khai của Backend; không chứa token, password hash hay cập nhật Redux tự động. */
export type BackendUserResponse = z.infer<typeof backendUserResponseSchema>;
