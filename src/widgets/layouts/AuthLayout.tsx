import { Outlet, Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description AuthLayout thanh lịch dành riêng cho các trang Đăng nhập, Đăng ký, Quên mật khẩu.
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-muted/30 p-4 sm:p-6">
      <div className="mb-6 flex flex-col items-center gap-2">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-base shadow-sm">
            S
          </span>
          <span>SWP391</span>
        </Link>
        <p className="text-xs text-muted-foreground">Hệ thống quản trị & nền tảng học phần SWP391</p>
      </div>

      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
