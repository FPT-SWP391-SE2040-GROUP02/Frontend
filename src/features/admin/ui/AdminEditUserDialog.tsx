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
import { isVietnamesePhone, VIETNAM_PHONE_MESSAGE } from "@/shared/lib/vietnamPhone";
import { adminService } from "../api/adminService";
import type { AdminUser, AdminUserDetail } from "../model/admin.schema";
import { useAdminAction } from "../model/useAdminAction";

const editProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ và tên.")
    .max(200, "Họ và tên tối đa 200 ký tự.")
    .regex(/^[\p{L}\s]+$/u, "Họ và tên chỉ được chứa chữ cái và khoảng trắng."),
  phone: z
    .string()
    .trim()
    .max(32)
    .refine((text) => text === "" || isVietnamesePhone(text), VIETNAM_PHONE_MESSAGE),
  practiceCertificateNumber: z.string().trim().max(64, "Tối đa 64 ký tự."),
  lawyerCardNumber: z.string().trim().max(64, "Tối đa 64 ký tự."),
});
type EditProfileInput = z.infer<typeof editProfileSchema>;

interface AdminEditUserDialogProps {
  open: boolean;
  user: AdminUserDetail;
  onClose: () => void;
  onDone: (user: AdminUser) => void;
}

/**
 * Hộp thoại Admin sửa thông tin của một tài khoản nhân sự (Người xét duyệt, Người thực thi hệ thống, Quản trị viên):
 * họ tên, số điện thoại, số chứng chỉ hành nghề và số thẻ luật sư. Hai số sau chỉ hiện với Người xét duyệt và Người thực
 * thi. Chủ tài sản không thuộc phạm vi này. Để trống ô tùy chọn thì xóa giá trị cũ.
 */
export function AdminEditUserDialog({ open, user, onClose, onDone }: AdminEditUserDialogProps) {
  const { execute, pending, error } = useAdminAction();
  const form = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: user.fullName,
      phone: user.phone ?? "",
      practiceCertificateNumber: user.practiceCertificateNumber ?? "",
      lawyerCardNumber: user.lawyerCardNumber ?? "",
    },
  });
  const errors = form.formState.errors;
  const showCertificates = user.role === "VERIFIER" || user.role === "EXECUTOR";

  const onSubmit = (values: EditProfileInput) => {
    void execute(
      () => adminService.updateUserProfile(user.id, values),
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
          <DialogTitle>Sửa thông tin tài khoản</DialogTitle>
          <DialogDescription>
            {user.email}. Email và vai trò không đổi ở đây. Ô tùy chọn để trống thì xóa giá trị cũ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="edit-user-fullname"
              className="block text-sm font-medium text-heritage-text"
            >
              Họ và tên <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-user-fullname"
              autoComplete="off"
              {...form.register("fullName")}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "edit-user-fullname-error" : undefined}
              className="mt-1"
            />
            {errors.fullName && (
              <p
                id="edit-user-fullname-error"
                role="alert"
                className="mt-1 text-sm text-destructive"
              >
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-user-phone"
              className="block text-sm font-medium text-heritage-text"
            >
              Số điện thoại <span className="text-sm text-heritage-muted">(không bắt buộc)</span>
            </label>
            <Input
              id="edit-user-phone"
              type="tel"
              autoComplete="off"
              {...form.register("phone")}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "edit-user-phone-error" : undefined}
              className="mt-1"
              placeholder="0912345678"
            />
            {errors.phone && (
              <p id="edit-user-phone-error" role="alert" className="mt-1 text-sm text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          {showCertificates && (
            <>
              <div>
                <label
                  htmlFor="edit-user-certificate"
                  className="block text-sm font-medium text-heritage-text"
                >
                  Số chứng chỉ hành nghề{" "}
                  <span className="text-sm text-heritage-muted">(không bắt buộc)</span>
                </label>
                <Input
                  id="edit-user-certificate"
                  autoComplete="off"
                  {...form.register("practiceCertificateNumber")}
                  aria-invalid={Boolean(errors.practiceCertificateNumber)}
                  className="mt-1"
                />
                {errors.practiceCertificateNumber && (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {errors.practiceCertificateNumber.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="edit-user-lawyer-card"
                  className="block text-sm font-medium text-heritage-text"
                >
                  Số thẻ luật sư{" "}
                  <span className="text-sm text-heritage-muted">(không bắt buộc)</span>
                </label>
                <Input
                  id="edit-user-lawyer-card"
                  autoComplete="off"
                  {...form.register("lawyerCardNumber")}
                  aria-invalid={Boolean(errors.lawyerCardNumber)}
                  className="mt-1"
                />
                {errors.lawyerCardNumber && (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {errors.lawyerCardNumber.message}
                  </p>
                )}
              </div>
            </>
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
              {pending ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
