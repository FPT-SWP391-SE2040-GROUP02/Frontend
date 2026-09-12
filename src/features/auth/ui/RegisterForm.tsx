import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "../model/auth.schema";
import { useRegister } from "../model/useAuth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { User, Mail, Lock, Phone } from "lucide-react";
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
 * @description Form Đăng Ký Tài Khoản Chính Chủ Mới.
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
    registerUser(data, {
      onSuccess: () => {
        onSuccess?.();
        navigate(ROUTES.AUTH.LOGIN);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-3.5 max-w-sm w-full ${className}`}>
      {/* Full Name */}
      <div className="space-y-1 text-left">
        <label className="text-xs font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Họ và tên chủ sở hữu
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            {...register("fullName")}
            placeholder="Nguyễn Văn A"
            className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.fullName && (
          <p className="text-[11px] text-red-500 font-medium">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1 text-left">
        <label className="text-xs font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Địa chỉ Email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            {...register("email")}
            type="email"
            placeholder="owner@legacyvault.io"
            className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.email && (
          <p className="text-[11px] text-red-500 font-medium">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1 text-left">
        <label className="text-xs font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Mật khẩu chính (Master Passphrase)
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            {...register("password")}
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.password && (
          <p className="text-[11px] text-red-500 font-medium">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1 text-left">
        <label className="text-xs font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Xác nhận mật khẩu
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            {...register("confirmPassword")}
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-[11px] text-red-500 font-medium">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white font-bold text-xs rounded-xl shadow-xs mt-2"
      >
        {isPending ? "Đang khởi tạo tài khoản..." : "Đăng Ký Tài Khoản Chính Chủ"}
      </Button>
    </form>
  );
}
