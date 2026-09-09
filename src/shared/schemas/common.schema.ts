import { z } from "zod";
import { APP_MESSAGES, STATUS } from "@/shared/constants";

/**
 * @description Zod Schema kiểm tra tính hợp lệ của ID thực thể (chuỗi không rỗng hoặc số nguyên dương).
 * @example
 * idSchema.parse("123"); // hợp lệ
 * idSchema.parse(10);   // hợp lệ
 */
export const idSchema = z.union([z.string().min(1), z.number().int().positive()]);

/**
 * @description Zod Schema kiểm tra định dạng email tiêu chuẩn và bắt buộc không được để trống.
 * @example
 * emailSchema.parse("user@example.com"); // hợp lệ
 */
export const emailSchema = z
  .string()
  .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
  .email(APP_MESSAGES.VALIDATION.INVALID_EMAIL);

/**
 * @description Zod Schema kiểm tra định dạng số điện thoại (từ 9 đến 15 chữ số, hỗ trợ dấu +).
 * @example
 * phoneSchema.parse("0912345678"); // hợp lệ
 */
export const phoneSchema = z
  .string()
  .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Số điện thoại"))
  .regex(/^[0-9+]{9,15}$/, APP_MESSAGES.VALIDATION.INVALID_PHONE);

/**
 * @description Zod Schema kiểm tra trạng thái thực thể nằm trong danh sách hằng số STATUS cho phép.
 */
export const statusSchema = z.enum([
  STATUS.ACTIVE,
  STATUS.INACTIVE,
  STATUS.PENDING,
  STATUS.APPROVED,
  STATUS.REJECTED,
  STATUS.CANCELLED,
  STATUS.COMPLETED,
  STATUS.DRAFT,
]);

/**
 * @description Zod Schema validate và cung cấp giá trị mặc định cho tham số phân trang, tìm kiếm, sắp xếp.
 */
export const paginationParamsSchema = z.object({
  pageIndex: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  searchTerm: z.string().optional(),
  sortBy: z.string().optional(),
  isAscending: z.boolean().default(true),
});

/**
 * @description Kiểu dữ liệu TypeScript suy diễn tự động từ `paginationParamsSchema`.
 */
export type PaginationParamsInput = z.infer<typeof paginationParamsSchema>;
