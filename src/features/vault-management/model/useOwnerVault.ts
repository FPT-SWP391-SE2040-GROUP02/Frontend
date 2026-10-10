import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BackendPageRequest } from "@/shared/types/backend";
import type { CreatePackageRequest, UpdatePackageRequest } from "@/entities/package/model/package.types";
import { ownerVaultService } from "../api/ownerVaultService";

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

// TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
// 1. [MỤC TIÊU]: Developer nối form kho/gói, xử lý quyền và thông báo theo response BE.
// 2. [INPUT & OUTPUT]: Form + session + mutation result → UI bốn trạng thái và field/toast errors.
// 3. [CÁC BƯỚC]: Validate → kiểm session → disable pending → mutate → hiển thị kết quả server.
// 4. [HÀM / THƯ VIỆN]: React Hook Form, zodResolver, các hooks trên và shared/ui.
// 5. [ĐIỀU KIỆN BIÊN]: 401/404/409/422, description null, đổi account/logout phải xóa cache Owner;
//    không nối activate trước khi BE hoàn thiện guard, không tự kết luận quyền từ vai trò UI.
