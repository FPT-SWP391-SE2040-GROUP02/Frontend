import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { APP_MESSAGES } from "@/shared/constants";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
    .email(APP_MESSAGES.VALIDATION.EMAIL),
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

  const onSubmit = (_data: ForgotPasswordInput) => {
    setIsPending(true);
    // TODO: 1. Gọi API POST /api/v1/auth/forgot-password với email
    // TODO: 2. Kích hoạt quy trình gửi mã khôi phục khẩn cấp
    setTimeout(() => {
      setIsPending(false);
      setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center max-w-sm w-full py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
        <h3 className="text-base font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Đã Gửi Hướng Dẫn Khôi Phục!
        </h3>
        <p className="text-xs text-[#526656] dark:text-[#a0b8a5] leading-relaxed">
          Vui lòng kiểm tra hộp thư email để nhận liên kết đặt lại mật khẩu hoặc kích hoạt phân mảnh
          khôi phục khẩn cấp.
        </p>
        <Link to={ROUTES.AUTH.LOGIN}>
          <Button variant="outline" className="text-xs h-10 px-4 rounded-xl font-bold mt-2">
            Quay lại Đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 max-w-sm w-full ${className}`}>
      <div className="space-y-1.5 text-left">
        <label className="text-xs font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Địa chỉ Email đã đăng ký
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

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white font-bold text-xs rounded-xl shadow-xs"
      >
        {isPending ? "Đang gửi yêu cầu..." : "Gửi Hướng Dẫn Khôi Phục"}
      </Button>

      <div className="text-center pt-2">
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="inline-flex items-center gap-1.5 text-xs text-[#596d5d] hover:text-[var(--heritage-primary,#0b291e)] dark:hover:text-[#f3f7f4] font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang Đăng nhập</span>
        </Link>
      </div>
    </form>
  );
}
