import { useState, type ComponentProps, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Input } from "@/shared/ui/input";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { vaultPinService } from "../api/vaultPinService";
import { PIN_LENGTH } from "../model/pinRules";
import {
  changePinFormSchema,
  enterPinFormSchema,
  resetPinFormSchema,
  setPinFormSchema,
  type ChangePinFormValues,
  type EnterPinFormValues,
  type ResetPinFormValues,
  type SetPinFormValues,
  type VaultPinStatus,
} from "../model/vaultPin.schema";

const LABEL = "block text-sm font-semibold";
const FIELD = "min-h-11 bg-white font-normal tracking-[0.3em] placeholder:tracking-normal";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} role="alert" className="block text-sm font-normal text-destructive">
      {message}
    </span>
  );
}

function ServerError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-heritage-danger-bg px-3 py-2 text-sm text-heritage-danger"
    >
      {message}
    </p>
  );
}

interface PinFieldProps extends Omit<
  ComponentProps<"input">,
  "type" | "inputMode" | "maxLength" | "autoComplete"
> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

/** Ô nhập mã PIN 6 chữ số: ẩn ký tự, bàn phím số, không cho trình duyệt tự điền. */
export function PinField({ id, label, hint, error, ...props }: PinFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <Input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={PIN_LENGTH}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={FIELD}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-heritage-muted">{hint}</span>}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

interface FormActionsProps {
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
}

function FormActions({
  submitLabel,
  pendingLabel,
  pending,
  onCancel,
  cancelLabel = "Hủy",
}: FormActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-3 pt-1">
      {onCancel && (
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={pending}
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
      )}
      <button type="submit" className={buttonStyles.dark} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </div>
  );
}

interface PinBoxFieldProps extends Omit<
  ComponentProps<"input">,
  "type" | "inputMode" | "maxLength" | "autoComplete" | "value"
> {
  id: string;
  label: string;
  /** Giá trị đang nhập, để vẽ từng ô. */
  value: string;
  error?: string;
}

/**
 * Ô nhập mã PIN dạng sáu ô vuông. Bên dưới vẫn là MỘT ô nhập thật (trong suốt, phủ lên các ô) nên bàn phím số, dán,
 * trình đọc màn hình và form hoạt động như ô nhập thường; sáu ô chỉ để vẽ.
 */
export function PinBoxField({
  id,
  label,
  value,
  error,
  onFocus,
  onBlur,
  ...props
}: PinBoxFieldProps) {
  const [focused, setFocused] = useState(false);
  const errorId = `${id}-error`;
  const boxes: ReactNode[] = [];
  for (let index = 0; index < PIN_LENGTH; index += 1) {
    let boxStyle = "border-heritage-border";
    if (focused && index === Math.min(value.length, PIN_LENGTH - 1)) {
      boxStyle = "border-heritage-gold ring-2 ring-heritage-gold/40";
    }
    let mark = "";
    if (index < value.length) {
      mark = "•";
    }
    boxes.push(
      <span
        key={index}
        className={`flex h-14 items-center justify-center rounded-xl border bg-white text-2xl ${boxStyle}`}
      >
        {mark}
      </span>,
    );
  }
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <div className="grid grid-cols-6 gap-2" aria-hidden="true">
          {boxes}
        </div>
        <input
          id={id}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={PIN_LENGTH}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="absolute inset-0 size-full cursor-text opacity-0"
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

interface EnterPinFormProps {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  onForgot: () => void;
  /** Chữ trên nút gửi; mặc định "Xác nhận", mở khóa xem tài sản dùng "Mở khóa". */
  submitLabel?: string;
  /** Dòng nhắc dưới sáu ô, ví dụ số lần thử còn lại sau khi nhập sai. */
  notice?: string;
}

/** Nhập PIN hiện tại. Chưa gọi API: người gọi gửi lại request gốc kèm PIN này. */
export function EnterPinForm({
  onSubmit,
  onCancel,
  onForgot,
  submitLabel = "Xác nhận",
  notice,
}: EnterPinFormProps) {
  const form = useForm<EnterPinFormValues>({
    resolver: zodResolver(enterPinFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { pin: "" },
  });
  const errors = form.formState.errors;
  const pin = useWatch({ control: form.control, name: "pin" });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => onSubmit(values.pin))}
    >
      <PinBoxField
        id="vault-pin-enter"
        label="Mã PIN bảo vệ"
        value={pin ?? ""}
        autoFocus
        error={errors.pin?.message}
        {...form.register("pin")}
      />
      {notice && <p className="text-sm text-heritage-warning">{notice}</p>}
      <FormActions
        submitLabel={submitLabel}
        pendingLabel="Đang xử lý…"
        pending={false}
        onCancel={onCancel}
      />
      <div className="border-t border-heritage-border pt-3">
        <button
          type="button"
          className="min-h-9 text-sm font-medium underline underline-offset-4"
          onClick={onForgot}
        >
          Quên mã PIN?
        </button>
      </div>
    </form>
  );
}

interface SetPinFormProps {
  vaultId: string;
  /** Gọi sau khi Backend xác nhận; kèm PIN vừa đặt để người gọi gửi lại request đang chờ. */
  onDone: (pin: string, status: VaultPinStatus) => void;
  onCancel?: () => void;
  cancelLabel?: string;
}

/** Đặt PIN lần đầu cho kho. */
export function SetPinForm({ vaultId, onDone, onCancel, cancelLabel }: SetPinFormProps) {
  const action = usePrivateAction();
  const form = useForm<SetPinFormValues>({
    resolver: zodResolver(setPinFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { pin: "", confirmPin: "" },
  });
  const errors = form.formState.errors;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        void action.execute(
          () => vaultPinService.set(vaultId, values),
          (status) => onDone(values.pin, status),
        );
      })}
    >
      <PinField
        id="vault-pin-set"
        label="Mã PIN mới"
        hint="Đúng 6 chữ số, không dùng số giống nhau hoặc dãy liên tiếp."
        autoFocus
        error={errors.pin?.message}
        {...form.register("pin")}
      />
      <PinField
        id="vault-pin-set-confirm"
        label="Nhập lại mã PIN"
        error={errors.confirmPin?.message}
        {...form.register("confirmPin")}
      />
      <ServerError message={action.error} />
      <FormActions
        submitLabel="Đặt mã PIN"
        pendingLabel="Đang lưu…"
        pending={action.pending}
        onCancel={onCancel}
        cancelLabel={cancelLabel}
      />
    </form>
  );
}

interface ChangePinFormProps {
  vaultId: string;
  onDone: (status: VaultPinStatus) => void;
  onCancel: () => void;
}

/** Đổi PIN khi còn nhớ PIN cũ. */
export function ChangePinForm({ vaultId, onDone, onCancel }: ChangePinFormProps) {
  const action = usePrivateAction();
  const form = useForm<ChangePinFormValues>({
    resolver: zodResolver(changePinFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { currentPin: "", newPin: "", confirmPin: "" },
  });
  const errors = form.formState.errors;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        void action.execute(() => vaultPinService.change(vaultId, values), onDone);
      })}
    >
      <PinField
        id="vault-pin-current"
        label="Mã PIN hiện tại"
        autoFocus
        error={errors.currentPin?.message}
        {...form.register("currentPin")}
      />
      <PinField
        id="vault-pin-new"
        label="Mã PIN mới"
        hint="Đúng 6 chữ số, không dùng số giống nhau hoặc dãy liên tiếp."
        error={errors.newPin?.message}
        {...form.register("newPin")}
      />
      <PinField
        id="vault-pin-new-confirm"
        label="Nhập lại mã PIN mới"
        error={errors.confirmPin?.message}
        {...form.register("confirmPin")}
      />
      <ServerError message={action.error} />
      <FormActions
        submitLabel="Đổi mã PIN"
        pendingLabel="Đang lưu…"
        pending={action.pending}
        onCancel={onCancel}
      />
    </form>
  );
}

interface ForgotPinFormProps {
  vaultId: string;
  /** Kèm PIN mới để người gọi gửi lại request đang chờ (nếu có). */
  onDone: (pin: string, status: VaultPinStatus) => void;
  onCancel: () => void;
}

/** Quên PIN: nhập mật khẩu tài khoản và PIN mới, đặt lại ngay. */
export function ForgotPinForm({ vaultId, onDone, onCancel }: ForgotPinFormProps) {
  const action = usePrivateAction();
  const form = useForm<ResetPinFormValues>({
    resolver: zodResolver(resetPinFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { password: "", newPin: "", confirmPin: "" },
  });
  const errors = form.formState.errors;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        void action.execute(
          () => vaultPinService.reset(vaultId, values),
          (status) => onDone(values.newPin, status),
        );
      })}
    >
      <div className="space-y-1.5">
        <label htmlFor="vault-pin-forgot-password" className={LABEL}>
          Mật khẩu tài khoản
        </label>
        <Input
          id="vault-pin-forgot-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          maxLength={128}
          className="min-h-11 bg-white font-normal"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "vault-pin-forgot-password-error" : undefined}
          {...form.register("password")}
        />
        <FieldError id="vault-pin-forgot-password-error" message={errors.password?.message} />
      </div>
      <PinField
        id="vault-pin-forgot-new"
        label="Mã PIN mới"
        hint="Đúng 6 chữ số, không dùng số giống nhau hoặc dãy liên tiếp."
        error={errors.newPin?.message}
        {...form.register("newPin")}
      />
      <PinField
        id="vault-pin-forgot-confirm"
        label="Nhập lại mã PIN mới"
        error={errors.confirmPin?.message}
        {...form.register("confirmPin")}
      />
      <ServerError message={action.error} />
      <FormActions
        submitLabel="Đặt lại mã PIN"
        pendingLabel="Đang lưu…"
        pending={action.pending}
        onCancel={onCancel}
      />
    </form>
  );
}
