import { LogOut, User, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { type Role, ROLES } from "@/shared/constants/roles";
import { storage } from "@/shared/utils";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Thuộc tính cấu hình cho UserAvatarMenu component.
 */
export interface UserAvatarMenuProps {
  /** Họ và tên hiển thị */
  fullName?: string;
  /** Địa chỉ email */
  email?: string;
  /** Đường dẫn ảnh đại diện */
  avatarUrl?: string;
  /** Vai trò của người dùng */
  role?: Role;
  /** Callback khi người dùng bấm đăng xuất */
  onLogout?: () => void;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Menu Avatar người dùng đặt ở góc trên Header.
 * Hiển thị huy hiệu Role hiện tại và nút Đăng xuất an toàn.
 *
 * @param {UserAvatarMenuProps} props Thuộc tính component
 * @returns {React.JSX.Element} Menu Avatar người dùng
 *
 * @example
 * ```tsx
 * <UserAvatarMenu
 *   fullName="Alexander Hayes"
 *   email="owner@legacyvault.io"
 *   role="OWNER"
 * />
 * ```
 */
export function UserAvatarMenu({
  fullName = "Alexander Hayes",
  email = "alexander.h@legacyvault.io",
  avatarUrl,
  role = ROLES.OWNER,
  onLogout,
  className = "",
}: UserAvatarMenuProps) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    // TODO: 1. Xóa sạch JWT token khỏi storage
    // TODO: 2. Kích hoạt callback onLogout
    // TODO: 3. Điều hướng về /login
    storage.clearToken();
    onLogout?.();
    navigate(ROUTES.AUTH.LOGIN);
  };

  const getRoleBadgeLabel = (r: Role) => {
    switch (r) {
      case ROLES.OWNER:
        return "Chủ Di Sản";
      case ROLES.EXECUTOR:
        return "Người Giám Hộ";
      case ROLES.BENEFICIARY:
        return "Người Thừa Kế";
      case ROLES.NOTARY:
        return "Công Chứng Viên";
      case ROLES.ADMIN:
        return "Quản Trị Viên";
      default:
        return "Thành Viên";
    }
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`relative rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--heritage-gold,#b88e4c)] focus:ring-offset-2 ${className}`}
          aria-label="Menu tài khoản"
        >
          <Avatar className="h-9 w-9 border-2 border-[#d2decb] dark:border-[#1e4631] bg-gradient-to-br from-[#d8bf7d] to-[#af8946] text-[#103329] font-bold text-xs shadow-xs">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
            <AvatarFallback className="bg-transparent text-[#103329] font-bold">
              {initials || "LV"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 bg-white dark:bg-[#0c2217] border border-[#dce5d6] dark:border-[#1d402f] shadow-lg rounded-2xl p-1.5" align="end">
        <DropdownMenuLabel className="p-2 space-y-1">
          <p className="text-xs font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4] truncate">
            {fullName}
          </p>
          <p className="text-[10px] text-[#637666] dark:text-[#9bb39f] truncate">{email}</p>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{getRoleBadgeLabel(role)}</span>
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[#edf3ea] dark:bg-[#183626]" />

        <DropdownMenuItem
          onClick={handleLogoutClick}
          className="p-2 text-xs font-semibold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất an toàn</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
