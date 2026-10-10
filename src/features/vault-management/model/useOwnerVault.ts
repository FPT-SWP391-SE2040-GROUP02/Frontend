import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BackendPageRequest } from "@/shared/types/backend";
import type { CreatePackageRequest, UpdatePackageRequest } from "@/entities/package/model/package.types";
import { ownerVaultService } from "../api/ownerVaultService";
import { isAxiosError } from "axios";
import { z } from "zod";
import { HTTP_STATUS } from "@/shared/constants";

/** Lỗi chưa có kho theo snapshot BE; khác lỗi route 404 hoặc tài nguyên khác. */
const vaultMissingProblemSchema = z.object({ code: z.literal("VAULT_NOT_FOUND") });

/**
 * @description Nhận diện phản hồi chưa tạo kho mà không coi mọi lỗi 404 là trạng thái rỗng.
 * @param error Lỗi transport chưa xác định.
 * @returns True chỉ khi HTTP 404 đi cùng code VAULT_NOT_FOUND của BE.
 */
export function isOwnerVaultMissing(error: unknown): boolean {
  return isAxiosError<unknown>(error) &&
    error.response?.status === HTTP_STATUS.NOT_FOUND &&
    vaultMissingProblemSchema.safeParse(error.response.data).success;
}

/** Cache keys riêng cho dữ liệu Owner; cần xóa cache riêng tư khi đổi account/logout. */
export const ownerVaultKeys = {
  /** Prefix dùng invalidate cả kho và gói sau mutation thành công. */
  all: ["owner-vault"] as const,
  /** Kho của user đang đăng nhập. */
  mine: ["owner-vault", "mine"] as const,
  /** Danh sách gói, phân biệt theo query wire. */
  packages: (params?: BackendPageRequest) => ["owner-vault", "packages", params ?? {}] as const,
  /** Chi tiết gói. */
  package: (id: string) => ["owner-vault", "package", id] as const,
};

/** Đọc kho sau khi session sẵn sàng; caller phải truyền cờ xác thực. */
export function useOwnerVault(enabled: boolean) {
  return useQuery({
    queryKey: ownerVaultKeys.mine,
    queryFn: ({ signal }) => ownerVaultService.getMine(signal),
    enabled,
    retry: false,
  });
}

/** Đọc gói và meta; không tự suy luận pageIndex hoặc unwrap thêm một cấp data. */
export function useOwnerPackages(enabled: boolean, params?: BackendPageRequest) {
  return useQuery({
    queryKey: ownerVaultKeys.packages(params),
    queryFn: ({ signal }) => ownerVaultService.listPackages(params, signal),
    enabled,
  });
}

/** Đọc gói khi caller đã có session và GUID; ownership vẫn do BE kiểm tra. */
export function useOwnerPackage(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ownerVaultKeys.package(id),
    queryFn: () => ownerVaultService.getPackage(id),
    enabled: enabled && Boolean(id),
  });
}

/** Tạo kho và làm mới cache Owner sau response thành công. */
export function useCreateOwnerVault() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ownerVaultService.createMine,
    onSuccess: () => client.invalidateQueries({ queryKey: ownerVaultKeys.all }),
  });
}

/** Tạo gói; chưa triển khai form submit/optimistic business logic. */
export function useCreateOwnerPackage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePackageRequest) => ownerVaultService.createPackage(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ownerVaultKeys.all }),
  });
}

/** Input mutation sửa gói; request giữ đủ name và description muốn lưu. */
export interface UpdateOwnerPackageInput {
  /** GUID gói cần sửa. */
  id: string;
  /** Payload PATCH theo DTO BE. */
  request: UpdatePackageRequest;
}

/** Sửa gói và làm mới list/detail/kho sau thành công. */
export function useUpdateOwnerPackage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: UpdateOwnerPackageInput) => ownerVaultService.updatePackage(id, request),
    onSuccess: () => client.invalidateQueries({ queryKey: ownerVaultKeys.all }),
  });
}

/** Xóa gói; dọn detail đã xóa trước khi invalidate danh sách/kho. */
export function useDeleteOwnerPackage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerVaultService.deletePackage(id),
    onSuccess: (_result, id) => {
      client.removeQueries({ queryKey: ownerVaultKeys.package(id), exact: true });
      return client.invalidateQueries({ queryKey: ownerVaultKeys.all });
    },
  });
}

// TODO: [P1][VAULT-01] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
// 1. [MỤC TIÊU]: Nối form kho/gói vào hooks đã có và chốt điều kiện kích hoạt.
// 2. [INPUT & OUTPUT]: Form + phiên -> DTO kho/gói hoặc field/toast error thật.
// 3. [CÁC BƯỚC]: Sau AUTH-02 hoàn thiện UI RHF/Zod; gọi hooks CRUD; disable pending; invalidate query theo kho; nối activate chỉ khi BE hoàn thiện blockedReasons/guards.
// 4. [HÀM / THƯ VIỆN]: useOwnerVault hooks, React Hook Form, zodResolver, shared/ui, package schema.
// 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: 401/403/404/409/422, description null, stale version; đổi account/logout xóa cache Owner; UI role không cấp quyền; không auto-activate sau payment.
