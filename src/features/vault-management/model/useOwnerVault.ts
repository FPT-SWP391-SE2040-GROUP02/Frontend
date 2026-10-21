import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginationParams } from "@/shared/types";
import type {
  CreatePackageRequest,
  UpdatePackageRequest,
} from "@/entities/package/model/package.types";
import { ownerVaultService } from "../api/ownerVaultService";
import { isAxiosError } from "axios";
import { z } from "zod";
import { HTTP_STATUS } from "@/shared/constants";

const vaultMissingProblemSchema = z.object({ code: z.literal("VAULT_NOT_FOUND") });
/** Nhận diện chưa có kho; 404 route sai không được coi là empty. */
export function isOwnerVaultMissing(error: unknown): boolean {
  return (
    isAxiosError<unknown>(error) &&
    error.response?.status === HTTP_STATUS.NOT_FOUND &&
    vaultMissingProblemSchema.safeParse(error.response.data).success
  );
}

/** Cache riêng theo kho; auth transitions hủy và xóa dữ liệu khi đổi identity. */
export const ownerVaultKeys = {
  all: ["owner-vault"] as const,
  mine: ["owner-vault", "mine"] as const,
  packages: (vaultId: string, params?: PaginationParams, includeArchived = false) => {
    if (includeArchived) {
      return ["owner-vault", vaultId, "containers", params ?? {}, "with-archived"] as const;
    }
    return ["owner-vault", vaultId, "containers", params ?? {}] as const;
  },
  package: (vaultId: string, id: string) => ["owner-vault", vaultId, "container", id] as const,
};
/** Chỉ đọc khi caller xác nhận session sẵn sàng. */
export function useOwnerVault(enabled: boolean) {
  return useQuery({
    queryKey: ownerVaultKeys.mine,
    queryFn: ({ signal }) => ownerVaultService.getMine(signal),
    enabled,
    retry: false,
  });
}
/** Không gửi request container khi chưa biết vaultId. */
export function useOwnerPackages(
  vaultId: string,
  enabled: boolean,
  params?: PaginationParams,
  includeArchived = false,
) {
  return useQuery({
    queryKey: ownerVaultKeys.packages(vaultId, params, includeArchived),
    queryFn: ({ signal }) => {
      if (includeArchived) {
        return ownerVaultService.listPackages(vaultId, params, signal, true);
      }
      return ownerVaultService.listPackages(vaultId, params, signal);
    },
    enabled: enabled && Boolean(vaultId),
    retry: false,
  });
}
/** Đọc gói trong scope kho; ownership vẫn do Backend kiểm tra. */
export function useOwnerPackage(vaultId: string, id: string, enabled: boolean) {
  return useQuery({
    queryKey: ownerVaultKeys.package(vaultId, id),
    queryFn: ({ signal }) => ownerVaultService.getPackage(vaultId, id, signal),
    enabled: enabled && Boolean(vaultId) && Boolean(id),
    retry: false,
  });
}
/** Tạo kho; không retry mutation. */
export function useCreateOwnerVault() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => ownerVaultService.createMine(),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ownerVaultKeys.all }),
  });
}
/** Transport tạo gói; UI submit nghiệp vụ vẫn scaffold. */
export function useCreateOwnerPackage(vaultId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePackageRequest) =>
      ownerVaultService.createPackage(vaultId, payload),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ownerVaultKeys.all }),
  });
}
/** PUT giữ etag từ lần đọc; 409 cần tải lại và người dùng quyết định. */
export function useUpdateOwnerPackage(vaultId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdatePackageRequest }) =>
      ownerVaultService.updatePackage(vaultId, id, request),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ownerVaultKeys.all }),
  });
}
/** Lưu trữ gói; confirmation không được tự bật khi server trả 409. */
export function useArchiveOwnerPackage(vaultId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      confirmPlanDeactivation = false,
    }: {
      id: string;
      confirmPlanDeactivation?: boolean;
    }) => ownerVaultService.archivePackage(vaultId, id, confirmPlanDeactivation),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ownerVaultKeys.all }),
  });
}

// TODO: [P1][VAULT-01] DEVELOPER BLUEPRINT
// 1. Mục tiêu: nối submit kho/container khi được phép implementation nghiệp vụ.
// 2. Input/output: vaultId + form/schema + etag -> DTO raw hoặc lỗi giữ nguyên.
// 3. Bước: RHF/Zod -> hook -> disable pending -> success thật -> invalidate; 409 tải lại,
//    confirmation tác động kế hoạch chỉ gửi khi người dùng đồng ý.
// 4. API/thư viện: /vaults, /vaults/{vaultId}/containers, Query, RHF, Zod.
// 5. Biên/lỗi: 401/403/404/409; không auto-activate; không optimistic; đổi identity clear cache.
