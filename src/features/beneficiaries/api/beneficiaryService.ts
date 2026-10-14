import { z } from "zod";
import { apiClient } from "@/shared/api";
import { paginatedListSchema, paginationRequestSchema } from "@/shared/api/pagination.schema";
import type { PaginationParams } from "@/shared/types";
import {
  beneficiaryResponseSchema,
  createBeneficiarySchema,
  updateBeneficiarySchema,
} from "../model/beneficiary.schema";
const id = z.string().uuid();
const collection = (vaultId: string) => `/vaults/${id.parse(vaultId)}/beneficiaries`;
const detail = (vaultId: string, beneficiaryId: string) =>
  `${collection(vaultId)}/${id.parse(beneficiaryId)}`;
const page = paginatedListSchema(beneficiaryResponseSchema);
/** Transport hồ sơ người nhận cấp kho; không persist CCCD đầy đủ. */
export const beneficiaryService = {
  /** Danh sách raw, searchTerm do Backend giới hạn theo bốn số cuối. */
  async list(vaultId: string, params?: PaginationParams, signal?: AbortSignal) {
    return page.parse(
      await apiClient.get<unknown, unknown>(collection(vaultId), {
        params: paginationRequestSchema.parse(params ?? {}),
        signal,
      }),
    );
  },
  /** Đọc hồ sơ đúng scope kho. */
  async get(vaultId: string, beneficiaryId: string, signal?: AbortSignal) {
    return beneficiaryResponseSchema.parse(
      await apiClient.get<unknown, unknown>(detail(vaultId, beneficiaryId), { signal }),
    );
  },
  /** POST chỉ các trường DTO được duyệt; server kiểm danh tính/tuổi. */
  async create(vaultId: string, request: z.infer<typeof createBeneficiarySchema>) {
    return beneficiaryResponseSchema.parse(
      await apiClient.post<unknown, unknown>(
        collection(vaultId),
        createBeneficiarySchema.parse(request),
      ),
    );
  },
  /** PUT với etag; không gửi CCCD qua schema này. */
  async update(
    vaultId: string,
    beneficiaryId: string,
    request: z.infer<typeof updateBeneficiarySchema>,
  ) {
    return beneficiaryResponseSchema.parse(
      await apiClient.put<unknown, unknown>(
        detail(vaultId, beneficiaryId),
        updateBeneficiarySchema.parse(request),
      ),
    );
  },
  /** DELETE 204 không có DTO; lỗi vẫn trả cho caller. */
  async remove(vaultId: string, beneficiaryId: string): Promise<void> {
    await apiClient.delete<unknown, unknown>(detail(vaultId, beneficiaryId));
  },
};
