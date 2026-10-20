import { z } from "zod";
import { apiClient } from "@/shared/api";
import { paginatedListSchema, paginationRequestSchema } from "@/shared/api/pagination.schema";
import type { PaginationParams } from "@/shared/types";
import {
  assetVersionSchema,
  backendAssetSchema,
  createTextAssetSchema,
  newTextVersionSchema,
  updateAssetSchema,
} from "../model/backendAsset.schema";
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
  /**
   * Tải nội dung gốc của Owner; BE giải mã và kiểm toàn vẹn trước byte đầu tiên (BE mục 6.5).
   * Trả blob tạm, caller phải tự thu hồi object URL.
   */
  async download(vaultId: string, assetId: string, version?: number): Promise<Blob> {
    return apiClient.get<Blob, Blob>(`${assets(vaultId)}/${id.parse(assetId)}/content`, {
      params: version === undefined ? undefined : { version: assetVersionSchema.parse(version) },
      responseType: "blob",
    });
  },
  /** Đổi tên hoặc mô tả; không tạo phiên bản mới. */
  async update(vaultId: string, assetId: string, request: z.infer<typeof updateAssetSchema>) {
    return backendAssetSchema.parse(
      await apiClient.put<unknown, unknown>(
        `${assets(vaultId)}/${id.parse(assetId)}`,
        updateAssetSchema.parse(request),
      ),
    );
  },
  /** Thay nội dung tài sản FILE bằng tệp mới: tạo phiên bản mới, phiên bản cũ vẫn tính dung lượng. */
  async createFileVersion(vaultId: string, assetId: string, file: File, etag: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("etag", z.string().min(1).max(64).parse(etag));
    return backendAssetSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${assets(vaultId)}/${id.parse(assetId)}/versions`,
        form,
        { headers: { "Content-Type": undefined } },
      ),
    );
  },
  /** Thay nội dung tài sản TEXT: tạo phiên bản mới. */
  async createTextVersion(
    vaultId: string,
    assetId: string,
    request: z.infer<typeof newTextVersionSchema>,
  ) {
    return backendAssetSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${assets(vaultId)}/${id.parse(assetId)}/versions/text`,
        newTextVersionSchema.parse(request),
      ),
    );
  },
  /** Xóa mọi phiên bản; bị chặn khi tài sản nằm trong gói hoặc đã ghim vào lượt bàn giao. */
  async remove(vaultId: string, assetId: string): Promise<void> {
    await apiClient.delete<unknown, unknown>(`${assets(vaultId)}/${id.parse(assetId)}`);
  },
};
