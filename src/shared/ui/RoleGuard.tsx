import { type ReactNode } from "react";
import { type Role } from "@/shared/constants/roles";

/**
 * @description Thuộc tính cho component RoleGuard.
 */
export interface RoleGuardProps {
  /** Vai trò được tầng gọi truyền xuống; UI guard không truy cập app store. */
  currentUserRole?: Role;
  /** Danh sách vai trò được phép hiển thị nội dung bên trong */
  allowedRoles: Role[];
  /** Nội dung component con hiển thị khi thỏa mãn quyền */
  children: ReactNode;
  /** Nội dung thay thế (fallback) khi người dùng không đủ quyền */
  fallback?: ReactNode;
}

/**
 * @description Component bảo vệ giao diện theo phân quyền chi tiết (Fine-grained RBAC).
 * Ẩn hoặc hiển thị các nút bấm, tab, hành động nhạy cảm dựa trên vai trò người dùng hiện tại.
 *
 * @param {RoleGuardProps} props Thuộc tính truyền vào cho component
 * @returns {ReactNode} Render children nếu đủ quyền, ngược lại render fallback
 *
 * @example
 * ```tsx
 * <RoleGuard allowedRoles={["NOTARY", "ADMIN"]}>
 *   <Button onClick={handleSignSeal}>Ký số Niêm phong</Button>
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  currentUserRole,
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps): ReactNode {
  // Lấy vai trò người dùng hiện tại từ Redux store hoặc Auth state

  // TODO: [P0][ACCESS-01] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Thay cơ chế ADMIN bypass legacy bằng quyền UI đúng scope tài nguyên.
  // 2. [INPUT & OUTPUT]: System roles + resource contexts/allowedActions từ BE -> children hoặc fallback.
  // 3. [CÁC BƯỚC]: Sau AUTH-01 chốt DTO /me; caller tầng trên truyền quyền đã ánh xạ; bỏ bypass ADMIN mặc định; API vẫn kiểm quyền độc lập.
  // 4. [HÀM / THƯ VIỆN]: Props, shared constants, adapter ở entities; không import app store vào shared.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Admin không tự nhận quyền xem nội dung/grant hoặc duyệt danh tính; role/URL/demo không cấp quyền; thiếu dữ liệu phải đóng quyền.

  const hasPermission = currentUserRole ? allowedRoles.includes(currentUserRole) : false;

  if (!hasPermission) {
    return fallback;
  }

  return children;
}
