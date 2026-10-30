import { type ComponentProps } from "react";
import { useForm } from "react-hook-form";
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
    <p role="alert" className="rounded-lg bg-[#F8E1DE] px-3 py-2 text-sm text-[#A32119]">
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

interface EnterPinFormProps {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  onForgot: () => void;
}

/** Nhập PIN hiện tại. Chưa gọi API: người gọi gửi lại request gốc kèm PIN này. */
export function EnterPinForm({ onSubmit, onCancel, onForgot }: EnterPinFormProps) {
  const form = useForm<EnterPinFormValues>({
    resolver: zodResolver(enterPinFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { pin: "" },
  });
  const errors = form.formState.errors;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => onSubmit(values.pin))}
    >
      <PinField
        id="vault-pin-enter"
        label="Mã PIN của kho"
        autoFocus
        error={errors.pin?.message}
        {...form.register("pin")}
      />
      <button
        type="button"
        className="min-h-11 text-sm font-medium underline underline-offset-4"
        onClick={onForgot}
      >
        Quên mã PIN?
      </button>
      <FormActions
        submitLabel="Xác nhận"
        pendingLabel="Đang xử lý…"
        pending={false}
        onCancel={onCancel}
      />
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
