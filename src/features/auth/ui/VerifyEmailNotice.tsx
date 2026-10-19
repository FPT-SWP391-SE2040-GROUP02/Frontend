import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRegisterErrorMessage } from "../lib/registerFeedback";
import { useResendEmailVerification } from "../model/useAuth";
import { EmailVerificationCard } from "./EmailVerificationCard";
import { ResendVerificationForm } from "./ResendVerificationForm";
import { verificationEmailSchema, VERIFY_EMAIL_CONTENT } from "../model/verifyEmail.schema";

/**
 * @description Thuộc tính cấu hình cho component Thông báo xác minh email.
 */
export interface VerifyEmailNoticeProps {
  /** Địa chỉ email nhận liên kết xác thực */
  email?: string;
  /** Token opaque từ liên kết Backend. */
  token?: string | null;
  /** Callback sau response xác nhận; page gỡ token khỏi URL và nhận email đã xác minh. */
  onVerified?: (email?: string) => void;
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
  email = "",
  token = null,
  onVerified,
  className = "",
}: VerifyEmailNoticeProps) {
  const [cooldown, setCooldown] = useState<number>(0);
  const {
    mutate: resendEmail,
    isPending,
    isError,
    isSuccess,
    error,
  } = useResendEmailVerification();
  const emailResult = verificationEmailSchema.safeParse(email);
  const isEmailValid = emailResult.success;

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
    // 1. [MỤC TIÊU]: Dùng thời gian chờ gửi lại do server trả thay cho cooldown UI 60 giây.
    // 2. [INPUT & OUTPUT]: Retry-After/retryAt được BE chốt -> thời điểm cho phép thử lại.
    // 3. [CÁC BƯỚC]: Chốt contract rate limit; đọc header/DTO trong service/feedback;
    //    cập nhật cooldown kể cả khi 429. Luồng resend 202 và thông báo tiếp nhận đã triển khai.
    // 4. [HÀM / THƯ VIỆN]: useResendEmailVerification, Axios headers, Zod, fake timers trong tests.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Thiếu/sai header, retryAt đã qua; không coi cooldown
    //    cục bộ là policy Backend hoặc 202 là bằng chứng email đã được giao.

    if (isPending || cooldown > 0 || !emailResult.success) return;

    resendEmail(emailResult.data, {
      onSuccess: () => {
        setCooldown(60);
      },
    });
  };

  if (token !== null) {
    return (
      <EmailVerificationCard
        key={token}
        token={token}
        onVerified={onVerified}
        className={className}
      />
    );
  }
  if (!isEmailValid) return <ResendVerificationForm className={className} />;

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
        {emailResult.success ? (
          <p className="text-xs sm:text-sm text-[#6B6B66] leading-relaxed">
            Kiểm tra hộp thư của{" "}
            <span className="font-semibold text-[#0F1A16]">{maskEmail(emailResult.data)}</span> để
            tìm liên kết xác minh nếu bạn đã yêu cầu gửi email.
          </p>
        ) : (
          <p role="alert" className="text-sm text-red-700">
            Thiếu email hợp lệ. Vui lòng quay lại đăng ký.
          </p>
        )}
      </div>

      {/* Nút gửi lại email kèm thời gian đếm ngược */}
      {isError && (
        <p role="alert" className="text-sm text-red-700">
          {getRegisterErrorMessage(error)}
        </p>
      )}

      {isSuccess && (
        <p role="status" className="text-sm text-emerald-700">
          {VERIFY_EMAIL_CONTENT.resendAccepted}
        </p>
      )}

      <div className="space-y-3 pt-2">
        <Button
          type="button"
          onClick={handleResend}
          disabled={!isEmailValid || cooldown > 0 || isPending}
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
        <Link to={ROUTES.AUTH.REGISTER} className="text-[#6B6B66] hover:text-[#0A281E] font-medium">
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
