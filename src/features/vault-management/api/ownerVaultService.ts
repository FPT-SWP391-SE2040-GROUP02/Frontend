import { createBaseService, apiClient } from "@/shared/api";
import type {
  BackendPageRequest,
  BackendPageResponse,
  BackendResponse,
} from "@/shared/types/backend";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import type {
  CreatePackageRequest,
  PackageResponse,
  UpdatePackageRequest,
} from "@/entities/package/model/package.types";

/** Route tương đối với ENV.API_BASE_URL theo controller BE đã khảo sát. */
const OWNER_VAULT_ENDPOINTS = {
  VAULTS: "/vaults",
  MINE: "/vaults/me",
  PACKAGES: "/packages",
  MY_PACKAGES: "/vaults/me/packages",
} as const;

/**
 * CRUD được tái sử dụng; override các response có envelope và update dùng PATCH.
 * Không xuất getAll/getSelectOptions vì route/shape mặc định không khớp BE.
 */
const packageCrud = createBaseService<PackageResponse, CreatePackageRequest, UpdatePackageRequest>({
  endpoint: OWNER_VAULT_ENDPOINTS.PACKAGES,
  /** Đọc gói thuộc quyền Owner; interceptor hiện trả response body. */
  getById: async (id) => {
    const body = await apiClient.get<
      BackendResponse<PackageResponse>,
      BackendResponse<PackageResponse>
    >(`${OWNER_VAULT_ENDPOINTS.PACKAGES}/${id}`);
    return body.data;
  },
  /** Tạo gói tại route lồng trong kho hiện tại. */
  create: async (payload) => {
    const body = await apiClient.post<
      BackendResponse<PackageResponse>,
      BackendResponse<PackageResponse>
    >(OWNER_VAULT_ENDPOINTS.MY_PACKAGES, payload);
    return body.data;
  },
  /** PATCH hiện yêu cầu name; caller gửi description muốn giữ theo DTO BE. */
  update: async (id, payload) => {
    const body = await apiClient.patch<
      BackendResponse<PackageResponse>,
      BackendResponse<PackageResponse>
    >(`${OWNER_VAULT_ENDPOINTS.PACKAGES}/${id}`, payload);
    return body.data;
  },
});

/**
 * Transport kho/gói theo snapshot BE; chưa nối UI hoặc triển khai quyền nghiệp vụ.
 * Cần hoàn thiện Bearer RAM trong shared transport trước khi tích hợp server thật.
 */
export const ownerVaultService = {
  /** Đọc kho; VAULT_NOT_FOUND được giữ nguyên để UI xử lý trạng thái chưa có kho. */
  async getMine(signal?: AbortSignal): Promise<VaultResponse> {
    const body = await apiClient.get<
      BackendResponse<VaultResponse>,
      BackendResponse<VaultResponse>
    >(OWNER_VAULT_ENDPOINTS.MINE, { signal });
    return body.data;
  },
  /** Tạo một kho cho user hiện tại; không gửi ownerId hoặc trạng thái. */
  async createMine(): Promise<VaultResponse> {
    const body = await apiClient.post<
      BackendResponse<VaultResponse>,
      BackendResponse<VaultResponse>
    >(OWNER_VAULT_ENDPOINTS.VAULTS);
    return body.data;
  },
  /** Đọc danh sách gói và giữ toàn bộ metadata; hỗ trợ hủy request truy vấn. */
  listPackages(
    params?: BackendPageRequest,
    signal?: AbortSignal,
  ): Promise<BackendPageResponse<PackageResponse>> {
    return apiClient.get<
      BackendPageResponse<PackageResponse>,
      BackendPageResponse<PackageResponse>
    >(OWNER_VAULT_ENDPOINTS.MY_PACKAGES, { params, signal });
  },
  /** Đọc chi tiết gói theo GUID. */
  getPackage: packageCrud.getById,
  /** Tạo gói theo request đã validate. */
  createPackage: packageCrud.create,
  /** Sửa gói theo semantics PATCH hiện tại của Backend. */
  updatePackage: packageCrud.update,
  /** Xóa gói; base service không đọc JSON từ response 204. */
  deletePackage: packageCrud.remove,
};
