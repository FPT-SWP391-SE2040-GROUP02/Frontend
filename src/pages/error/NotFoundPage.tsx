import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Màn hình Lỗi 404 - Không Tìm Thấy Trang (Not Found Page).
 *
 * @returns {React.JSX.Element} Màn hình 404
 */
export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] dark:bg-[#07160f] flex flex-col justify-center items-center px-4 py-12 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
            HTTP 404 · Trang Không Tồn Tại
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            Không Tìm Thấy Trang
          </h1>
          <p className="text-xs sm:text-sm text-[#5a6f5e] dark:text-[#9bb39f] leading-relaxed">
            Đường dẫn bạn vừa yêu cầu có thể đã bị thay đổi hoặc không tồn tại trong hệ thống.
          </p>
        </div>

        <Link to={ROUTES.HOME}>
          <Button className="gap-1.5 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white text-xs h-10 px-5 rounded-xl font-bold mt-2">
            <Home className="w-3.5 h-3.5 text-[var(--heritage-gold,#f5d482)]" />
            <span>Về trang chủ</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
