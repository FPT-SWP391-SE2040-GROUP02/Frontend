import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { adminService } from "../api/adminService";
import type { AdminUser } from "../model/admin.schema";
import { useAdminAction } from "../model/useAdminAction";

const createUserSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên.").max(200),
  email: z.string().trim().email("Địa chỉ email không hợp lệ.").max(256),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự.").max(128),
  role: z.enum(["VERIFIER", "EXECUTOR", "ADMIN"]),
  phone: z.string().trim().max(32).optional(),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

interface AdminCreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onDone: (user: AdminUser) => void;
}

/**
 * Hộp thoại tạo tài khoản nhân sự mới (Công chứng viên, Người thừa hành, Quản trị viên).
 * Tài khoản được kích hoạt ngay lập tức (không cần chờ email verification).
 */
export function AdminCreateUserDialog({ open, onClose, onDone }: AdminCreateUserDialogProps) {
  const { execute, pending, error } = useAdminAction();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "VERIFIER",
      phone: "",
    },
  });

  const onSubmit = (values: CreateUserInput) => {
    void execute(
      () => adminService.createUser(values),
      (result) => {
        onDone(result);
        onClose();
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản hệ thống mới</DialogTitle>
          <DialogDescription>
            Cấp tài khoản cho Người xét duyệt (Công chứng viên), Người thừa hành hoặc Quản trị viên. Tài khoản được kích hoạt ngay.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="create-user-fullname" className="block text-sm font-medium text-heritage-text">
              Họ và tên <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-user-fullname"
              autoComplete="name"
              {...form.register("fullName")}
              aria-invalid={Boolean(form.formState.errors.fullName)}
              className="mt-1"
              placeholder="Nguyễn Văn A"
            />
            {form.formState.errors.fullName && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="create-user-email" className="block text-sm font-medium text-heritage-text">
              Email đăng nhập <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-user-email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
              aria-invalid={Boolean(form.formState.errors.email)}
              className="mt-1"
              placeholder="verifier@legacyvault.vn"
            />
            {form.formState.errors.email && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="create-user-role" className="block text-sm font-medium text-heritage-text">
              Vai trò hệ thống <span className="text-destructive">*</span>
            </label>
            <select
              id="create-user-role"
              {...form.register("role")}
              className="mt-1 min-h-11 w-full rounded-lg border border-heritage-border bg-white px-3 text-sm"
            >
              <option value="VERIFIER">Người xét duyệt (Công chứng viên - VERIFIER)</option>
              <option value="EXECUTOR">Người thừa hành (Giám hộ di sản - EXECUTOR)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="create-user-password" className="block text-sm font-medium text-heritage-text">
                Mật khẩu khởi tạo <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs text-heritage-gold hover:underline"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
            <Input
              id="create-user-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...form.register("password")}
              aria-invalid={Boolean(form.formState.errors.password)}
              className="mt-1"
              placeholder="Tối thiểu 8 ký tự"
            />
            {form.formState.errors.password && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="create-user-phone" className="block text-sm font-medium text-heritage-text">
              Số điện thoại <span className="text-xs text-heritage-muted">(không bắt buộc)</span>
            </label>
            <Input
              id="create-user-phone"
              type="tel"
              autoComplete="tel"
              {...form.register("phone")}
              className="mt-1"
              placeholder="0912345678"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Hủy
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
