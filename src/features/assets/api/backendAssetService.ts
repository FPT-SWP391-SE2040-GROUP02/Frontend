import { z } from "zod";
import { apiClient } from "@/shared/api";
import { paginatedListSchema, paginationRequestSchema } from "@/shared/api/pagination.schema";
import type { PaginationParams } from "@/shared/types";
import { backendAssetSchema, createTextAssetSchema } from "../model/backendAsset.schema";
const id = z.string().uuid();
const assets = (vaultId: string) => `/vaults/${id.parse(vaultId)}/assets`;
const page = paginatedListSchema(backendAssetSchema);
/** Transport Backend chính thức, tách khỏi assetService preview cũ. */
export const backendAssetService = {
  /** Metadata; không tải nội dung bí mật qua danh sách. */
  async list(vaultId: string, params?: PaginationParams, signal?: AbortSignal) {
    return page.parse(
      await apiClient.get<unknown, unknown>(assets(vaultId), {
        params: paginationRequestSchema.parse(params ?? {}),
        signal,
      }),
    );
  },
  /** Đọc metadata đúng scope kho. */
  async get(vaultId: string, assetId: string, signal?: AbortSignal) {
    return backendAssetSchema.parse(
      await apiClient.get<unknown, unknown>(`${assets(vaultId)}/${id.parse(assetId)}`, { signal }),
    );
  },
  /** Contract tạo TEXT; không đưa content vào cache hoặc log. */
  async createText(vaultId: string, request: z.infer<typeof createTextAssetSchema>) {
    return backendAssetSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${assets(vaultId)}/text`,
        createTextAssetSchema.parse(request),
      ),
    );
  },
  /** Multipart trực tiếp theo AssetsController, không giả presigned URL. */
  async upload(vaultId: string, file: File, name?: string, description?: string) {
    const fields = z
      .object({
        name: z.string().max(200).optional(),
        description: z.string().max(1000).optional(),
      })
      .parse({ name, description });
    const form = new FormData();
    form.append("file", file);
    if (fields.name !== undefined) form.append("name", fields.name);
    if (fields.description !== undefined) form.append("description", fields.description);
    return backendAssetSchema.parse(
      await apiClient.post<unknown, unknown>(assets(vaultId), form, {
        headers: { "Content-Type": undefined },
      }),
    );
  },
};
