import { z } from "zod";

/**
 * @description Kiểm tra cặp accessToken/expiresAt được mô tả trong API-GUIDELINES của BE.
 * Đây là schema phần credential, không phải DTO đăng nhập hoàn chỉnh hoặc kiểm chữ ký JWT.
 * Không có refreshToken; refresh cookie không được đọc bởi JavaScript.
 * @example accessTokenSchema.safeParse({ accessToken: "opaque-token", expiresAt: "2026-10-10T05:00:00Z" });
 */
export const accessTokenSchema = z.object({
  /** Token opaque do server phát hành; không chấp nhận chuỗi rỗng/khoảng trắng. */
  accessToken: z.string().trim().min(1),
  /** Thời hạn tuyệt đối ISO 8601 có múi giờ; server quyết định hiệu lực. */
  expiresAt: z.string().datetime({ offset: true }),
});

/** Thông tin access token trong RAM; không dùng làm bằng chứng đã xác thực user. */
export type AccessTokenCredentials = z.infer<typeof accessTokenSchema>;
