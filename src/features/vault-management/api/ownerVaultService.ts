import { z } from "zod";
import { apiClient } from "@/shared/api";
import { paginatedListSchema, paginationRequestSchema } from "@/shared/api/pagination.schema";
import type { PaginationParams } from "@/shared/types";
import { vaultResponseSchema } from "@/entities/vault/model/vault.schema";
import {
  createPackageSchema,
  packageResponseSchema,
  updatePackageSchema,
} from "@/entities/package/model/package.schema";
import type {
  CreatePackageRequest,
  UpdatePackageRequest,
} from "@/entities/package/model/package.types";

const idSchema = z.string().uuid();
const packageListSchema = paginatedListSchema(packageResponseSchema);
const createVaultSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});
const containers = (vaultId: string) => `/vaults/${idSchema.parse(vaultId)}/containers`;
const container = (vaultId: string, id: string) => `${containers(vaultId)}/${idSchema.parse(id)}`;

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
  /** PUT chỉ metadata kho, giữ etag đọc ban đầu; không tự retry 409. */
  async updateMine(vaultId: string, request: z.infer<typeof createVaultSchema> & { etag: string }) {
    const body = createVaultSchema.extend({ etag: z.string().min(1).max(64) }).parse(request);
    return vaultResponseSchema.parse(
      await apiClient.put<unknown, unknown>(`/vaults/${idSchema.parse(vaultId)}`, body),
    );
  },
  /** Scope theo vaultId, phân trang raw items/totalCount. */
  async listPackages(
    vaultId: string,
    params?: PaginationParams,
    signal?: AbortSignal,
    includeRemoved = false,
  ) {
    return packageListSchema.parse(
      await apiClient.get<unknown, unknown>(containers(vaultId), {
        params: { ...paginationRequestSchema.parse(params ?? {}), includeRemoved },
        signal,
      }),
    );
  },
  /** Đọc gói trong kho; không dùng alias /packages. */
  async getPackage(vaultId: string, id: string, signal?: AbortSignal) {
    return packageResponseSchema.parse(
      await apiClient.get<unknown, unknown>(container(vaultId, id), { signal }),
    );
  },
  /** Tạo gói rỗng, trạng thái do server quyết định. */
  async createPackage(vaultId: string, request: CreatePackageRequest) {
    return packageResponseSchema.parse(
      await apiClient.post<unknown, unknown>(
        containers(vaultId),
        createPackageSchema.parse(request),
      ),
    );
  },
  /** PUT với etag, không retry ghi đè khi 409. */
  async updatePackage(vaultId: string, id: string, request: UpdatePackageRequest) {
    return packageResponseSchema.parse(
      await apiClient.put<unknown, unknown>(
        container(vaultId, id),
        updatePackageSchema.parse(request),
      ),
    );
  },
  /** DELETE xóa gói (trả gói REMOVED, không khôi phục được); caller phải có đồng ý của người dùng trước khi gửi xác nhận tác động kế hoạch. */
  async removePackage(vaultId: string, id: string, confirmPlanDeactivation = false) {
    return packageResponseSchema.parse(
      await apiClient.delete<unknown, unknown>(container(vaultId, id), {
        params: { confirmPlanDeactivation },
      }),
    );
  },
  /** Quan hệ container: thêm bằng body DTO, gỡ bằng URL + confirmation tường minh. */
  async changeMember(
    vaultId: string,
    containerId: string,
    relation: "assets" | "beneficiaries",
    memberId: string,
    attach: boolean,
    confirmPlanDeactivation = false,
  ) {
    const base = `${container(vaultId, containerId)}/${relation}`;
    const member = idSchema.parse(memberId);
    const result = attach
      ? await apiClient.post<unknown, unknown>(
          base,
          relation === "assets" ? { assetId: member } : { beneficiaryId: member },
        )
      : await apiClient.delete<unknown, unknown>(`${base}/${member}`, {
          params: { confirmPlanDeactivation },
        });
    return packageResponseSchema.parse(result);
  },
};
