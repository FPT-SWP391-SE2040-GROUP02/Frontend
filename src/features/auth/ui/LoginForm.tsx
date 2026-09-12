import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../model/auth.schema";
import { useLogin } from "../model/useAuth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Lock, Mail, Fingerprint, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Thuộc tính cấu hình cho component LoginForm.
 */
export interface LoginFormProps {
  /** Callback khi người dùng yêu cầu đăng nhập bằng Passkey */
  onPasskeyClick?: () => void;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Form Đăng Nhập trang nhã kết hợp Password và Passkey/WebAuthn FIDO2.
 *
 * @param {LoginFormProps} props Thuộc tính component
 * @returns {React.JSX.Element} Form đăng nhập
 *
 * @example
 * ```tsx
 * <LoginForm onPasskeyClick={() => setIsPasskeyOpen(true)} />
 * ```
 */
export function LoginForm({ onPasskeyClick, className = "" }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectUrl = searchParams.get("redirect") || ROUTES.DASHBOARD.ROOT;

  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "alexander.h@legacyvault.io",
      password: "VaultPassphrase2026!",
      rememberMe: true,
    },
  });

  /**
   * @description Xử lý nộp form đăng nhập
   */
  const onSubmit = (data: LoginInput) => {
    // TODO: 1. Gọi mutation login(data)
    // TODO: 2. Khi thành công điều hướng về redirectUrl
    login(data, {
      onSuccess: () => {
        navigate(redirectUrl);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 max-w-sm w-full ${className}`}>
      {/* Email Input */}
      <div className="space-y-1.5 text-left">
        <label className="text-xs font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Địa chỉ Email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            {...register("email")}
            type="email"
            placeholder="owner@legacyvault.io"
            className="pl-9 h-11 text-xs rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.email && (
          <p className="text-[11px] text-red-500 font-medium">{errors.email.message}</p>
        )}
      </div>

      {/* Password Input */}
      <div className="space-y-1.5 text-left">
        <div className="flex justify-between items-baseline">
          <label className="text-xs font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            Mật khẩu / Passphrase
          </label>
          <a
            href={ROUTES.AUTH.FORGOT_PASSWORD}
            className="text-[11px] text-[var(--heritage-gold,#b88e4c)] hover:underline font-semibold"
          >
            Quên mật khẩu?
          </a>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu của bạn"
            className="pl-9 pr-9 h-11 text-xs rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[#728574] hover:text-[#0b291e] absolute right-3 top-1/2 -translate-y-1/2"
            aria-label="Ẩn hiện mật khẩu"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-red-500 font-medium">{errors.password.message}</p>
        )}
      </div>

      {/* Remember me Checkbox */}
      <div className="flex items-center gap-2 text-xs text-[#526656] dark:text-[#a2baa6]">
        <input
          {...register("rememberMe")}
          type="checkbox"
          id="rememberMe"
          className="rounded text-emerald-600 w-3.5 h-3.5"
        />
        <label htmlFor="rememberMe" className="cursor-pointer">
          Ghi nhớ phiên đăng nhập trên thiết bị này
        </label>
      </div>

      {/* Nút Đăng nhập mật khẩu */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white font-bold text-xs rounded-xl shadow-xs"
      >
        {isPending ? "Đang xác thực bảo mật..." : "Vào Két Di Sản (Vault Drive)"}
      </Button>

      {/* Divider */}
      <div className="relative py-2 flex items-center justify-center">
        <div className="w-full border-t border-[#e2ebd9] dark:border-[#193a28]" />
        <span className="absolute bg-[#fafaf7] dark:bg-[#071710] px-3 text-[10px] text-[#788c7b] font-bold uppercase tracking-wider">
          HOẶC
        </span>
      </div>

      {/* Nút Passkey WebAuthn */}
      <Button
        type="button"
        variant="outline"
        onClick={onPasskeyClick}
        className="w-full h-11 gap-2 border-[#cbd9c6] dark:border-[#1f4832] text-xs rounded-xl font-bold bg-white dark:bg-[#0d2419]"
      >
        <Fingerprint className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        <span>Đăng nhập nhanh bằng Passkey / FaceID</span>
      </Button>
    </form>
  );
}
