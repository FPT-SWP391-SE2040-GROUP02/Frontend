import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Màn hình Lỗi 403 - Quyền Truy Cập Bị Từ Chối (Forbidden Access Page).
 * Kích hoạt khi người dùng (ví dụ: Beneficiary) cố tình truy cập vào URL dành riêng cho vai trò khác (ví dụ: Notary).
 *
 * @returns {React.JSX.Element} Màn hình 403
 */
export function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] dark:bg-[#07160f] flex flex-col justify-center items-center px-4 py-12 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-red-600 dark:text-red-400 tracking-wider">
            Lỗi Phân Quyền · HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            Quyền Truy Cập Bị Từ Chối
          </h1>
          <p className="text-xs sm:text-sm text-[#5a6f5e] dark:text-[#9bb39f] leading-relaxed">
            Tài khoản hiện tại của bạn không có quyền hạn pháp lý hoặc vai trò phù hợp để truy cập
            khu vực làm việc này.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-1.5 text-xs h-10 px-4 rounded-xl font-semibold border-[#cedbc8]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang trước</span>
          </Button>

          <Link to={ROUTES.HOME}>
            <Button className="gap-1.5 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white text-xs h-10 px-4 rounded-xl font-bold">
              <Home className="w-3.5 h-3.5 text-[var(--heritage-gold,#f5d482)]" />
              <span>Về trang chủ</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
