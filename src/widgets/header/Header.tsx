import { setTheme, useAppDispatch, useAppSelector } from "@/app/store";
import { UserAvatar } from "@/entities/user";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { storage } from "@/shared/utils";
import { Menu, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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
 * Tích hợp logo thương hiệu, nút chuyển Theme sáng/tối và hiển thị trạng thái đăng nhập.
 */
export function Header({ showSidebarToggle = false, onToggleSidebar }: HeaderProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // 1. Lấy theme hiện tại từ Redux store
  const theme = useAppSelector((state) => state.ui.theme);

  // 2. Kiểm tra xem người dùng đã đăng nhập hay chưa dựa vào token
  const isAuthenticated = Boolean(storage.getToken());

  /**
   * @description Xử lý chuyển đổi qua lại giữa Light mode và Dark mode
   */
  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    dispatch(setTheme(nextTheme));
  };

  /**
   * @description Xử lý đăng xuất tài khoản và điều hướng về trang Login
   */
  const handleLogout = () => {
    storage.clearToken();
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Khu vực Logo & Mobile Sidebar Toggle */}
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

          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm">
              S
            </span>
            <span>SWP391</span>
          </Link>
        </div>

        {/* Khu vực Action Buttons: Theme Toggle & User Info / Login Link */}
        <div className="flex items-center gap-3">
          {/* Nút chuyển đổi giao diện Sáng / Tối */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleTheme}
            aria-label="Chuyển chế độ sáng/tối"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-amber-400 rotate-0 scale-100 transition-all" />
            ) : (
              <Moon className="h-5 w-5 rotate-0 scale-100 transition-all text-slate-700" />
            )}
          </Button>

          {/* Khung Auth buttons: Tự động đổi giao diện theo trạng thái đăng nhập */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to={ROUTES.DASHBOARD.ROOT} title="Vào Dashboard">
                  <UserAvatar fullName="Admin User" />
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <>
                <Link to={ROUTES.AUTH.LOGIN}>
                  <Button variant="outline" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to={ROUTES.AUTH.REGISTER}>
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
