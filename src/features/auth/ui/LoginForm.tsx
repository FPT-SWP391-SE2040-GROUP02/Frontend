import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Info, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getLoginErrorMessage, getLoginRedirect } from "../lib/loginFeedback";
import { loginSchema, type LoginInput } from "../model/auth.schema";
import type { InvitationContext } from "../model/auth.types";
import { useLogin } from "../model/useAuth";
import { ROLES } from "@/shared/constants/roles";
import { APP_MESSAGES } from "@/shared/constants";

/**
 * @description Thuộc tính cấu hình cho component LoginForm.
 */
export interface LoginFormProps {
  /** Callback khi người dùng bấm đăng nhập bằng Passkey / Sinh trắc học */
  onPasskeyClick?: () => void;
  /** Unverified invitation marker; private package/owner details require server authorization. */
  invitationContext?: Pick<InvitationContext, "token">;
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Form Đăng Nhập trang nhã tuân thủ 100% thiết kế Mockup 1, 2, 3 và 4.
 * - Mockup 1: Trạng thái mặc định nhập Email và Mật khẩu, hỗ trợ Google SSO.
 * - Lỗi API hiển thị theo transport; trạng thái khóa/lượt thử chờ contract BE.
 * - Lời mời chỉ hiển thị thông báo trung tính; chưa xác minh ngữ cảnh từ server.
 *
 * @param {LoginFormProps} props Thuộc tính component
 * @returns {React.JSX.Element} Form đăng nhập
 */
export function LoginForm({ onPasskeyClick, invitationContext, className = "" }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showGoogleUnavailable, setShowGoogleUnavailable] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const redirectUrl = getLoginRedirect(searchParams.get("redirect"));
  const { mutate: login, isPending, isError, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  /**
   * @description Xử lý nộp form đăng nhập
   * @param {LoginInput} data Dữ liệu email và mật khẩu
   */
  const onSubmit = (data: LoginInput): void => {
    // TODO: [P0][AUTH-02] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Hiển thị trạng thái khóa/lượt thử từ BE thay cho thông báo lỗi chung.
    // 2. [INPUT & OUTPUT]: ProblemDetails và Retry-After -> thông báo/thời gian thử lại từ server.
    // 3. [CÁC BƯỚC]: Chốt trường lỗi được phép hiển thị; parse trong loginFeedback;
    //    nối UI inline. POST login, Bearer RAM và điều hướng theo user đã triển khai.
    // 4. [HÀM / THƯ VIỆN]: getLoginErrorMessage, Zod, Axios headers, tests LoginForm.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Lỗi mạng/500 không giảm lượt; không tự khóa 15 phút;
    //    không in response nội bộ hoặc suy diễn unlockAt khi server không trả.
    if (isPending || typeof data.email !== "string" || typeof data.password !== "string") return;

    login(
      { email: data.email, password: data.password, rememberMe: data.rememberMe },
      {
        onSuccess: ({ user }) => {
          if (!user.emailVerified) {
            navigate(
              `${ROUTES.AUTH.VERIFY_EMAIL}?${new URLSearchParams({ email: user.email, redirect: redirectUrl })}`,
            );
          } else if (!searchParams.get("redirect") && user.role === ROLES.ADMIN) {
            navigate(ROUTES.ADMIN.ROOT);
          } else if (!searchParams.get("redirect") && user.role === ROLES.VERIFIER) {
            navigate(ROUTES.NOTARY.WORKSPACE);
          } else {
            navigate(redirectUrl);
          }
        },
      },
    );
  };

  /**
   * @description Xử lý đăng nhập thông qua Google SSO
   */
  const handleGoogleLogin = (): void => {
    // TODO: [P1][AUTH-03] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Lấy Google ID token và nối hai nhánh session/linkTicket đã có contract.
    // 2. [INPUT & OUTPUT]: Public OAuth client ID + thao tác người dùng -> ID token/nonce -> GoogleLoginResponse.
    // 3. [CÁC BƯỚC]: Chốt client ID/cách lấy credential; gọi authService.loginWithGoogle qua
    //    coordinator; nhận session hoặc chuyển linkTicket trong RAM tới form link-confirm.
    // 4. [HÀM / THƯ VIỆN]: Google integration đã duyệt, authService, runAuthTransition, Zod, ROUTES.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Cancel/expiry; không tự gộp email; không đưa ID token
    //    hoặc ticket vào URL/storage/log; return/invitation cần validate; chỉ công bố phiên sau server response.
    setShowGoogleUnavailable(true);
  };

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* 1. KHỐI NGỮ CẢNH LỜI MỜI NHẬN DI SẢN (Mockup 4) */}
      {invitationContext && (
        <div className="p-4 rounded-2xl bg-[#EAF2ED] border border-[#C5DCD0] text-[#0A281E] space-y-2">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#0A281E] flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-sm">Bạn đang mở liên kết lời mời.</p>
              <p className="text-[#3F5B4E]">
                Đăng nhập để tiếp tục. Thông tin và hiệu lực lời mời cần được hệ thống xác minh.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. KHỐI TIÊU ĐỀ CHÍNH */}
      <div className="space-y-1 text-left">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#0F1A16]">
          {invitationContext ? "Đăng nhập để tiếp tục" : "Đăng nhập"}
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66]">
          {invitationContext
            ? "Tiếp tục để xác minh tư cách người nhận gói di sản."
            : "Chào mừng trở lại. Tiếp tục để quản lý kho của bạn."}
        </p>
      </div>

      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mr-2 inline size-4" />
          {getLoginErrorMessage(error)}
        </div>
      )}

      {/* 5. NÚT ĐĂNG NHẬP GOOGLE OAUTH */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isPending}
        aria-describedby={showGoogleUnavailable ? "google-login-unavailable" : undefined}
        className="w-full h-11 px-4 rounded-xl border border-[#D5D0C3] hover:border-[#0A281E] bg-white text-[#0F1A16] font-medium text-xs flex items-center justify-center gap-3 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A281E]"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Tiếp tục với Google</span>
      </button>
      {showGoogleUnavailable && (
        <p id="google-login-unavailable" role="status" className="text-xs text-[#6B6B66]">
          {APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE}
        </p>
      )}

      {/* Dải phân cách hoặc dùng email */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-[#E5E5DF]"></div>
        <span className="absolute bg-[#FAFAF6] px-3 text-[11px] text-[#8C8C85]">
          hoặc dùng email
        </span>
      </div>

      {/* 6. FORM NHẬP EMAIL VÀ PASSWORD */}
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="login-email" className="text-xs font-semibold text-[#0F1A16]">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#8C8C85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="login-email"
              autoComplete="username"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              {...register("email")}
              type="email"
              placeholder="nam@example.com"
              disabled={isPending}
              className={`pl-10 h-11 text-xs rounded-xl bg-white border-[#D5D0C3] focus-visible:border-[#0A281E] ${
                errors.email ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" role="alert" className="text-[11px] text-red-600 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between items-baseline">
            <label htmlFor="login-password" className="text-xs font-semibold text-[#0F1A16]">
              Mật khẩu
            </label>
            <Link
              to={ROUTES.AUTH.FORGOT_PASSWORD}
              className="text-[11px] text-[#B88E4C] hover:underline font-semibold"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#8C8C85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="login-password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu của bạn"
              disabled={isPending}
              className={`pl-10 pr-12 h-11 text-xs rounded-xl bg-white border-[#D5D0C3] focus-visible:border-[#0A281E] ${
                errors.password ? "border-red-400" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              disabled={isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B6B66] hover:text-[#0A281E] px-1 py-0.5 rounded focus-visible:outline-none"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {errors.password && (
            <p
              id="login-password-error"
              role="alert"
              className="text-[11px] text-red-600 font-medium"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Nút bấm Đăng nhập */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl bg-[#0A281E] hover:bg-[#133E2F] text-[#FAFAF6] text-xs font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {isPending ? (
            <span>Đang xác thực...</span>
          ) : invitationContext ? (
            <>
              <span>Đăng nhập và tiếp tục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          ) : (
            <span>Đăng nhập</span>
          )}
        </Button>
      </form>

      {/* 7. NÚT PASSKEY NẾU CÓ */}
      {onPasskeyClick && (
        <button
          type="button"
          onClick={onPasskeyClick}
          disabled={isPending}
          className="text-xs text-[#0A281E] hover:underline font-semibold block mx-auto pt-1"
        >
          Hoặc đăng nhập nhanh bằng Passkey / FaceID
        </button>
      )}

      {/* 8. CHUYỂN HƯỚNG TẠO TÀI KHOẢN MỚI */}
      <div className="pt-4 border-t border-[#E5E5DF] text-xs text-[#6B6B66]">
        {invitationContext ? (
          <p>
            Chưa có tài khoản?{" "}
            <Link
              to={`${ROUTES.AUTH.REGISTER}?invitation=${encodeURIComponent(invitationContext.token)}`}
              className="text-[#0A281E] font-bold hover:underline"
            >
              Tạo tài khoản để nhận
            </Link>
          </p>
        ) : (
          <p>
            Chưa có tài khoản?{" "}
            <Link to={ROUTES.AUTH.REGISTER} className="text-[#0A281E] font-bold hover:underline">
              Tạo kho miễn phí
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
