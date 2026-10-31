import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
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
  formatToDdMmYyyy,
  formatToIsoDate,
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
  frontUrl?: string | null;
  backUrl?: string | null;
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

  const addressMissing = !defaults.residenceAddress && !suggestedAddress;

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

    let inputPadding = "";
    let toggleLabel = "Hiện số căn cước";
    let toggleText = "Hiện";
    let toggleIcon = <Eye className="size-4" aria-hidden="true" />;

    if (name === "idNumber") {
      inputPadding = "pr-24";
    }

    if (showId) {
      toggleLabel = "Ẩn số căn cước";
      toggleText = "Ẩn";
      toggleIcon = <EyeOff className="size-4" aria-hidden="true" />;
    }

    fieldRows.push(
      <div key={name} className="min-w-0 space-y-2">
        <label htmlFor={`${prefix}-${name}`} className="text-sm font-semibold">
          {label}
        </label>
        <div className="relative">
          <Input
            id={`${prefix}-${name}`}
            type={type}
            {...register(name)}
            readOnly={confirmed}
            className={`min-h-11 w-full min-w-0 ${inputPadding}`}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? `${prefix}-${name}-error` : undefined}
            inputMode={inputMode}
          />

          {name === "idNumber" && (
            <button
              type="button"
              className="absolute inset-y-0 right-2 my-auto flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-heritage-primary hover:bg-heritage-primary/10 focus-visible:outline-2 focus-visible:outline-heritage-gold"
              aria-pressed={showId}
              aria-label={toggleLabel}
              onClick={() => setShowId(!showId)}
            >
              {toggleIcon}
              {toggleText}
            </button>
          )}
        </div>

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
              dateOfBirth: formatToIsoDate(values.dateOfBirth),
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
        Đối chiếu với thẻ gốc ở bên trái trước khi tiếp tục. Bạn có thể sửa nếu máy đọc sai.
      </p>

      <fieldset disabled={disabled || action.pending} className="mt-4 min-w-0 space-y-4">
        {fieldRows}

        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={`${prefix}-dateOfBirth`} className="text-sm font-semibold">
              Ngày sinh
            </label>
            <span className="text-xs text-heritage-muted">Định dạng DD/MM/YYYY</span>
          </div>

          <Input
            id={`${prefix}-dateOfBirth`}
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            {...register("dateOfBirth")}
            readOnly={confirmed}
            className="min-h-11 w-full min-w-0"
            aria-invalid={Boolean(errors.dateOfBirth)}
            aria-describedby={errors.dateOfBirth ? `${prefix}-dateOfBirth-error` : undefined}
          />

          {errors.dateOfBirth && (
            <p id={`${prefix}-dateOfBirth-error`} role="alert" className="text-sm text-destructive">
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={`${prefix}-dateOfExpiry`} className="text-sm font-semibold">
              Có giá trị đến / Date of expiry
            </label>
            <span className="text-xs text-heritage-muted">
              {document.dateOfExpiry ? "Thời hạn đọc từ thẻ" : "Không thời hạn hoặc không đọc được"}
            </span>
          </div>

          <Input
            id={`${prefix}-dateOfExpiry`}
            type="text"
            value={
              document.dateOfExpiry
                ? formatToDdMmYyyy(document.dateOfExpiry)
                : "Không thời hạn"
            }
            readOnly
            className="min-h-11 w-full min-w-0 bg-heritage-muted/10 text-heritage-muted cursor-not-allowed"
          />
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
                disabled={!document.canMatchFace || !document.verificationId || !backSent}
                aria-describedby={backSent ? undefined : `${prefix}-back-required`}
              >
                {action.pending ? "Đang xác nhận…" : "Tiếp tục so khớp mặt"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>

        {!confirmed && !backSent && (
          <p id={`${prefix}-back-required`} className="text-sm text-heritage-muted">
            Cần đọc mặt sau giấy tờ ở tab Mặt sau trước khi tiếp tục so khớp mặt.
          </p>
        )}
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
