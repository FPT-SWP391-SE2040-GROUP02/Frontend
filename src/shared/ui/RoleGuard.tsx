import { ReactNode } from "react";
import { useAppSelector } from "@/app/store";
import { type Role } from "@/shared/constants/roles";

/**
 * @description Thuộc tính cho component RoleGuard.
 */
export interface RoleGuardProps {
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
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps): ReactNode {
  // Lấy vai trò người dùng hiện tại từ Redux store hoặc Auth state
  const currentUserRole = useAppSelector((state) => state.auth?.user?.role);

  // TODO: 1. Kiểm tra nếu currentUserRole nằm trong danh sách allowedRoles -> return children
  // TODO: 2. Nếu người dùng là ADMIN tối cao -> luôn luôn có quyền xem mọi hành động
  // TODO: 3. Nếu không khớp bất kỳ quyền nào -> return fallback

  const hasPermission = currentUserRole ? allowedRoles.includes(currentUserRole as Role) || currentUserRole === "ADMIN" : false;

  if (!hasPermission) {
    return fallback;
  }

  return children;
}
