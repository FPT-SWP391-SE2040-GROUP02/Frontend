import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { linkGoogleSchema, type LinkGoogleInput } from "../model/auth.schema";
import { useLinkGoogle } from "../model/useAuth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Lock, ShieldCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { getLoginRedirect } from "../lib/loginFeedback";
import { getGoogleErrorMessage } from "../lib/googleFeedback";
import { ROUTES } from "@/shared/config/routes.config";
import type { BackendUserResponse } from "@/entities/user/model/backendUser.schema";

/**
 * @description Thuộc tính cho component Liên kết tài khoản Google.
 */
export interface LinkGoogleAccountCardProps {
  /** Email tài khoản Google cần liên kết */
  email?: string;
  /** Ticket chỉ từ Google response trong RAM; không lấy từ email/URL. */
  linkTicket?: string;
  rememberMe?: boolean;
  returnUrl?: string;
  /** Điều hướng dùng cùng chính sách email/role với đăng nhập thường. */
  onComplete?: (user: BackendUserResponse) => void;
  /** Bỏ vé khỏi form và quay lại Google; giữ nguyên redirect của màn đăng nhập. */
  onCancel?: () => void;
  /** Tên đầy đủ từ hồ sơ Google */
  fullName?: string;
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Giao diện Xác nhận mật khẩu để Liên kết Google (Mockup 5 - LienKetGoogle.dc.html).
 * Đảm bảo nguyên tắc bảo mật: Không tự động gộp tài khoản nếu người dùng chưa xác nhận mật khẩu hiện có.
 *
 * @param {LinkGoogleAccountCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Card xác nhận liên kết
 */
export function LinkGoogleAccountCard({
  email = "",
  fullName = "",
  linkTicket,
  rememberMe = false,
  returnUrl,
  onComplete,
  onCancel,
  className = "",
}: LinkGoogleAccountCardProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const navigate = useNavigate();
  const { mutate: linkAccount, isPending, isError, error } = useLinkGoogle();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkGoogleInput>({
    resolver: zodResolver(linkGoogleSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      password: "",
    },
  });

  /**
   * @description Xử lý nộp form xác nhận mật khẩu liên kết
   * @param {LinkGoogleInput} data Dữ liệu mật khẩu
   */
  const onSubmit = (data: LinkGoogleInput): void => {
    // Ticket phải đến từ Google response trong RAM.
    if (isPending || !linkTicket) return;
    linkAccount(
      {
        linkTicket,
        password: data.password,
        rememberMe,
      },
      {
        onSuccess: (outcome) => {
          // Admin đã bật 2FA: chưa có phiên, sang bước nhập mã.
          if ("twoFactorRequired" in outcome) navigate(ROUTES.AUTH.TWO_FACTOR);
          else if (onComplete) onComplete(outcome.user);
          else navigate(getLoginRedirect(returnUrl ?? null));
        },
      },
    );
  };

  if (!linkTicket)
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl">Liên kết Google</h1>
        <p role="alert" className="text-sm text-red-700">
          Thiếu phiên liên kết Google hợp lệ. Vui lòng quay lại đăng nhập.
        </p>
        <Link to={ROUTES.AUTH.LOGIN} className="inline-flex min-h-11 items-center underline">
          Quay lại đăng nhập
        </Link>
      </div>
    );

  return (
    <div className={`w-full space-y-6 text-left ${className}`}>
      {/* Tiêu đề & Diễn giải */}
      <div className="space-y-1">
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-serif text-2xl sm:text-3xl font-normal text-[#0F1A16]"
        >
          Email này đã có tài khoản
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66] leading-relaxed">
          Địa chỉ <span className="font-medium text-[#0F1A16]">{email}</span> đã được dùng cho một
          tài khoản LegacyVault. Nhập mật khẩu để liên kết với Google.
        </p>
      </div>

      {/* Thẻ người dùng Google (User Pill) */}
      {fullName && (
        <div className="p-3 rounded-2xl bg-white border border-[#E5E5DF] flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#EAF2ED] text-[#0A281E] font-bold text-base flex items-center justify-center flex-shrink-0">
            {fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0F1A16] truncate">{fullName}</p>
            <p className="text-[11px] text-[#6B6B66] truncate">{email}, từ Google</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-[#B88E4C] flex-shrink-0" />
        </div>
      )}
      {isError && (
        <p role="alert" className="text-sm text-red-700">
          {getGoogleErrorMessage(error)}
        </p>
      )}
      {/* Form nhập mật khẩu hiện tại */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5 text-left">
          <label htmlFor="google-link-password" className="text-xs font-semibold text-[#0F1A16]">
            Mật khẩu hiện có
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#8C8C85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="google-link-password"
              disabled={isPending || !linkTicket}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "google-link-password-error" : undefined}
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu hiện tại của bạn"
              className={`pl-10 pr-12 h-11 text-xs rounded-xl bg-white border-[#D5D0C3] focus-visible:border-[#0A281E] ${
                errors.password ? "border-red-500" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              disabled={isPending}
              className="absolute right-0 top-1/2 -translate-y-1/2 min-h-11 min-w-11 text-xs font-medium text-[#6B6B66] hover:text-[#0A281E] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A281E]"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {errors.password && (
            <p
              id="google-link-password-error"
              role="alert"
              className="text-[11px] text-red-600 font-medium"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending || !linkTicket}
          className="w-full h-11 rounded-xl bg-[#0A281E] hover:bg-[#133E2F] text-[#FAFAF6] text-xs font-semibold shadow-md transition-all disabled:opacity-50 mt-2"
        >
          {isPending ? "Đang xác nhận..." : "Xác nhận và liên kết"}
        </Button>
      </form>

      {/* Nút hủy chuyển về dùng email khác */}
      <div className="pt-4 border-t border-[#E5E5DF] text-center">
        {onCancel ? (
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="min-h-11 text-xs text-[#0A281E] underline"
          >
            Quay lại đăng nhập Google
          </button>
        ) : (
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="text-xs text-[#0A281E] hover:underline font-semibold"
          >
            Dùng email khác
          </Link>
        )}
      </div>
    </div>
  );
}
