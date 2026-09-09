import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { registerSchema, type RegisterFormData } from "../model/auth.schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Form Đăng ký tài khoản người dùng mới.
 * Tuân thủ Quy tắc 7: Để lại logic onSubmit cho developer tự hoàn thiện theo hướng dẫn // TODO.
 */
export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * @description Xử lý nộp form đăng ký
   * @param data Dữ liệu hợp lệ từ form
   */
  const onSubmit = async (_data: RegisterFormData) => {
    // TODO: 1. Gọi API đăng ký qua authService.register(_data)
    // TODO: 2. Hiển thị thông báo đăng ký thành công
    // TODO: 3. Điều hướng người dùng về trang Đăng nhập: navigate(ROUTES.AUTH.LOGIN)
  };

  return (
    <Card className="w-full shadow-lg border-border/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">Đăng Ký Tài Khoản</CardTitle>
        <CardDescription className="text-center">
          Tạo tài khoản mới để trải nghiệm các tính năng của hệ thống
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              placeholder="Nguyễn Văn A"
              {...register("fullName")}
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <p className="text-xs font-medium text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ten@fpt.edu.vn"
              {...register("email")}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại (tùy chọn)</Label>
            <Input
              id="phone"
              placeholder="0912345678"
              {...register("phone")}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-xs font-medium text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link to={ROUTES.AUTH.LOGIN} className="font-medium text-primary hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
