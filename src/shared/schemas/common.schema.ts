import { z } from "zod";
import { APP_MESSAGES, STATUS } from "@/shared/constants";

/**
 * Common Zod Schemas tái sử dụng cho toàn ứng dụng
 */
export const idSchema = z.union([z.string().min(1), z.number().int().positive()]);

export const emailSchema = z
  .string()
  .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
  .email(APP_MESSAGES.VALIDATION.INVALID_EMAIL);

export const phoneSchema = z
  .string()
  .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Số điện thoại"))
  .regex(/^[0-9+]{9,15}$/, APP_MESSAGES.VALIDATION.INVALID_PHONE);

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

export const paginationParamsSchema = z.object({
  pageIndex: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  searchTerm: z.string().optional(),
  sortBy: z.string().optional(),
  isAscending: z.boolean().default(true),
});

export type PaginationParamsInput = z.infer<typeof paginationParamsSchema>;
