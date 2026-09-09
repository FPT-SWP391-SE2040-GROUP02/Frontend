import { type Role } from "@/shared/constants/roles";
import { ROLE_STYLES } from "@/shared/constants/styles";
import { Badge } from "@/shared/ui/badge";

/**
 * @description Thuộc tính cấu hình cho component UserBadge.
 */
export interface UserBadgeProps {
  /** Vai trò của người dùng trong hệ thống (ADMIN, STAFF, CUSTOMER, GUEST) */
  role: Role;
}

/**
 * @description Component hiển thị huy hiệu (Badge) vai trò người dùng với màu sắc tương ứng.
 *
 * @example
 * ```tsx
 * <UserBadge role="ADMIN" />
 * ```
 */
export function UserBadge({ role }: UserBadgeProps) {
  const config = ROLE_STYLES[role] ?? ROLE_STYLES.GUEST;

  return (
    <Badge variant="outline" className={config.badge}>
      {config.label}
    </Badge>
  );
}
