import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  role: z.enum(["VERIFIER", "ADMIN"]),
  phone: z.string().trim().max(32).optional(),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

const CARD_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CARD_MAX_BYTES = 2 * 1024 * 1024;

interface AdminCreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onDone: (user: AdminUser) => void;
}

/**
 * Hộp thoại tạo tài khoản nhân sự mới (Người xét duyệt, Quản trị viên). Không tạo tài khoản Người thực hiện:
 * Executor là người ngoài do Owner mời theo từng kho (ROLE-02).
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

  const role = useWatch({ control: form.control, name: "role" });
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  // Tài khoản đã tạo nhưng chưa tải được ảnh thẻ: bấm lại chỉ tải ảnh, không tạo lần hai.
  const [createdUser, setCreatedUser] = useState<AdminUser | null>(null);

  const onPickCard = (file: File | null) => {
    setCardFile(file);
    if (file === null) {
      setCardError(null);
      return;
    }
    if (!CARD_TYPES.includes(file.type)) {
      setCardError("Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
      return;
    }
    if (file.size > CARD_MAX_BYTES) {
      setCardError("Ảnh tối đa 2 MB.");
      return;
    }
    setCardError(null);
  };

  const onSubmit = (values: CreateUserInput) => {
    const needCard = values.role === "VERIFIER";
    if (needCard && cardFile === null) {
      setCardError("Vui lòng tải ảnh thẻ công chứng viên.");
      return;
    }
    if (cardError !== null) {
      return;
    }
    void execute(
      async () => {
        const user = createdUser ?? (await adminService.createUser(values));
        setCreatedUser(user);
        if (needCard && cardFile !== null) {
          await adminService.uploadNotaryCard(user.id, cardFile);
        }
        return user;
      },
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
            Cấp tài khoản cho Người xét duyệt hoặc Quản trị viên. Tài khoản được kích hoạt ngay.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="create-user-fullname"
              className="block text-sm font-medium text-heritage-text"
            >
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
            <label
              htmlFor="create-user-email"
              className="block text-sm font-medium text-heritage-text"
            >
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
            <label
              htmlFor="create-user-role"
              className="block text-sm font-medium text-heritage-text"
            >
              Vai trò hệ thống <span className="text-destructive">*</span>
            </label>
            <select
              id="create-user-role"
              {...form.register("role")}
              className="mt-1 min-h-11 w-full rounded-lg border border-heritage-border bg-white px-3 text-sm"
            >
              <option value="VERIFIER">Người xét duyệt (VERIFIER)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="create-user-password"
                className="block text-sm font-medium text-heritage-text"
              >
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
            <label
              htmlFor="create-user-phone"
              className="block text-sm font-medium text-heritage-text"
            >
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

          {role === "VERIFIER" && (
            <>
              <div>
                <label
                  htmlFor="create-user-notary-card"
                  className="block text-sm font-medium text-heritage-text"
                >
                  Ảnh thẻ công chứng viên <span className="text-destructive">*</span>
                </label>
                <input
                  id="create-user-notary-card"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => onPickCard(event.target.files?.[0] ?? null)}
                  aria-invalid={cardError !== null}
                  disabled={pending}
                  className="mt-1 block w-full text-sm file:mr-3 file:min-h-9 file:rounded-lg file:border file:border-heritage-border file:bg-white file:px-3 file:text-sm"
                />
                <p className="mt-1 text-xs text-heritage-muted">
                  JPEG, PNG hoặc WebP, tối đa 2 MB.
                </p>
                {cardError && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {cardError}
                  </p>
                )}
              </div>
            </>
          )}

          {createdUser && (
            <p className="text-xs text-heritage-muted">
              Tài khoản đã được tạo, chỉ còn tải ảnh thẻ. Bấm lại để thử tải ảnh.
            </p>
          )}

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
