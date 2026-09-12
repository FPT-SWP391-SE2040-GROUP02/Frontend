// ==============================================================================
// SWP391 - LegacyVault: Digital Asset React Query Custom Hooks
// Quản lý Server State, Caching và Cache Invalidation chuẩn Feature-Sliced Design
// ==============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedList } from "@/shared/types";
import type {
  AssetDto,
  CreateAssetRequest,
  UpdateAssetRequest,
} from "@/entities/asset";
import { assetService, type AssetFilterParams } from "../api/assetService";

/**
 * @description Query Keys Factory quản lý khóa Cache React Query cho thực thể Asset.
 */
export const assetKeys = {
  all: ["digital-assets"] as const,
  lists: () => [...assetKeys.all, "list"] as const,
  list: (params?: AssetFilterParams) => [...assetKeys.lists(), params] as const,
  details: () => [...assetKeys.all, "detail"] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

/**
 * @description Custom Hook lấy danh sách tài sản số có phân trang và bộ lọc.
 * @param {AssetFilterParams} params Tham số lọc, tìm kiếm và phân trang
 * @returns React Query result chứa PaginatedList<AssetDto>
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useAssets({ vaultId: "123", pageIndex: 1, pageSize: 10 });
 * ```
 */
export function useAssets(params?: AssetFilterParams) {
  return useQuery<PaginatedList<AssetDto>, Error>({
    queryKey: assetKeys.list(params),
    queryFn: () => assetService.getAll(params),
  });
}

/**
 * @description Custom Hook lấy thông tin chi tiết một tài sản số theo ID.
 * @param {string} id ID định danh của tài sản
 * @returns React Query result chứa AssetDto
 * @example
 * ```tsx
 * const { data: asset, isLoading } = useAssetDetail(assetId);
 * ```
 */
export function useAssetDetail(id: string) {
  return useQuery<AssetDto, Error>({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetService.getById(id),
    enabled: Boolean(id),
  });
}

/**
 * @description Custom Hook thực hiện tạo mới tài sản số kèm tự động làm mới Cache (Invalidation).
 * @returns React Query mutation object
 * @example
 * ```tsx
 * const createMutation = useCreateAsset();
 * createMutation.mutate(createPayload, {
 *   onSuccess: () => toast.success("Thêm tài sản thành công!"),
 * });
 * ```
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation<AssetDto, Error, CreateAssetRequest>({
    mutationFn: (data: CreateAssetRequest) => assetService.create(data),
    onSuccess: () => {
      // Làm mới danh sách tài sản trong cache
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

/**
 * @description Custom Hook cập nhật thông tin tài sản số.
 * @returns React Query mutation object
 * @example
 * ```tsx
 * const updateMutation = useUpdateAsset();
 * updateMutation.mutate({ id: assetId, data: updateData });
 * ```
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation<AssetDto, Error, { id: string; data: UpdateAssetRequest }>({
    mutationFn: ({ id, data }) => assetService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
    },
  });
}

/**
 * @description Custom Hook xóa một tài sản số theo ID.
 * @returns React Query mutation object
 * @example
 * ```tsx
 * const deleteMutation = useDeleteAsset();
 * deleteMutation.mutate(assetId);
 * ```
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => assetService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}
