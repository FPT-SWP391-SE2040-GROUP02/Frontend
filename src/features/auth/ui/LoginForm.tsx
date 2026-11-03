import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, Info, Lock, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { LinkGoogleAccountCard } from "./LinkGoogleAccountCard";
import { getGoogleErrorMessage } from "../lib/googleFeedback";
import type { BackendUserResponse } from "@/entities/user/model/backendUser.schema";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getLoginErrorMessage, getLoginRedirect } from "../lib/loginFeedback";
import { loginSchema, type LoginInput } from "../model/auth.schema";
import type { InvitationContext } from "../model/auth.types";
import { useLogin, useGoogleLogin } from "../model/useAuth";
import { ROLES } from "@/shared/constants/roles";

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
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [link, setLink] = useState<{ linkTicket: string; maskedEmail: string } | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const redirectUrl = getLoginRedirect(searchParams.get("redirect"));
  const { mutate: login, isPending: loginPending, isError, error } = useLogin();
  const google = useGoogleLogin();
  const isPending = loginPending || google.isPending;

  const emailParam = searchParams.get("email") ?? "";
  const isVerifiedBanner = searchParams.get("verified") === "true";

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailParam,
      password: "",
      rememberMe: true,
    },
  });

  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
  }, [emailParam, setValue]);

  const finishLogin = (user: BackendUserResponse): void => {
    if (!user.emailVerified) {
      navigate(
        `${ROUTES.AUTH.VERIFY_EMAIL}?${new URLSearchParams({ email: user.email, redirect: redirectUrl })}`,
      );
    } else if (
      user.role === ROLES.ADMIN &&
      (!searchParams.get("redirect") ||
        (redirectUrl.startsWith(ROUTES.DASHBOARD.ROOT) && redirectUrl !== ROUTES.DASHBOARD.USERS))
    ) {
      navigate(ROUTES.ADMIN.ROOT);
    } else if (
      user.role === ROLES.VERIFIER &&
      (!searchParams.get("redirect") || redirectUrl.startsWith(ROUTES.DASHBOARD.ROOT))
    ) {
      navigate(ROUTES.NOTARY.WORKSPACE);
    } else if (
      user.role === ROLES.EXECUTOR &&
      (!searchParams.get("redirect") || redirectUrl.startsWith(ROUTES.DASHBOARD.ROOT))
    ) {
      navigate(ROUTES.EXECUTOR.ROOT);
    } else {
      navigate(redirectUrl);
    }
  };

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
        onSuccess: (outcome) => {
          if ("twoFactorRequired" in outcome) navigate(ROUTES.AUTH.TWO_FACTOR);
          else finishLogin(outcome.user);
        },
      },
    );
  };

  const handleGoogleCredential = async (idToken: string, nonce: string): Promise<void> => {
    if (isPending) return;
    try {
      const result = await google.mutateAsync({
        idToken,
        nonce,
        rememberMe: getValues("rememberMe") ?? false,
        returnUrl: redirectUrl,
      });
      if (!mounted.current) return;
      if (result.signedIn) finishLogin(result.user);
      else if ("twoFactorRequired" in result) navigate(ROUTES.AUTH.TWO_FACTOR);
      else setLink({ linkTicket: result.linkTicket, maskedEmail: result.maskedEmail });
    } catch {
      // Mutation giữ lỗi cho UI; không retry cookie mutation tự động.
    }
  };

  if (link)
    return (
      <LinkGoogleAccountCard
        linkTicket={link.linkTicket}
        email={link.maskedEmail}
        rememberMe={getValues("rememberMe") ?? false}
        returnUrl={redirectUrl}
        onComplete={finishLogin}
        onCancel={() => {
          setLink(null);
          google.reset();
        }}
      />
    );

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* 1. KHỐI THÔNG BÁO XÁC MINH EMAIL THÀNH CÔNG */}
      {isVerifiedBanner && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1 text-left"
        >
          <div className="flex items-center gap-2 font-semibold text-sm text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Xác minh email thành công!</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed pl-7">
            Địa chỉ email của bạn đã được kích hoạt. Vui lòng nhập mật khẩu để đăng nhập vào tài
            khoản.
          </p>
        </div>
      )}

      {/* 1b. KHỐI NGỮ CẢNH LỜI MỜI NHẬN DI SẢN (Mockup 4) */}
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

      <GoogleSignInButton disabled={isPending} onCredential={handleGoogleCredential} />
      {google.isError && (
        <p role="alert" className="text-sm text-red-700">
          {getGoogleErrorMessage(google.error)}
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
