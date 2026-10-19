import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetService } from "../api/assetService";
import { toViewModel, toCreatePayload } from "../lib/adapters";
import type { CreateAssetFormValues } from "./asset.types";
import type { PaginationParams } from "@/shared/types";

/**
 * @file useAssets.ts
 * @description React Query hooks cho việc quản lý server state của kho tài sản số.
 */

export const assetKeys = {
  all: ["assets"] as const,
  lists: () => [...assetKeys.all, "list"] as const,
  list: (params?: PaginationParams & { assetType?: string }) =>
    [...assetKeys.lists(), params] as const,
  details: () => [...assetKeys.all, "detail"] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  stats: () => [...assetKeys.all, "stats"] as const,
};

/**
 * Hook truy xuất danh sách tài sản số kèm phân trang và lọc
 */
export function useAssets(params?: PaginationParams & { assetType?: string }) {
  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: async () => {
      const res = await assetService.getAssets(params);
      return {
        ...res,
        items: res.items.map(toViewModel),
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook truy xuất chi tiết 1 tài sản số
 */
export function useAssetDetail(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: async () => {
      const dto = await assetService.getAssetDetail(id);
      return toViewModel(dto);
    },
    enabled: Boolean(id),
  });
}

/**
 * Hook tạo mới tài sản số
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formValues: CreateAssetFormValues) => {
      const payload = toCreatePayload(formValues);
      return assetService.createAsset(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
}

/**
 * Hook xóa tài sản số
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
}

/**
 * Hook lấy số liệu thống kê kho tài sản
 */
export function useVaultStats() {
  return useQuery({
    queryKey: assetKeys.stats(),
    queryFn: () => assetService.getVaultStats(),
    staleTime: 1000 * 60 * 5,
  });
}
