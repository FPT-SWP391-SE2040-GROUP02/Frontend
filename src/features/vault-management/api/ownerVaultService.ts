import { z } from "zod";
import { apiClient } from "@/shared/api";
import { vaultResponseSchema } from "@/entities/vault/model/vault.schema";

const idSchema = z.string().uuid();

const createVaultSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});
const updateVaultSchema = createVaultSchema.extend({
  etag: z.string().min(1).max(64),
  executorNote: z.string().max(2000).optional(),
});

/** Transport raw của Backend chính thức; không cấp quyền từ role UI. */
export const ownerVaultService = {
  /** 404 VAULT_NOT_FOUND được giữ nguyên để UI hiện trạng thái chưa tạo kho. */
  async getMine(signal?: AbortSignal) {
    return vaultResponseSchema.parse(
      await apiClient.get<unknown, unknown>("/vaults/me", { signal }),
    );
  },
  /** POST trả kho mới hoặc kho đã có; không gửi ownerId. */
  async createMine(request?: z.infer<typeof createVaultSchema>) {
    return vaultResponseSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/vaults",
        request === undefined ? undefined : createVaultSchema.parse(request),
      ),
    );
  },
  /** PUT metadata kho và hướng dẫn cho Executor (bỏ trường = giữ nguyên), giữ etag đọc ban đầu; không tự retry 409. */
  async updateMine(vaultId: string, request: z.infer<typeof updateVaultSchema>) {
    const body = updateVaultSchema.parse(request);
    return vaultResponseSchema.parse(
      await apiClient.put<unknown, unknown>(`/vaults/${idSchema.parse(vaultId)}`, body),
    );
  },
};
