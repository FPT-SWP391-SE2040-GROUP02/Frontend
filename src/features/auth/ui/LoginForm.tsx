import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../model/auth.schema";
import type { LoginRequest, InvitationContext } from "../model/auth.types";
import { useLogin } from "../model/useAuth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Lock, Mail, AlertCircle, Info, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Thuộc tính cấu hình cho component LoginForm.
 */
export interface LoginFormProps {
  /** Callback khi người dùng bấm đăng nhập bằng Passkey / Sinh trắc học */
  onPasskeyClick?: () => void;
  /** Dữ liệu ngữ cảnh khi người dùng mở từ đường dẫn lời mời nhận di sản (Mockup 4) */
  invitationContext?: InvitationContext;
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Form Đăng Nhập trang nhã tuân thủ 100% thiết kế Mockup 1, 2, 3 và 4.
 * - Mockup 1: Trạng thái mặc định nhập Email và Mật khẩu, hỗ trợ Google SSO.
 * - Mockup 2: Trạng thái báo lỗi đăng nhập kèm số lần thử còn lại (Đếm ngược 5 lần).
 * - Mockup 3: Trạng thái tạm dừng đăng nhập 15 phút khi nhập sai quá 5 lần (Lockout timer).
 * - Mockup 4: Trạng thái hiển thị ngữ cảnh gói di sản được mời nhận.
 *
 * @param {LoginFormProps} props Thuộc tính component
 * @returns {React.JSX.Element} Form đăng nhập
 */
export function LoginForm({
  onPasskeyClick,
  invitationContext,
  className = "",
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Đọc tham số URL phục vụ redirect và mô phỏng trạng thái demo (Mockup 2 & 3)
  const redirectUrl = searchParams.get("redirect") || ROUTES.DASHBOARD.ROOT;
  const initialAttempts = searchParams.get("state") === "invalid" ? 3 : 5;
  const isMockLockout = searchParams.get("state") === "locked";

  // Quản lý số lần thử và trạng thái khóa tạm thời (Mockup 2 & 3)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(initialAttempts);
  const [isLocked, setIsLocked] = useState<boolean>(isMockLockout);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(isMockLockout ? 872 : 0); // 14:32 = 872s

  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "nam@example.com",
      password: "",
      rememberMe: true,
    },
  });

  // Bộ đếm thời gian lùi khi bị tạm dừng 15 phút (Mockup 3)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isLocked && lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttemptsRemaining(5);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutSeconds]);

  /**
   * @description Định dạng số giây còn lại sang mm:ss (VD: 14:32)
   */
  const formatCountdown = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  /**
   * @description Xử lý nộp form đăng nhập
   * @param {LoginInput} data Dữ liệu email và mật khẩu
   */
  const onSubmit = (data: LoginInput): void => {
    // TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
    // 1. [MỤC TIÊU]: Gọi API POST /api/v1/auth/login. Nếu thành công -> lưu phiên và chuyển hướng.
    //               Nếu thất bại với 401 -> Giảm attemptsRemaining. Nếu <= 0 -> Kích hoạt isLocked 15 phút.
    // 2. [INPUT]: data (LoginInput). [OUTPUT]: Điều hướng hoặc hiển thị banner lỗi.
    // 3. [CÁC BƯỚC]:
    //    - Gọi mutation login(data).
    //    - Bắt onError: Kiểm tra error.response?.data?.attemptsRemaining.
    //    - Nếu attemptsRemaining <= 0 -> đặt isLocked = true và lockoutSeconds = 900.
    // 4. [HÀM/THƯ VIỆN]: useLogin(), navigate(redirectUrl).
    // 5. [ĐIỀU KIỆN BIÊN]: Ngăn nộp form khi isLocked = true; bảo toàn giá trị ô email.
    if (isLocked) return;

    login(data as LoginRequest, {
      onSuccess: () => {
        navigate(redirectUrl);
      },
      onError: () => {
        setAttemptsRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setIsLocked(true);
            setLockoutSeconds(900); // 15 phút
          }
          return Math.max(0, next);
        });
      },
    });
  };

  /**
   * @description Xử lý đăng nhập thông qua Google SSO
   */
  const handleGoogleLogin = (): void => {
    // TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
    // 1. [MỤC TIÊU]: Khởi tạo luồng OAuth 2.0 PKCE với Google Identity Services.
    // 2. [INPUT]: Không có. [OUTPUT]: Redirect sang Google OAuth URL.
    // 3. [CÁC BƯỚC]: Chuyển hướng trình duyệt đến endpoint backend /api/v1/auth/google/authorize.
    // 4. [HÀM/THƯ VIỆN]: window.location.assign.
    // 5. [ĐIỀU KIỆN BIÊN]: Xử lý khi tài khoản đã có email nhưng chưa liên kết (chuyển sang Mockup 5).
    window.location.href = `/api/v1/auth/google/authorize?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* 1. KHỐI NGỮ CẢNH LỜI MỜI NHẬN DI SẢN (Mockup 4) */}
      {invitationContext && (
        <div className="p-4 rounded-2xl bg-[#EAF2ED] border border-[#C5DCD0] text-[#0A281E] space-y-2">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#0A281E] flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-sm">
                Bạn đang mở lời mời nhận gói “{invitationContext.packageName}”.
              </p>
              <p className="text-[#3F5B4E]">
                Sau khi đăng nhập, bạn sẽ quay lại đúng bước xác minh. Email đăng nhập không cần trùng với email trong lời mời.
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

      {/* 3. KHỐI BÁO LỖI SAI THÔNG TIN (Mockup 2) */}
      {!isLocked && attemptsRemaining < 5 && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#9B1C1C] flex items-start gap-3 text-xs leading-relaxed"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#E02424]" />
          <div>
            <p className="font-semibold">
              Email hoặc mật khẩu chưa đúng. Bạn còn {attemptsRemaining} lần thử.
            </p>
            <p className="text-[11px] text-[#C81E1E] mt-0.5">
              Sai 5 lần trong 15 phút, đăng nhập bằng mật khẩu sẽ tạm dừng 15 phút.
            </p>
          </div>
        </div>
      )}

      {/* 4. KHỐI BÁO KHÓA TẠM THỜI 15 PHÚT (Mockup 3) */}
      {isLocked && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] flex items-start gap-3 text-xs leading-relaxed"
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#D97706]" />
          <div>
            <p className="font-semibold">
              Đăng nhập bằng mật khẩu tạm dừng. Bạn đã nhập sai 5 lần trong 15 phút.
            </p>
            <p className="text-[11px] text-[#B45309] mt-0.5">
              Hãy thử lại sau {formatCountdown(lockoutSeconds)}. Tài khoản của bạn không bị khóa.
            </p>
          </div>
        </div>
      )}

      {/* 5. NÚT ĐĂNG NHẬP GOOGLE OAUTH */}
      <button
        type="button"
        onClick={handleGoogleLogin}
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

      {/* Dải phân cách hoặc dùng email */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-[#E5E5DF]"></div>
        <span className="absolute bg-[#FAFAF6] px-3 text-[11px] text-[#8C8C85]">
          hoặc dùng email
        </span>
      </div>

      {/* 6. FORM NHẬP EMAIL VÀ PASSWORD */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-[#0F1A16]">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#8C8C85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              {...register("email")}
              type="email"
              placeholder="nam@example.com"
              disabled={isLocked}
              className={`pl-10 h-11 text-xs rounded-xl bg-white border-[#D5D0C3] focus-visible:border-[#0A281E] ${
                errors.email ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-semibold text-[#0F1A16]">Mật khẩu</label>
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
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu của bạn"
              disabled={isLocked}
              className={`pl-10 pr-12 h-11 text-xs rounded-xl bg-white border-[#D5D0C3] focus-visible:border-[#0A281E] ${
                errors.password || attemptsRemaining < 5 ? "border-red-400" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLocked}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B6B66] hover:text-[#0A281E] px-1 py-0.5 rounded focus-visible:outline-none"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-600 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Nút bấm Đăng nhập */}
        <Button
          type="submit"
          disabled={isPending || isLocked}
          className="w-full h-11 rounded-xl bg-[#0A281E] hover:bg-[#133E2F] text-[#FAFAF6] text-xs font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {isLocked ? (
            <span>Thử lại sau {formatCountdown(lockoutSeconds)}</span>
          ) : isPending ? (
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
      {onPasskeyClick && !isLocked && (
        <button
          type="button"
          onClick={onPasskeyClick}
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
              to={`${ROUTES.AUTH.REGISTER}?invitation=${invitationContext.token}`}
              className="text-[#0A281E] font-bold hover:underline"
            >
              Tạo tài khoản để nhận
            </Link>
          </p>
        ) : (
          <p>
            Chưa có tài khoản?{" "}
            <Link
              to={ROUTES.AUTH.REGISTER}
              className="text-[#0A281E] font-bold hover:underline"
            >
              Tạo kho miễn phí
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
