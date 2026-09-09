import { Badge } from "@/shared/ui/badge";
import { type Role } from "@/shared/constants/roles";

/**
 * @description Thuộc tính cấu hình cho component UserBadge.
 */
export interface UserBadgeProps {
  /** Vai trò của người dùng trong hệ thống (ADMIN, STAFF, CUSTOMER, GUEST) */
  role: Role;
}

/**
 * @description Component hiển thị huy hiệu (Badge) vai trò người dùng với màu sắc tương ứng.
 * Tuân thủ Quy tắc 7: Để lại logic switch-case phân loại màu sắc cho developer tự hoàn thiện qua // TODO.
 *
 * @example
 * ```tsx
 * <UserBadge role="ADMIN" />
 * ```
 */
export function UserBadge({ role }: UserBadgeProps) {
  // TODO: 1. Sử dụng switch-case hoặc object map để phân loại màu sắc và nhãn hiển thị theo từng role:
  //   - ROLES.ADMIN: variant="default", màu đỏ/rose (bg-rose-500), nhãn "Quản trị viên"
  //   - ROLES.STAFF: variant="secondary", màu xanh dương (bg-blue-500/10), nhãn "Nhân viên"
  //   - ROLES.CUSTOMER: variant="outline", viền xanh lá (border-emerald-500/40), nhãn "Khách hàng"
  //   - Mặc định: variant="outline", nhãn "Khách"
  // TODO: 2. Trả về component Badge với style và text tương ứng

  return <Badge variant="outline">{role}</Badge>;
}
