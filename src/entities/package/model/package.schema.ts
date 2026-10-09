import { z } from "zod";
import { APP_MESSAGES } from "@/shared/constants";
import {
  PACKAGE_FIELD_LABELS,
  PACKAGE_LIMITS,
} from "./package.types";

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
      APP_MESSAGES.VALIDATION.MAX_LENGTH(
        PACKAGE_FIELD_LABELS.NAME,
        PACKAGE_LIMITS.NAME_MAX_LENGTH,
      ),
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
 * Schema sửa gói dùng cùng quy tắc với tạo gói trong snapshot BE.
 * Không dùng partial(): UpdatePackageRequestValidator vẫn yêu cầu name.
 */
export const updatePackageSchema = createPackageSchema;
