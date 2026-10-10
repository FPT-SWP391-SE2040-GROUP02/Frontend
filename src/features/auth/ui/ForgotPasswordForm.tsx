import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { APP_MESSAGES } from "@/shared/constants";
import { RESET_PASSWORD_CONTENT } from "../model/resetPassword.schema";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
    .email(APP_MESSAGES.VALIDATION.INVALID_EMAIL),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * @description Thuộc tính cấu hình cho ForgotPasswordForm component.
 */
export interface ForgotPasswordFormProps {
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Form yêu cầu khôi phục mật khẩu / mở phân mảnh phục hồi khẩn cấp (Emergency Recovery Shards).
 *
 * @param {ForgotPasswordFormProps} props Thuộc tính component
 * @returns {React.JSX.Element} Form khôi phục mật khẩu
 */
export function ForgotPasswordForm({ className = "" }: ForgotPasswordFormProps) {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  /**
   * @description Hiển thị trạng thái gửi yêu cầu khôi phục trong scaffold hiện tại.
   * @returns {void} Cập nhật trạng thái giao diện.
   */
  const onSubmit = (): void => {
    setIsPending(true);
    // TODO: [P1][AUTH-08] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Thay timer giả bằng yêu cầu khôi phục mật khẩu thực.
    // 2. [INPUT & OUTPUT]: Email hợp lệ -> phản hồi chung từ POST /auth/forgot-password.
    // 3. [CÁC BƯỚC]: Sau AUTH-02 chốt DTO; service -> mutation -> form; bỏ setTimeout giả thành công khi nối API; chỉ chuyển màn sau phản hồi.
    // 4. [HÀM / THƯ VIỆN]: createBaseService/shared transport, TanStack Query, React Hook Form, Zod.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không tiết lộ email tồn tại; rate limit/mất mạng/double-submit; không log email hoặc mã khôi phục.
    setTimeout(() => {
      setIsPending(false);
      setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center w-full py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto " />
        <h3 className="text-base font-medium text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Bản xem trước khôi phục
        </h3>
        <p className="text-sm text-[#526656] dark:text-[#a0b8a5] leading-relaxed">
          Đây là bản xem trước giao diện. Chưa có email khôi phục nào được gửi.
        </p>
        {import.meta.env.DEV && <Link to={ROUTES.AUTH.RESET_PASSWORD} className="flex min-h-11 items-center justify-center text-sm font-medium underline underline-offset-4">{RESET_PASSWORD_CONTENT.previewLink}</Link>}
        <Link to={ROUTES.AUTH.LOGIN} className={`${buttonVariants({ variant: "outline", size: "lg" })} mt-2`}>
          Quay lại Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 w-full ${className}`}>
      <div className="space-y-1.5 text-left">
        <label
          htmlFor="forgot-email"
          className="text-sm font-medium text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]"
        >
          Email đã đăng ký
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-[#728574] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            id="forgot-email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "forgot-email-error" : undefined}
            {...register("email")}
            type="email"
            placeholder="owner@legacyvault.io"
            className="pl-9 h-12 text-sm rounded-xl bg-white dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f]"
          />
        </div>
        {errors.email && (
          <p id="forgot-email-error" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white font-medium text-sm rounded-xl shadow-xs"
      >
        {isPending ? "Đang gửi yêu cầu..." : "Yêu cầu đặt lại mật khẩu"}
      </Button>

      <div className="text-center pt-2">
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="inline-flex items-center gap-1.5 text-sm text-[#596d5d] hover:text-[var(--heritage-primary,#0b291e)] dark:hover:text-[#f3f7f4] font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang Đăng nhập</span>
        </Link>
      </div>
    </form>
  );
}
