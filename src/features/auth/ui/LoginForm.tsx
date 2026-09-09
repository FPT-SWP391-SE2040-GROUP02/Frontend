import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { loginSchema, type LoginFormData } from "../model/auth.schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Form Đăng nhập tài khoản người dùng.
 * Tuân thủ Quy tắc 7: Để lại logic onSubmit cho developer tự hoàn thiện theo hướng dẫn // TODO.
 */
export function LoginForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  /**
   * @description Xử lý nộp form đăng nhập
   * @param _data Dữ liệu hợp lệ từ form
   */
  const onSubmit = async (_data: LoginFormData) => {
    // TODO: 1. Gọi API đăng nhập qua authService.login(_data) hoặc dispatch authThunk
    // TODO: 2. Lưu token vào storage (storage.setToken(response.token.accessToken))
    // TODO: 3. Hiển thị thông báo thành công (Toast notification)
    // TODO: 4. Điều hướng người dùng về trang chủ hoặc Dashboard: navigate(ROUTES.DASHBOARD.ROOT)
  };

  return (
    <Card className="w-full shadow-lg border-border/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">Đăng Nhập</CardTitle>
        <CardDescription className="text-center">
          Nhập thông tin tài khoản của bạn để tiếp tục
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
              <Link
                to={ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-xs text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setValue("rememberMe", !!checked)}
              disabled={isSubmitting}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Ghi nhớ đăng nhập
            </Label>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link to={ROUTES.AUTH.REGISTER} className="font-medium text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
