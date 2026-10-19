import type { z } from "zod";
import type {
  createPackageSchema,
  packageResponseSchema,
  updatePackageSchema,
} from "./package.schema";

/** Giới hạn CreateContainerRequest/UpdateContainerRequest trong Backend. */
export const PACKAGE_LIMITS = { NAME_MAX_LENGTH: 200, DESCRIPTION_MAX_LENGTH: 1000 } as const;
/** Nhãn validation của form gói. */
export const PACKAGE_FIELD_LABELS = { NAME: "Tên gói", DESCRIPTION: "Mô tả" } as const;
/** Package là tên UI; wire DTO là ContainerResponse. */
export type PackageResponse = z.infer<typeof packageResponseSchema>;
/** Body POST containers. */
export type CreatePackageRequest = z.infer<typeof createPackageSchema>;
/** Body PUT containers, etag bắt buộc; null giữ giá trị hiện tại. */
export type UpdatePackageRequest = z.infer<typeof updatePackageSchema>;
