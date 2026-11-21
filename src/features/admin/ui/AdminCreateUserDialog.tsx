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

const createUserSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập họ và tên.")
      .max(200)
      .regex(/^[\p{L}\s]+$/u, "Họ và tên chỉ được chứa chữ cái và khoảng trắng."),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email.")
      .email("Địa chỉ email không hợp lệ.")
      .max(256),
    password: z.string().max(128).optional(),
    role: z.enum(["VERIFIER", "EXECUTOR", "ADMIN"]),
    phone: z.string().trim().max(32).optional(),
  })
  .superRefine((data, ctx) => {
    // Quản trị viên bắt buộc mật khẩu khởi tạo; Người xét duyệt / Người thực thi nhận thư mời đặt mật khẩu qua email.
    if (data.role === "ADMIN" && (data.password ?? "").length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Mật khẩu phải có ít nhất 8 ký tự.",
      });
    }
  });

type CreateUserInput = z.infer<typeof createUserSchema>;

type StepKey = "account" | "card";
const STEPS_BY_ROLE: Record<"VERIFIER" | "EXECUTOR" | "ADMIN", StepKey[]> = {
  ADMIN: ["account"],
  VERIFIER: ["account", "card"],
  EXECUTOR: ["account", "card"],
};
const STEP_LABELS: Record<StepKey, string> = {
  account: "Tài khoản",
  card: "Ảnh thẻ",
};
const ACCOUNT_FIELDS = ["fullName", "email", "password", "phone", "role"] as const;

const CARD_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CARD_MAX_BYTES = 2 * 1024 * 1024;

interface AdminCreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onDone: (user: AdminUser) => void;
}

/**
 * Hộp thoại tạo tài khoản nhân sự mới (Người xét duyệt, Người thực thi hệ thống, Quản trị viên).
 * Người xét duyệt và Người thực thi chỉ bắt buộc ảnh thẻ (bằng chứng xác minh), không nhập số thẻ hay chứng chỉ.
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
  // Form dài nên tách bước theo vai trò: Admin 1 bước, Người xét duyệt và Người thực thi 2 bước (thêm ảnh thẻ).
  const [stepIndex, setStepIndex] = useState(0);
  const steps = STEPS_BY_ROLE[role];
  const stepKey = steps[Math.min(stepIndex, steps.length - 1)];
  const isLastStep = stepIndex >= steps.length - 1;
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

  const goNext = async () => {
    // Chỉ kiểm các ô của bước đang xem để người dùng không bị báo lỗi ở bước chưa tới.
    if (stepKey === "account" && !(await form.trigger([...ACCOUNT_FIELDS]))) {
      return;
    }
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const onSubmit = (values: CreateUserInput) => {
    if (!isLastStep) {
      void goNext();
      return;
    }
    // Ảnh thẻ là bằng chứng xác minh: Người xét duyệt và Người thực thi đều dùng thẻ luật sư và bắt buộc.
    const needCard = values.role === "VERIFIER" || values.role === "EXECUTOR";
    if (needCard && cardFile === null) {
      setCardError(
        values.role === "EXECUTOR"
          ? "Vui lòng tải ảnh thẻ luật sư hoặc chứng chỉ hành nghề."
          : "Vui lòng tải ảnh thẻ luật sư.",
      );
      return;
    }
    if (cardError !== null) {
      return;
    }
    void execute(
      async () => {
        const user =
          createdUser ??
          (await adminService.createUser({
            ...values,
            // Không gửi mật khẩu cho vai trò nhận thư mời; Backend gửi link đặt mật khẩu tới email.
            password: values.role === "ADMIN" ? values.password : undefined,
          }));
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
            Cấp tài khoản cho Người xét duyệt, Người thực thi hệ thống hoặc Quản trị viên. Tài khoản
            được kích hoạt ngay.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {steps.length > 1 && (
            <ol
              aria-label="Các bước tạo tài khoản"
              className="flex flex-wrap items-center gap-2 text-xs"
            >
              {steps.map((key, index) => (
                <li
                  key={key}
                  aria-current={index === stepIndex ? "step" : undefined}
                  className={
                    index === stepIndex
                      ? "whitespace-nowrap rounded-full bg-heritage-primary px-3 py-1 font-semibold text-white"
                      : "whitespace-nowrap rounded-full bg-heritage-sunken px-3 py-1 text-heritage-muted"
                  }
                >
                  {index + 1}. {STEP_LABELS[key]}
                </li>
              ))}
            </ol>
          )}
          {stepKey === "account" && (
            <>
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
                  <p role="alert" className="mt-1 text-sm text-destructive">
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
                  <p role="alert" className="mt-1 text-sm text-destructive">
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
                  <option value="EXECUTOR">Người thực thi hệ thống (EXECUTOR)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>

              {role === "ADMIN" && (
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
                      className="text-sm text-heritage-gold hover:underline"
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
                    <p role="alert" className="mt-1 text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="create-user-phone"
                  className="block text-sm font-medium text-heritage-text"
                >
                  Số điện thoại{" "}
                  <span className="text-sm text-heritage-muted">(không bắt buộc)</span>
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
            </>
          )}

          {stepKey === "card" && (
            <>
              <div>
                <label
                  htmlFor="create-user-notary-card"
                  className="block text-sm font-medium text-heritage-text"
                >
                  {role === "EXECUTOR"
                    ? "Ảnh thẻ luật sư / chứng chỉ hành nghề"
                    : "Ảnh thẻ luật sư"}{" "}
                  <span className="text-destructive">*</span>
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
                <p className="mt-1 text-sm text-heritage-muted">
                  {cardFile ? `Đã chọn: ${cardFile.name}. ` : ""}JPEG, PNG hoặc WebP, tối đa 2 MB.
                  {role === "EXECUTOR" &&
                    " Có ảnh thì Người thực thi mới được tính là đã xác minh pháp lý; Chủ kho chỉ thấy huy hiệu, không thấy ảnh."}
                </p>
                {cardError && (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {cardError}
                  </p>
                )}
              </div>
            </>
          )}

          {createdUser && (
            <p className="text-sm text-heritage-muted">
              Tài khoản đã được tạo, chỉ còn tải ảnh thẻ. Bấm lại để thử tải ảnh.
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-3">
            {stepIndex > 0 && !createdUser ? (
              <Button
                key="back"
                type="button"
                variant="outline"
                onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
                disabled={pending}
              >
                Quay lại
              </Button>
            ) : (
              <Button
                key="cancel"
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={pending}
              >
                Hủy
              </Button>
            )}
            {/* key riêng cho từng nút: React không dùng lại cùng một nút DOM khi đổi giữa "Tiếp tục" (type=button) và
                "Tạo tài khoản" (type=submit), nếu không cú bấm Tiếp tục đổi nút thành submit và gửi form ngay. */}
            {isLastStep ? (
              <Button key="submit" type="submit" disabled={pending}>
                {pending ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            ) : (
              <Button key="next" type="button" onClick={() => void goNext()} disabled={pending}>
                Tiếp tục
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
