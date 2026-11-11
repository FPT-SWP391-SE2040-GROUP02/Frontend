import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Lock, Mail, Phone, User } from "lucide-react";
import type { FocusEvent } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { emailMatchesMask } from "@/shared/lib/invitedEmail";
import { getRegisterErrorMessage } from "../lib/registerFeedback";
import { registerSchema, type RegisterInput } from "../model/auth.schema";
import { NEW_PASSWORD_HINT } from "../model/password.schema";
import { PHONE_SHARING_HINT } from "../model/phone.schema";
import { useRegister } from "../model/useAuth";

/**
 * @description Thuộc tính cấu hình cho RegisterForm component.
 */
export interface RegisterFormProps {
  /** Callback khi đăng ký thành công */
  onSuccess?: () => void;
  /** Đường dẫn nội bộ cần quay lại sau khi xác thực email, ví dụ trang nhận lời mời. */
  redirect?: string | null;
  /** true khi người dùng đến từ liên kết lời mời: ẩn ghi chú chia sẻ số điện thoại vì không áp dụng cho người nhận. */
  fromInvitation?: boolean;
  /** Email điền sẵn theo thư mời: ô email bị khóa (chỉ đọc), người dùng không đổi được. */
  lockedEmail?: string | null;
  /**
   * Email được mời đã che bớt (ví dụ m•••••h@example.com) khi chưa có email đầy đủ để điền sẵn: nhắc người dùng dùng
   * đúng email đó và chặn gửi form nếu email gõ vào không khớp dạng che. Backend vẫn là nơi kiểm cuối cùng.
   */
  invitedEmailMasked?: string | null;
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
export function RegisterForm({
  onSuccess,
  redirect = null,
  fromInvitation = false,
  lockedEmail = null,
  invitedEmailMasked = null,
  className = "",
}: RegisterFormProps) {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending, isError, error } = useRegister();

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    formState: { errors, touchedFields },
  } = useForm<RegisterInput>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(registerSchema),
    defaultValues: lockedEmail ? { email: lockedEmail } : undefined,
  });

  const passwordField = register("password");

  // Ghi chú chia sẻ số điện thoại chỉ hiện với Chủ kho và Người thực hiện; người nhận không thấy.
  let phoneDescribedBy: string | undefined = undefined;
  if (!fromInvitation) {
    phoneDescribedBy = "register-phone-hint";
  }
  if (errors.phone) {
    phoneDescribedBy = phoneDescribedBy
      ? `${phoneDescribedBy} register-phone-error`
      : "register-phone-error";
  }

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
    // 1. [MỤC TIÊU]: Giữ ngữ cảnh lời mời qua đăng ký và xác minh khi contract được duyệt.
    // 2. [INPUT & OUTPUT]: Invitation marker chưa tin cậy + form -> return context đã validate.
    // 3. [CÁC BƯỚC]: Chốt API xác minh lời mời/callback; truyền context qua màn chờ email;
    //    Backend kiểm quyền trước khi mở tài nguyên. Luồng register 202 hiện có đã triển khai.
    // 4. [HÀM / THƯ VIỆN]: useRegister, React Router, Zod; API invitation cần được chốt.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Lời mời hết hạn/sai account; không tự cấp role,
    //    không coi đăng ký là đăng nhập hoặc làm lộ nội dung từ marker chưa xác minh.
    if (isPending) return;

    if (!lockedEmail && invitedEmailMasked && !emailMatchesMask(data.email, invitedEmailMasked)) {
      setError("email", { type: "validate", message: "Email này không phải email được mời." });
      return;
    }

    registerUser(data, {
      onSuccess: () => {
        onSuccess?.();
        const verifyParams = new URLSearchParams({ email: data.email });
        if (redirect) {
          verifyParams.set("redirect", redirect);
        }
        navigate(`${ROUTES.AUTH.VERIFY_EMAIL}?${verifyParams}`);
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
            readOnly={Boolean(lockedEmail)}
            {...register("email")}
            type="email"
            placeholder="owner@legacyvault.io"
            className="pl-9 h-12 text-sm rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {lockedEmail && (
          <p className="text-xs text-heritage-muted">
            Email đã điền sẵn theo thư mời, không đổi được.
          </p>
        )}
        {!lockedEmail && invitedEmailMasked && (
          <p className="text-xs text-heritage-muted">
            Hãy dùng đúng email được mời: {invitedEmailMasked}
          </p>
        )}
        {errors.email && (
          <p id="register-email-error" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1 text-left">
        <label
          htmlFor="register-phone"
          className="text-sm font-medium text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]"
        >
          Số điện thoại
        </label>
        <div className="relative">
          <Phone className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            id="register-phone"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={phoneDescribedBy}
            autoComplete="tel"
            inputMode="tel"
            disabled={isPending}
            {...register("phone")}
            type="tel"
            placeholder="0912 345 678"
            className="pl-9 h-12 text-sm rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {!fromInvitation && (
          <p id="register-phone-hint" className="text-sm text-heritage-muted">
            {PHONE_SHARING_HINT}
          </p>
        )}
        {errors.phone && (
          <p id="register-phone-error" role="alert" className="text-sm text-destructive">
            {errors.phone.message}
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
