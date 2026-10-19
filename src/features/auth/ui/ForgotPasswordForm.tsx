import { ROUTES } from "@/shared/config/routes.config";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../model/forgotPassword.schema";
import { passwordRecoveryService } from "../api/passwordRecoveryService";
import { passwordRecoveryFeedback } from "../lib/passwordRecoveryFeedback";

/**
 * @description Thuộc tính cấu hình cho ForgotPasswordForm component.
 */
export interface ForgotPasswordFormProps {
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Gửi yêu cầu khôi phục thật, không tiết lộ tài khoản có tồn tại.
 *
 * @param {ForgotPasswordFormProps} props Thuộc tính component
 * @returns {React.JSX.Element} Form khôi phục mật khẩu
 */
export function ForgotPasswordForm({ className = "" }: ForgotPasswordFormProps) {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (input: ForgotPasswordInput): Promise<void> => {
    if (busy.current) return;
    busy.current = true;
    setIsPending(true);
    setError("");
    try {
      await passwordRecoveryService.request(input.email);
      if (mounted.current) setIsSubmitted(true);
    } catch (failure) {
      if (mounted.current) setError(passwordRecoveryFeedback(failure).message);
    } finally {
      busy.current = false;
      if (mounted.current) setIsPending(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center w-full py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto " />
        <h3 className="text-base font-medium text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Đã tiếp nhận yêu cầu
        </h3>
        <p className="text-sm text-[#526656] dark:text-[#a0b8a5] leading-relaxed">
          Nếu email thuộc tài khoản đủ điều kiện, bạn sẽ nhận được liên kết đặt lại mật khẩu. Kiểm
          tra hộp thư và dùng liên kết mới nhất.
        </p>
        <Link
          to={ROUTES.AUTH.LOGIN}
          className={`${buttonVariants({ variant: "outline", size: "lg" })} mt-2`}
        >
          Quay lại Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
      className={`space-y-4 w-full ${className}`}
    >
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
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
            disabled={isPending}
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
