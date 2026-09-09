import { z } from "zod";
import { emailSchema, phoneSchema, statusSchema } from "@/shared/schemas";
import { ROLES } from "@/shared/constants/roles";
import { APP_MESSAGES } from "@/shared/constants";

/**
 * @description Zod Schema kiểm tra vai trò người dùng hợp lệ trong hệ thống.
 */
export const roleSchema = z.enum([
  ROLES.ADMIN,
  ROLES.STAFF,
  ROLES.CUSTOMER,
  ROLES.GUEST,
]);

/**
 * @description Zod Schema kiểm tra thông tin người dùng cơ bản.
 */
export const userSchema = z.object({
  id: z.string().min(1),
  email: emailSchema,
  fullName: z.string().min(2, APP_MESSAGES.VALIDATION.MIN_LENGTH("Họ tên", 2)),
  phone: phoneSchema.optional(),
  avatarUrl: z.string().url().optional(),
  role: roleSchema,
  status: statusSchema,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type UserSchemaInput = z.infer<typeof userSchema>;
