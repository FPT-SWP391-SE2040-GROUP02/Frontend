import { z } from "zod";
import { apiClient, VAULT_PIN_HEADER } from "@/shared/api";
import { paginatedListSchema, paginationRequestSchema } from "@/shared/api/pagination.schema";
import type { PaginationParams } from "@/shared/types";
import {
  backendAssetSchema,
  createTextAssetSchema,
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
  /** Multipart trực tiếp theo AssetsController, không giả presigned URL; progress theo byte đã gửi. */
  async upload(
    vaultId: string,
    file: File,
    name?: string,
    description?: string,
    onUploadProgress?: (percent: number) => void,
  ) {
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
        onUploadProgress: (event) => {
          if (event.total && onUploadProgress) {
            onUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      }),
    );
  },
  /**
   * Tải nội dung gốc của Owner; BE giải mã và kiểm toàn vẹn trước byte đầu tiên (BE mục 6.5).
   * Trả blob tạm, caller phải tự thu hồi object URL.
   */
  async download(vaultId: string, assetId: string): Promise<Blob> {
    return apiClient.get<Blob, Blob>(`${assets(vaultId)}/${id.parse(assetId)}/content`, {
      responseType: "blob",
    });
  },
  /**
   * Đổi tên hoặc mô tả; không tạo phiên bản mới. Backend đòi PIN kho: truyền PIN đã kiểm khi mở chế độ sửa để
   * khỏi hỏi lại; thiếu hoặc PIN đã đổi thì transport tự hỏi qua hộp thoại PIN.
   */
  async update(
    vaultId: string,
    assetId: string,
    request: z.infer<typeof updateAssetSchema>,
    pin?: string,
  ) {
    const headers: Record<string, string> = {};
    if (pin !== undefined) headers[VAULT_PIN_HEADER] = pin;
    return backendAssetSchema.parse(
      await apiClient.put<unknown, unknown>(
        `${assets(vaultId)}/${id.parse(assetId)}`,
        updateAssetSchema.parse(request),
        { headers },
      ),
    );
  },
  /** Xóa tài sản cùng nội dung; bị chặn khi tài sản nằm trong gói hoặc đã ghim vào lượt bàn giao. */
  async remove(vaultId: string, assetId: string): Promise<void> {
    await apiClient.delete<unknown, unknown>(`${assets(vaultId)}/${id.parse(assetId)}`);
  },
};
