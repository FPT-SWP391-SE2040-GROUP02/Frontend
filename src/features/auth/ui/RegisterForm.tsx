import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "../model/auth.schema";
import type { RegisterRequest } from "../model/auth.types";
import { useRegister } from "../model/useAuth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { User, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Thuộc tính cấu hình cho RegisterForm component.
 */
export interface RegisterFormProps {
  /** Callback khi đăng ký thành công */
  onSuccess?: () => void;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Form Tạo tài khoản Mới.
 *
 * @param {RegisterFormProps} props Thuộc tính component
 * @returns {React.JSX.Element} Form đăng ký
 *
 * @example
 * ```tsx
 * <RegisterForm onSuccess={() => navigate(ROUTES.AUTH.LOGIN)} />
 * ```
 */
export function RegisterForm({ onSuccess, className = "" }: RegisterFormProps) {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    // TODO: 1. Gọi mutation registerUser(data)
    // TODO: 2. Khi thành công chuyển hướng về đăng nhập hoặc mở PasskeyEnrollModal
    registerUser(data as RegisterRequest, {
      onSuccess: () => {
        onSuccess?.();
        navigate(ROUTES.AUTH.LOGIN);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-5 w-full ${className}`}>
      {/* Full Name */}
      <div className="space-y-1 text-left">
        <label
          htmlFor="register-fullName"
          className="text-sm font-medium text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]"
        >
          Họ và tên
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            id="register-fullName"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "register-fullName-error" : undefined}
            autoComplete="name"
            {...register("fullName")}
            placeholder="Nguyễn Văn A"
            className="pl-9 h-12 text-sm rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.fullName && (
          <p id="register-fullName-error" role="alert" className="text-sm text-destructive">
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1 text-left">
        <label
          htmlFor="register-email"
          className="text-sm font-medium text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            id="register-email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            autoComplete="email"
            {...register("email")}
            type="email"
            placeholder="owner@legacyvault.io"
            className="pl-9 h-12 text-sm rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.email && (
          <p id="register-email-error" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1 text-left">
        <label
          htmlFor="register-password"
          className="text-sm font-medium text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]"
        >
          Mật khẩu
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            id="register-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "register-password-error" : undefined}
            autoComplete="new-password"
            {...register("password")}
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            className="pl-9 h-12 text-sm rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.password && (
          <p id="register-password-error" role="alert" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1 text-left">
        <label
          htmlFor="register-confirmPassword"
          className="text-sm font-medium text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]"
        >
          Xác nhận mật khẩu
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            id="register-confirmPassword"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "register-confirmPassword-error" : undefined}
            autoComplete="new-password"
            {...register("confirmPassword")}
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="pl-9 h-12 text-sm rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.confirmPassword && (
          <p id="register-confirmPassword-error" role="alert" className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white font-medium text-sm rounded-xl shadow-xs mt-2"
      >
        {isPending ? "Đang khởi tạo tài khoản..." : "Tạo tài khoản"}
      </Button>
    </form>
  );
}
