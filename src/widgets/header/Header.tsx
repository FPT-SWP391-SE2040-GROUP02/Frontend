import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes.config";
import { Moon, Sun, Menu } from "lucide-react";

/**
 * @description Thuộc tính cấu hình cho Header component.
 */
export interface HeaderProps {
  /** Có hiển thị nút mở sidebar mobile hay không */
  showSidebarToggle?: boolean;
  /** Callback mở sidebar */
  onToggleSidebar?: () => void;
}

/**
 * @description Header / Navbar dùng chung toàn ứng dụng.
 * Tuân thủ Quy tắc 7: Chỉ dựng khung giao diện, các handler tương tác để developer tự viết theo // TODO.
 */
export function Header({ showSidebarToggle = false, onToggleSidebar }: HeaderProps) {
  /**
   * @description Xử lý chuyển đổi Theme sáng/tối
   */
  const handleToggleTheme = () => {
    // TODO: 1. Lấy trạng thái theme hiện tại từ Redux store hoặc ThemeContext
    // TODO: 2. Dispatch action setTheme chuyển đổi giữa "light" và "dark"
    // TODO: 3. Cập nhật class 'dark' lên documentElement
  };

  /**
   * @description Xử lý đăng xuất tài khoản
   */
  const _handleLogout = () => {
    // TODO: 1. Xóa token khỏi storage (storage.clearToken())
    // TODO: 2. Dispatch action logout của authSlice để reset trạng thái
    // TODO: 3. Điều hướng người dùng về trang đăng nhập: navigate(ROUTES.AUTH.LOGIN)
  };
  void _handleLogout;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Khu vực Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onToggleSidebar}
              aria-label="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm">
              S
            </span>
            <span>SWP391</span>
          </Link>
        </div>

        {/* Khu vực Action Buttons: Theme Toggle & User Info / Login Link */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleTheme}
            aria-label="Chuyển chế độ sáng/tối"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Khung Auth buttons: Khi chưa login hiện Đăng nhập, khi đã login hiện Avatar */}
          <div className="flex items-center gap-2">
            {/* TODO: Thay thế điều kiện hiển thị bằng biến isAuthenticated từ Redux Store */}
            <Link to={ROUTES.AUTH.LOGIN}>
              <Button variant="outline" size="sm">
                Đăng nhập
              </Button>
            </Link>
            <Link to={ROUTES.AUTH.REGISTER}>
              <Button size="sm">
                Đăng ký
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
