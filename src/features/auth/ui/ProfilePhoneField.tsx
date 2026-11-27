import { useState } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { phoneService } from "@/entities/user";
import { setUser } from "@/entities/user/model/authSlice";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
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
import { buttonStyles } from "@/shared/ui/heritageKit";
import { contactPhoneSchema, PHONE_SHARING_HINT } from "../model/phone.schema";

const phoneFormSchema = z.object({ phone: contactPhoneSchema });
type PhoneFormInput = z.input<typeof phoneFormSchema>;

interface PhoneDialogProps {
  current: string;
  onClose: () => void;
}

/**
 * Hộp thoại thêm hoặc sửa số điện thoại. Chỉ cập nhật phiên sau khi Backend xác nhận (không optimistic); số bị
 * tài khoản khác dùng hiện đúng câu Backend trả. Luật kiểm giống lúc đăng ký: bắt buộc, tối đa 20 ký tự, không
 * kiểm đầu số.
 */
function PhoneDialog({ current, onClose }: PhoneDialogProps) {
  const dispatch = useDispatch();
  const action = usePrivateAction();
  const form = useForm<PhoneFormInput>({
    resolver: zodResolver(phoneFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { phone: current },
  });
  const phoneError = form.formState.errors.phone?.message;

  const onSubmit = form.handleSubmit((values) => {
    const next = phoneFormSchema.parse(values).phone;
    // Số không đổi thì không cần gọi Backend.
    if (next === current) {
      onClose();
      return;
    }
    void action.execute(
      () => phoneService.set(next),
      (updated) => {
        dispatch(setUser(updated));
        onClose();
      },
    );
  });

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="max-w-md bg-heritage-surface p-7" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-heritage-primary">
            {current ? "Sửa số điện thoại" : "Thêm số điện thoại"}
          </DialogTitle>
          <DialogDescription className="text-heritage-muted">
            {PHONE_SHARING_HINT}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium">
              Số điện thoại
            </label>
            <Input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0912345678"
              className="mt-1"
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? "profile-phone-error" : undefined}
              disabled={action.pending}
              {...form.register("phone", { onChange: () => action.reset() })}
            />
            {phoneError && (
              <p id="profile-phone-error" role="alert" className="mt-1 text-sm text-destructive">
                {phoneError}
              </p>
            )}
          </div>
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
              Hủy
            </Button>
            <Button type="submit" disabled={action.pending}>
              {action.pending ? "Đang lưu…" : "Lưu số điện thoại"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ô "Số điện thoại" trong hồ sơ cá nhân kèm nút thêm hoặc sửa. Dùng chung cho mọi vai trò có trang Cài đặt
 * (Backend `PUT /me/phone` không phân vai).
 */
export function ProfilePhoneField({ phone }: { phone: string | undefined }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <dt className="text-sm text-heritage-muted">Số điện thoại</dt>
      <dd className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium">
        <span className="break-words">{phone || "Chưa có thông tin"}</span>
        <button type="button" className={buttonStyles.outline} onClick={() => setOpen(true)}>
          {phone ? "Sửa số" : "Thêm số"}
        </button>
      </dd>
      {open && <PhoneDialog current={phone ?? ""} onClose={() => setOpen(false)} />}
    </div>
  );
}
