import { useState, useEffect } from "react";
import { useResendEmailVerification } from "../model/useAuth";
import { Button } from "@/shared/ui/button";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Thuộc tính cấu hình cho component Thông báo xác minh email.
 */
export interface VerifyEmailNoticeProps {
  /** Địa chỉ email nhận liên kết xác thực */
  email?: string;
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Giao diện Thông báo xác minh email (Mockup 6 - XacMinhEmail.dc.html).
 * Hướng dẫn người dùng kiểm tra hộp thư, bấm liên kết xác thực và hỗ trợ gửi lại mã sau thời gian chờ.
 *
 * @param {VerifyEmailNoticeProps} props Thuộc tính component
 * @returns {React.JSX.Element} Card thông báo xác minh email
 */
export function VerifyEmailNotice({
  email = "nam@example.com",
  className = "",
}: VerifyEmailNoticeProps) {
  const [cooldown, setCooldown] = useState<number>(0);
  const { mutate: resendEmail, isPending } = useResendEmailVerification();

  // Đếm ngược 60 giây sau khi bấm Gửi lại email
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  /**
   * @description Ẩn một phần email để bảo vệ quyền riêng tư (nam@example.com -> n***@example.com)
   */
  const maskEmail = (raw: string): string => {
    const parts = raw.split("@");
    if (parts.length !== 2) return raw;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name.charAt(0)}***@${domain}`;
    return `${name.charAt(0)}***${name.charAt(name.length - 1)}@${domain}`;
  };

  /**
   * @description Xử lý gửi lại email kích hoạt
   */
  const handleResend = (): void => {
    // TODO: [P0][AUTH-05] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Hoàn thiện xác minh/gửi lại email theo policy từ BE.
    // 2. [INPUT & OUTPUT]: Token/challenge/email hợp lệ -> trạng thái bước tiếp theo và retryAt.
    // 3. [CÁC BƯỚC]: Chốt /auth/verify-email và route resend với BE1; nối service/mutation; cooldown theo Retry-After/retryAt; chỉ báo gửi sau server xác nhận.
    // 4. [HÀM / THƯ VIỆN]: useResendEmailVerification, Zod, TanStack Query, ROUTES.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không hardcode cooldown thành chính sách; token một lần/hết hạn; lỗi chung không lộ account; không mất invitation sau xác minh.
    if (cooldown > 0) return;

    resendEmail(email, {
      onSuccess: () => {
        setCooldown(60);
      },
    });
  };

  return (
    <div className={`w-full space-y-6 text-left ${className}`}>
      {/* Icon đại diện thư gửi */}
      <div className="w-12 h-12 rounded-2xl bg-[#EAF2ED] text-[#0A281E] flex items-center justify-center">
        <Mail className="w-6 h-6 text-[#0A281E]" />
      </div>

      {/* Tiêu đề & Diễn giải */}
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#0F1A16]">
          Hãy xác minh email của bạn
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66] leading-relaxed">
          Chúng tôi đã gửi một liên kết đến{" "}
          <span className="font-semibold text-[#0F1A16]">{maskEmail(email)}</span>. Mở email và bấm liên kết để hoàn tất đăng nhập.
        </p>
      </div>

      {/* Nút gửi lại email kèm thời gian đếm ngược */}
      <div className="space-y-3 pt-2">
        <Button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isPending}
          className="w-full h-11 rounded-xl bg-[#0A281E] hover:bg-[#133E2F] text-[#FAFAF6] text-xs font-semibold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          {cooldown > 0 ? (
            <span>Gửi lại sau {cooldown}s</span>
          ) : isPending ? (
            <span>Đang gửi...</span>
          ) : (
            <span>Gửi lại email</span>
          )}
        </Button>

        <p className="text-[11px] text-[#8C8C85] text-center">
          Chưa thấy email? Hãy kiểm tra thư rác hoặc hộp thư quảng cáo.
        </p>
      </div>

      {/* Điều hướng thay đổi email hoặc chuyển tài khoản */}
      <div className="pt-6 border-t border-[#E5E5DF] flex items-center justify-between text-xs">
        <Link
          to={ROUTES.AUTH.REGISTER}
          className="text-[#6B6B66] hover:text-[#0A281E] font-medium"
        >
          Đổi email
        </Link>
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="inline-flex items-center gap-1.5 text-[#0A281E] font-bold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Đăng nhập tài khoản khác</span>
        </Link>
      </div>
    </div>
  );
}
