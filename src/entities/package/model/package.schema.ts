import { APP_MESSAGES } from "@/shared/constants";
import { z } from "zod";
import { PACKAGE_FIELD_LABELS, PACKAGE_LIMITS } from "./package.types";

/**
 * Schema tạo gói theo validator C#: tên bắt buộc, mô tả nullable/tùy chọn.
 * Kiểm tra độ dài tên gốc; không trim trước validation vì BE trim sau validator.
 */
export const createPackageSchema = z.object({
  name: z
    .string()
    .regex(/\S/, APP_MESSAGES.VALIDATION.REQUIRED(PACKAGE_FIELD_LABELS.NAME))
    .max(
      PACKAGE_LIMITS.NAME_MAX_LENGTH,
      APP_MESSAGES.VALIDATION.MAX_LENGTH(PACKAGE_FIELD_LABELS.NAME, PACKAGE_LIMITS.NAME_MAX_LENGTH),
    ),
  description: z
    .string()
    .max(
      PACKAGE_LIMITS.DESCRIPTION_MAX_LENGTH,
      APP_MESSAGES.VALIDATION.MAX_LENGTH(
        PACKAGE_FIELD_LABELS.DESCRIPTION,
        PACKAGE_LIMITS.DESCRIPTION_MAX_LENGTH,
      ),
    )
    .nullable()
    .optional(),
});

/**
 * Schema PUT theo UpdateContainerRequest: etag bắt buộc; null giữ nguyên giá trị.
 */
export const updatePackageSchema = z.object({
  etag: z.string().min(1).max(64),
  name: z.string().max(PACKAGE_LIMITS.NAME_MAX_LENGTH).nullable().optional(),
  description: createPackageSchema.shape.description,
});

/** Raw ContainerResponse; xóa gói (REMOVED) không xóa hẳn dòng nhưng không khôi phục được. */
export const packageResponseSchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["DRAFT", "READY", "REMOVED"]),
  assetIds: z.array(z.string().uuid()),
  beneficiaryIds: z.array(z.string().uuid()),
  missingRequirements: z.array(z.string()),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
  removedAt: z.string().datetime({ offset: true }).nullable(),
  etag: z.string().min(1).max(64),
});

/** Dữ liệu đầu vào của form tạo gói, suy ra từ schema; không thay thế DTO gửi API. */
export type CreatePackageFormInput = z.input<typeof createPackageSchema>;
