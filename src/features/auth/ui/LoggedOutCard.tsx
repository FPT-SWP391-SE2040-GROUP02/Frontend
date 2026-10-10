import { CheckCircle2, Home, LogIn, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Thuộc tính cấu hình cho component Đã đăng xuất.
 */
export interface LoggedOutCardProps {
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Giao diện Xác nhận phiên đã kết thúc (Mockup 9 - DaDangXuat.dc.html).
 * Thông báo người dùng đã đăng xuất an toàn, khuyến nghị đóng cửa sổ nếu dùng máy chung.
 *
 * @param {LoggedOutCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Card đã đăng xuất
 */
export function LoggedOutCard({ className = "" }: LoggedOutCardProps) {
  return (
    <div className={`w-full space-y-6 text-left ${className}`}>
      {/* Icon xác nhận thành công */}
      <div className="w-12 h-12 rounded-2xl bg-[#EAF2ED] flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-[#0A281E]" />
      </div>

      {/* Tiêu đề & Diễn giải */}
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#0F1A16]">
          Bạn đã đăng xuất.
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66] leading-relaxed">
          Phiên trên thiết bị này đã kết thúc. Kho di sản của bạn vẫn được bảo vệ an toàn.
        </p>
      </div>

      {/* Cảnh báo bảo mật máy dùng chung */}
      <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E5DF] flex items-start gap-2.5 text-xs text-[#6B6B66]">
        <AlertTriangle className="w-4 h-4 text-[#B88E4C] flex-shrink-0 mt-0.5" />
        <span>
          Nếu đây là <span className="font-semibold text-[#0F1A16]">máy dùng chung</span>, hãy đóng toàn bộ cửa sổ trình duyệt để đảm bảo không ai xem được lịch sử duyệt web.
        </span>
      </div>

      {/* Điều hướng hành động */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="flex-1 h-11 rounded-xl bg-[#0A281E] hover:bg-[#133E2F] text-[#FAFAF6] text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A281E]"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Đăng nhập lại</span>
        </Link>
        <Link
          to={ROUTES.HOME}
          className="flex-1 h-11 rounded-xl border border-[#D5D0C3] hover:bg-white bg-transparent text-[#0F1A16] text-xs font-medium flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A281E]"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    </div>
  );
}
