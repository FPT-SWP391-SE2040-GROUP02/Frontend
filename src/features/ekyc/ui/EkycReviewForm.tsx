import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ekycService } from "../api/ekycService";
import {
  ekycDocumentSchema,
  ekycPurposeSchema,
  ekycReviewSchema,
  ocrDateForInput,
} from "../model/ekyc.schema";

/** Bản OCR chỉ ở RAM: sửa → gửi xác nhận → mở bước ảnh mặt sau sau phản hồi BE. */
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
  const fields = [
    ["fullName", "Họ và tên", "text"],
    ["dateOfBirth", "Ngày sinh", "date"],
    ["idNumber", "Số CCCD", showId ? "text" : "password"],
    ["residenceAddress", "Địa chỉ cư trú", "text"],
  ] as const;
  return (
    <form
      noValidate
      autoComplete="off"
      className="space-y-4 rounded-lg border border-heritage-border p-4"
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
      <h3 className="font-semibold">Dò và sửa thông tin giấy tờ</h3>
      <p className="text-sm text-heritage-muted">
        Đối chiếu với giấy tờ gốc, sửa các chỗ đọc sai rồi xác nhận gửi thông tin.
      </p>
      <fieldset disabled={disabled || action.pending} className="grid min-w-0 gap-4 sm:grid-cols-2">
        {fields.map(([name, label, type]) => (
          <div key={name} className="min-w-0 space-y-2">
            <label htmlFor={`${prefix}-${name}`} className="text-sm">
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
              inputMode={name === "idNumber" ? "numeric" : undefined}
            />
            {name === "residenceAddress" && !confirmed && addressMissing && (
              <p className="text-sm text-heritage-muted">
                Căn cước gắn chip in địa chỉ ở mặt sau.{" "}
                {backSent
                  ? "Chưa đọc được địa chỉ từ mặt sau; hãy nhập theo giấy tờ gốc hoặc gửi lại ảnh mặt sau rõ hơn."
                  : "Gửi ảnh mặt sau thật nét ở Bước 2 để hệ thống điền giúp, hoặc tự nhập."}
              </p>
            )}
            {name === "residenceAddress" && !confirmed && addressFromBack && (
              <p className="text-sm text-heritage-muted">
                Địa chỉ được đọc từ mặt sau. Hãy đối chiếu với giấy tờ gốc và sửa nếu sai.
              </p>
            )}
            {errors[name] && (
              <p id={`${prefix}-${name}-error`} role="alert" className="text-sm text-destructive">
                {errors[name]?.message}
              </p>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          aria-pressed={showId}
          onClick={() => setShowId(!showId)}
        >
          {showId ? "Ẩn số CCCD" : "Hiện số CCCD"}
        </Button>
        {confirmed ? (
          <Button type="button" variant="outline" className="min-h-11" onClick={onEdit}>
            Chỉnh sửa lại
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                reset(defaults);
                setShowId(false);
              }}
            >
              Khôi phục thông tin OCR
            </Button>
            <Button
              type="submit"
              className="min-h-11"
              disabled={!document.canMatchFace || !document.verificationId}
            >
              {action.pending ? "Đang xác nhận…" : "Xác nhận và gửi thông tin"}
            </Button>
          </>
        )}
      </fieldset>
      {!document.canMatchFace && (
        <p role="alert">Ảnh chưa có khuôn mặt rõ. Bắt đầu lại với ảnh giấy tờ rõ hơn.</p>
      )}
      {(document.identityMatch === "WRONG_PERSON" || document.identityMatch === "NEEDS_REVIEW") && (
        <p role="alert" className="text-sm">
          Kết quả từ ảnh chưa khớp hồ sơ người nhận. Việc sửa thông tin không thay kết quả đối chiếu
          ảnh; cần chụp lại giấy tờ rõ hơn.
        </p>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {confirmed && (
        <p role="status" className="text-sm">
          Máy chủ đã nhận bản thông tin xác nhận.
          {backSent ? "" : " Tiếp tục gửi ảnh mặt sau."}
        </p>
      )}
    </form>
  );
}
