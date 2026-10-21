import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock } from "lucide-react";
import type { z } from "zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { ekycService } from "../api/ekycService";
import {
  ekycDocumentSchema,
  ekycPurposeSchema,
  ekycReviewSchema,
  ocrDateForInput,
} from "../model/ekyc.schema";

/** Bản OCR chỉ ở RAM: sửa → gửi xác nhận → chuyển sang thử thách camera sau phản hồi BE. */
export function EkycReviewForm({
  document,
  purpose,
  turnId,
  confirmed,
  disabled,
  suggestedAddress = "",
  backSent = false,
  onConfirmed,
  onEdit,
}: {
  document: z.infer<typeof ekycDocumentSchema>;
  purpose: z.infer<typeof ekycPurposeSchema>;
  turnId?: string | null;
  confirmed: boolean;
  disabled: boolean;
  /** Nơi cư trú đọc từ mặt sau; chỉ điền khi ô địa chỉ đang trống, người dùng vẫn đối chiếu và sửa được. */
  suggestedAddress?: string;
  /** Đã gửi mặt sau thành công (kể cả khi chưa đọc được địa chỉ). */
  backSent?: boolean;
  onConfirmed: () => void;
  onEdit: () => void;
}) {
  const action = usePrivateAction();
  const prefix = useId();
  const [showId, setShowId] = useState(false);
  const defaults = {
    idNumber: document.idNumber,
    fullName: document.fullName,
    dateOfBirth: ocrDateForInput(document.dateOfBirth),
    residenceAddress: document.residenceAddress,
  };
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof ekycReviewSchema>>({
    resolver: zodResolver(ekycReviewSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: defaults,
  });
  // BR-88: thẻ gắn chip in địa chỉ ở mặt sau. Mặt sau đọc được thì điền giúp, nhưng không ghi đè địa chỉ đã có.
  useEffect(() => {
    if (suggestedAddress && !getValues("residenceAddress")) {
      setValue("residenceAddress", suggestedAddress, { shouldValidate: true, shouldDirty: true });
    }
  }, [suggestedAddress, getValues, setValue]);
  const addressFromBack = Boolean(suggestedAddress) && !defaults.residenceAddress;
  const addressMissing = !defaults.residenceAddress && !suggestedAddress;
  // Nguồn địa chỉ chỉ để người dùng biết gợi ý đến từ đâu; vẫn phải đối chiếu giấy tờ gốc.
  let addressSource = "Chưa có địa chỉ";
  if (defaults.residenceAddress) {
    addressSource = "Mặt trước thẻ";
  } else if (suggestedAddress) {
    addressSource = "Mặt sau thẻ";
  }
  let statusChip = "Có thể chỉnh sửa";
  let statusStyle = "bg-[#F1E7D0] text-[#7A5B24]";
  if (confirmed) {
    statusChip = "Đã gửi";
    statusStyle = "bg-green-100 text-green-800";
  }
  const textFields = [
    ["idNumber", "Số căn cước"],
    ["fullName", "Họ và tên"],
  ] as const;

  const fieldRows = [];
  for (const [name, label] of textFields) {
    let type = "text";
    if (name === "idNumber" && !showId) {
      type = "password";
    }
    let inputMode: "numeric" | undefined;
    if (name === "idNumber") {
      inputMode = "numeric";
    }
    fieldRows.push(
      <div key={name} className="min-w-0 space-y-2">
        <label htmlFor={`${prefix}-${name}`} className="text-sm font-semibold">
          {label}
        </label>
        <Input
          id={`${prefix}-${name}`}
          type={type}
          {...register(name)}
          readOnly={confirmed}
          className="min-h-11 w-full min-w-0"
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${prefix}-${name}-error` : undefined}
          inputMode={inputMode}
        />
        {errors[name] && (
          <p id={`${prefix}-${name}-error`} role="alert" className="text-sm text-destructive">
            {errors[name]?.message}
          </p>
        )}
      </div>,
    );
  }

  return (
    <form
      noValidate
      autoComplete="off"
      aria-label="Thông tin nhận diện"
      className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      onSubmit={handleSubmit(async (values) => {
        if (confirmed || !document.canMatchFace || !document.verificationId) return;
        await action.execute(
          () =>
            ekycService.confirmDocument({
              ...values,
              verificationId: document.verificationId!,
              purpose,
              ...(purpose === "BENEFICIARY_CLAIM" && turnId ? { handoverTurnId: turnId } : {}),
            }),
          () => {
            setShowId(false);
            onConfirmed();
          },
        );
      })}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-medium text-heritage-primary">Thông tin nhận diện</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>
          {statusChip}
        </span>
      </div>
      <p className="mt-4 text-sm text-heritage-muted">
        Đối chiếu với thẻ gốc trước khi tiếp tục. Bạn có thể sửa nếu máy đọc sai.
      </p>
      <fieldset disabled={disabled || action.pending} className="mt-4 min-w-0 space-y-4">
        {fieldRows}
        <Button
          type="button"
          variant="ghost"
          className="-mt-2 px-0 text-xs text-heritage-muted"
          aria-pressed={showId}
          onClick={() => setShowId(!showId)}
        >
          {showId ? "Ẩn số căn cước" : "Hiện số căn cước"}
        </Button>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <label htmlFor={`${prefix}-dateOfBirth`} className="text-sm font-semibold">
              Ngày sinh
            </label>
            <Input
              id={`${prefix}-dateOfBirth`}
              type="date"
              {...register("dateOfBirth")}
              readOnly={confirmed}
              className="min-h-11 w-full min-w-0"
              aria-invalid={Boolean(errors.dateOfBirth)}
              aria-describedby={errors.dateOfBirth ? `${prefix}-dateOfBirth-error` : undefined}
            />
            {errors.dateOfBirth && (
              <p
                id={`${prefix}-dateOfBirth-error`}
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold">Nguồn địa chỉ</p>
            <p className="flex min-h-11 items-center rounded-lg border border-heritage-border bg-heritage-canvas px-3 text-sm text-heritage-muted">
              {addressSource}
            </p>
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <label htmlFor={`${prefix}-residenceAddress`} className="text-sm font-semibold">
            Nơi cư trú / địa chỉ thường trú
          </label>
          <Textarea
            id={`${prefix}-residenceAddress`}
            {...register("residenceAddress")}
            readOnly={confirmed}
            rows={3}
            aria-invalid={Boolean(errors.residenceAddress)}
            aria-describedby={
              errors.residenceAddress ? `${prefix}-residenceAddress-error` : undefined
            }
          />
          {!confirmed && addressMissing && (
            <p className="text-sm text-heritage-muted">
              Căn cước gắn chip in địa chỉ ở mặt sau.{" "}
              {backSent
                ? "Chưa đọc được địa chỉ từ mặt sau; hãy nhập theo giấy tờ gốc hoặc gửi lại ảnh mặt sau rõ hơn."
                : "Thêm ảnh mặt sau thật nét ở tab Mặt sau để hệ thống điền giúp, hoặc tự nhập."}
            </p>
          )}
          {!confirmed && addressFromBack && (
            <p className="text-sm text-heritage-muted">
              Địa chỉ được đọc từ mặt sau. Hãy đối chiếu với giấy tờ gốc và sửa nếu sai.
            </p>
          )}
          {errors.residenceAddress && (
            <p
              id={`${prefix}-residenceAddress-error`}
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.residenceAddress.message}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          {confirmed && (
            <Button type="button" variant="outline" size="lg" onClick={onEdit}>
              Chỉnh sửa lại
            </Button>
          )}
          {!confirmed && (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  reset(defaults);
                  setShowId(false);
                }}
              >
                Khôi phục thông tin OCR
              </Button>
              <Button
                type="submit"
                size="lg"
                className="flex-1 justify-between bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
                disabled={!document.canMatchFace || !document.verificationId}
              >
                {action.pending ? "Đang xác nhận…" : "Tiếp tục so khớp mặt"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      </fieldset>
      {!document.canMatchFace && (
        <p role="alert" className="mt-4 text-sm">
          Ảnh chưa có khuôn mặt rõ. Bắt đầu lại với ảnh giấy tờ rõ hơn.
        </p>
      )}
      {(document.identityMatch === "WRONG_PERSON" || document.identityMatch === "NEEDS_REVIEW") && (
        <p role="alert" className="mt-4 text-sm">
          Kết quả từ ảnh chưa khớp hồ sơ người nhận. Việc sửa thông tin không thay kết quả đối chiếu
          ảnh; cần chụp lại giấy tờ rõ hơn.
        </p>
      )}
      {action.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {action.error}
        </p>
      )}
      {confirmed && (
        <p role="status" className="mt-4 text-sm">
          Máy chủ đã nhận bản thông tin xác nhận.
        </p>
      )}
      <p className="mt-4 flex items-start gap-2 text-xs text-heritage-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Thông tin được gợi ý từ ảnh. Hãy kiểm tra từng ô trước khi tiếp tục.
      </p>
    </form>
  );
}
