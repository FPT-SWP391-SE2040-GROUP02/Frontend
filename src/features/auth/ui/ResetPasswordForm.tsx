import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { CircleCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ROUTES } from "@/shared/config/routes.config";
import {
  resetPasswordSchema,
  RESET_PASSWORD_CONTENT as content,
  type ResetPasswordInput,
} from "../model/resetPassword.schema";

/** Form UI khôi phục có validation; submit chỉ trình bày trạng thái mẫu. */
export function ResetPasswordForm() {
  const [visible, setVisible] = useState(false);
  const [complete, setComplete] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  // TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
  // 1. [MỤC TIÊU]: Đặt lại mật khẩu bằng token khôi phục dùng một lần.
  // 2. [INPUT & OUTPUT]: Token và mật khẩu hợp lệ -> xác nhận từ backend hoặc mã lỗi.
  // 3. [CÁC BƯỚC]: Chốt DTO/endpoint; tạo service và mutation; xác nhận token; gửi khi
  //    người dùng đồng ý; disable double submit; xóa form/token rồi trở về đăng nhập.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, TanStack Query, React Hook Form, Zod.
  // 5. [ĐIỀU KIỆN BIÊN]: Token hết hạn/đã dùng, mất mạng, rate limit; không log/lưu mật khẩu
  //    hoặc token vào storage; không báo thành công trước phản hồi backend.
  if (complete)
    return (
      <div role="status" className="space-y-5">
        <CircleCheck aria-hidden="true" className="size-12 text-emerald-700" />
        <h2 className="text-xl font-semibold">{content.completed}</h2>
        <p className="text-sm leading-7 text-heritage-muted">{content.completedDetail}</p>
        <Link
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
          to={ROUTES.AUTH.LOGIN}
        >
          {content.login}
        </Link>
      </div>
    );
  return (
    <form
      noValidate
      onSubmit={handleSubmit(() => {
        reset();
        setVisible(false);
        setComplete(true);
      })}
      className="space-y-6"
    >
      {(["password", "confirmPassword"] as const).map((field) => (
        <div key={field}>
          <label htmlFor={`reset-${field}`} className="mb-2 block text-sm font-medium">
            {field === "password" ? content.password : content.confirm}
          </label>
          <div className="relative">
            <Input
              id={`reset-${field}`}
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              className="h-12 pr-14 text-sm"
              aria-invalid={Boolean(errors[field])}
              aria-describedby={errors[field] ? `reset-${field}-error` : "reset-password-hint"}
              {...register(field)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute right-1 top-1"
              aria-label={visible ? content.hide : content.show}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>
          {errors[field] && (
            <p id={`reset-${field}-error`} role="alert" className="mt-2 text-sm text-red-700">
              {errors[field]?.message}
            </p>
          )}
        </div>
      ))}
      <p id="reset-password-hint" className="text-xs text-heritage-muted">
        {content.hint}
      </p>
      <Button type="submit" size="lg" className="w-full">
        {content.submit}
      </Button>
      <Link
        className="flex min-h-11 items-center justify-center text-sm font-medium underline underline-offset-4"
        to={ROUTES.AUTH.LOGIN}
      >
        {content.login}
      </Link>
    </form>
  );
}
