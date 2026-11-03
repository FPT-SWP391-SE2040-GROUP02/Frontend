import { Clock, LogIn, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Thuộc tính cấu hình cho component Phiên hết hạn.
 */
export interface SessionExpiredCardProps {
  /** Thời gian bất hoạt dẫn đến hết hạn phiên (phút) */
  idleMinutes?: number;
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Giao diện Thông báo phiên hết hạn sau 30 phút không hoạt động (Mockup 10 - PhienHetHan.dc.html).
 * Hiển thị khi Axios Interceptor bắt được 401 do session timeout, giúp người dùng
 * nhanh chóng đăng nhập lại để tiếp tục công việc còn dở dang.
 *
 * @param {SessionExpiredCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Card phiên hết hạn
 */
export function SessionExpiredCard({ idleMinutes = 30, className = "" }: SessionExpiredCardProps) {
  return (
    <div className={`w-full space-y-6 text-left ${className}`}>
      {/* Icon đồng hồ hết hạn */}
      <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center">
        <Clock className="w-6 h-6 text-[#D97706]" />
      </div>

      {/* Tiêu đề & Diễn giải */}
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-heritage-text">
          Phiên đã hết hạn.
        </h1>
        <p className="text-xs sm:text-sm text-heritage-muted leading-relaxed">
          Bạn đã không hoạt động trong{" "}
          <span className="font-semibold text-heritage-text">{idleMinutes} phút</span> nên chúng tôi
          đăng xuất bạn để bảo vệ kho di sản.
        </p>
      </div>

      {/* Cảnh báo về dữ liệu dở dang */}
      <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FCD34D] flex items-start gap-2.5 text-xs text-[#92400E]">
        <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
        <span>
          <span className="font-semibold">Thao tác đang dở có thể chưa được lưu.</span> Vui lòng
          đăng nhập lại và kiểm tra lại tiến trình thao tác của bạn.
        </span>
      </div>

      {/* Thông tin bảo mật */}
      <div className="text-[11px] text-heritage-muted leading-relaxed p-3 rounded-xl bg-heritage-surface border border-heritage-border">
        Vì an toàn, chúng tôi tự động đóng phiên sau{" "}
        <span className="font-medium text-[#4A4A40]">{idleMinutes} phút không hoạt động</span>.
        Phiên người dùng tự kết thúc để bảo vệ tài khoản kể cả khi trình duyệt mở.
      </div>

      {/* Nút đăng nhập lại */}
      <Link
        to={ROUTES.AUTH.LOGIN}
        className="w-full h-11 rounded-xl bg-heritage-sidebar hover:bg-heritage-sidebar/90 text-heritage-surface text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-heritage-primary"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Đăng nhập lại</span>
      </Link>
    </div>
  );
}
