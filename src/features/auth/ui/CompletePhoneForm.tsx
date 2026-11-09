import { phoneService } from "@/entities/user/api/phoneService";
import { setUser } from "@/entities/user/model/authSlice";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";
import { getLoginErrorMessage } from "../lib/loginFeedback";
import { PHONE_SHARING_HINT, contactPhoneSchema } from "../model/phone.schema";

const completePhoneSchema = z.object({ phone: contactPhoneSchema });

type CompletePhoneInput = z.infer<typeof completePhoneSchema>;

export interface CompletePhoneFormProps {
  /** Gọi sau khi lưu số thành công và phiên đã có số điện thoại. */
  onDone: () => void;
}

/**
 * Ô nhập số điện thoại cho tài khoản chưa có số (tạo bằng Google). Cùng quy tắc với ô số điện thoại lúc đăng ký.
 */
export function CompletePhoneForm({ onDone }: CompletePhoneFormProps) {
  const dispatch = useDispatch();
  const save = useMutation({ mutationFn: (phone: string) => phoneService.setPhone(phone) });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompletePhoneInput>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(completePhoneSchema),
  });

  const onSubmit = (data: CompletePhoneInput) => {
    if (save.isPending) return;
    save.mutate(data.phone, {
      onSuccess: (updated) => {
        dispatch(setUser(updated));
        onDone();
      },
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
      {save.isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mr-2 inline size-4" />
          {getLoginErrorMessage(save.error)}
        </div>
      )}
      <div className="space-y-1 text-left">
        <label
          htmlFor="complete-phone"
          className="text-sm font-medium text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]"
        >
          Số điện thoại
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#728574]" />
          <Input
            id="complete-phone"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={
              errors.phone ? "complete-phone-hint complete-phone-error" : "complete-phone-hint"
            }
            autoComplete="tel"
            inputMode="tel"
            disabled={save.isPending}
            {...register("phone")}
            type="tel"
            placeholder="0912 345 678"
            className="h-12 rounded-xl border-[#d8e3d2] bg-white pl-9 text-sm dark:border-[#1e422f] dark:bg-[#0c2217]"
          />
        </div>
        <p id="complete-phone-hint" className="text-sm text-heritage-muted">
          {PHONE_SHARING_HINT}
        </p>
        {errors.phone && (
          <p id="complete-phone-error" role="alert" className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={save.isPending}
        className="mt-2 h-12 w-full rounded-xl bg-[var(--heritage-primary,#0b291e)] text-sm font-medium text-white shadow-xs hover:bg-[#143e2d]"
      >
        {save.isPending ? "Đang lưu..." : "Lưu và tiếp tục"}
      </Button>
    </form>
  );
}
