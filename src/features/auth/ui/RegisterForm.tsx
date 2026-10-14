import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Lock, Mail, User } from "lucide-react";
import type { FocusEvent } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { getRegisterErrorMessage } from "../lib/registerFeedback";
import { registerSchema, type RegisterInput } from "../model/auth.schema";
import type { RegisterRequest } from "../model/auth.types";
import { NEW_PASSWORD_HINT } from "../model/password.schema";
import { useRegister } from "../model/useAuth";

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
  const { mutate: registerUser, isPending, isError, error } = useRegister();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, touchedFields },
  } = useForm<RegisterInput>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(registerSchema),
  });

  const passwordField = register("password");

  /**
   * @description Kiểm tra mật khẩu khi rời ô và cập nhật lỗi xác nhận đã được chạm.
   * @param event Sự kiện rời ô mật khẩu.
   * @returns Promise hoàn thành việc kiểm tra các trường liên quan.
   */
  const handlePasswordBlur = async (event: FocusEvent<HTMLInputElement>): Promise<void> => {
    await passwordField.onBlur(event);

    if (touchedFields.confirmPassword) {
      await trigger("confirmPassword");
    }
  };

  const onSubmit = (data: RegisterInput) => {
    // TODO: [P0][AUTH-04] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Đăng ký theo DTO BE thay vì coi response legacy là phiên đầy đủ.
    // 2. [INPUT & OUTPUT]: Form đã Zod validate -> userId và bước xác minh email hoặc lỗi trường.
    // 3. [CÁC BƯỚC]: Sau AUTH-02 chốt POST /auth/register; adapter bỏ confirmPassword/role khỏi payload nếu DTO không nhận; gửi acceptTerms theo contract; điều hướng theo nextAction.
    // 4. [HÀM / THƯ VIỆN]: useRegister, React Hook Form, zodResolver, service/schema Auth.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không cho client tự cấp role; không mở Passkey hoặc báo login khi còn chờ email; giữ invitation; chống double-submit và không log password.
    if (isPending) return;

    registerUser(data as RegisterRequest, {
      onSuccess: () => {
        onSuccess?.();
        navigate(ROUTES.AUTH.LOGIN);
      },
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className={`space-y-5 w-full ${className}`}>
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mr-2 inline size-4" />
          {getRegisterErrorMessage(error)}
        </div>
      )}
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
            disabled={isPending}
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
            disabled={isPending}
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
            aria-describedby={
              errors.password
                ? "register-password-hint register-password-error"
                : "register-password-hint"
            }
            autoComplete="new-password"
            disabled={isPending}
            {...passwordField}
            onBlur={handlePasswordBlur}
            type="password"
            className="pl-9 h-12 text-sm rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        <p id="register-password-hint" className="text-sm text-heritage-muted">
          {NEW_PASSWORD_HINT}
        </p>
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
            disabled={isPending}
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
