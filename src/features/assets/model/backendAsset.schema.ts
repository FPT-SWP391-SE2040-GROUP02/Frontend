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
