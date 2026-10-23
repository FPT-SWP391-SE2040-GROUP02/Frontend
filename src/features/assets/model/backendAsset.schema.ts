import { z } from "zod";
/** Metadata raw của Backend; không chứa ciphertext hoặc nội dung bí mật. */
export const backendAssetSchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  kind: z.enum(["FILE", "TEXT"]),
  name: z.string(),
  description: z.string().nullable(),
  currentVersion: z.object({
    versionNumber: z.number().int().positive(),
    fileName: z.string().nullable(),
    contentType: z.string(),
    sizeBytes: z.number().int().nonnegative(),
    createdAt: z.string().datetime({ offset: true }),
  }),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
  etag: z.string().min(1).max(64),
});
/** Body CreateTextAssetRequest; server sở hữu mã hóa và validation nghiệp vụ. */
export const createTextAssetSchema = z.object({
  name: z.string().regex(/\S/).max(200),
  description: z.string().max(1000).nullable().optional(),
  content: z.string().regex(/\S/).max(100000),
});
/** Body UpdateAssetRequest: chỉ gửi trường đổi; etag lấy từ bản vừa đọc (BE mục 6.5). */
export const updateAssetSchema = z
  .object({
    name: z.string().regex(/\S/, "Nhập tên tài sản.").max(200).optional(),
    description: z.string().max(1000).nullable().optional(),
    etag: z.string().min(1).max(64),
  })
  .refine((value) => value.name !== undefined || value.description !== undefined, {
    message: "Chưa có thay đổi nào.",
  });

/** Phiên bản mới của tài sản TEXT; nội dung chỉ nằm trong form, không vào cache/log. */
export const newTextVersionSchema = z.object({
  content: z.string().regex(/\S/, "Nhập nội dung mới.").max(100000),
  etag: z.string().min(1).max(64),
});

/** Phiên bản cần tải: số nguyên dương, mặc định phiên bản hiện tại. */
export const assetVersionSchema = z.number().int().positive();

export type BackendAsset = z.infer<typeof backendAssetSchema>;
