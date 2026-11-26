import { useController, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Input } from "@/shared/ui/input";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { vaultPinService } from "../api/vaultPinService";
import { PIN_LENGTH } from "../model/pinRules";
import {
  changePinFormSchema,
  resetPinFormSchema,
  setPinFormSchema,
  type ChangePinFormValues,
  type ResetPinFormValues,
  type SetPinFormValues,
  type VaultPinStatus,
} from "../model/vaultPin.schema";
import { NewPinPair } from "./NewPinPair";
import { PinDotsField } from "./PinDotsField";
import { PinKeypad } from "./PinKeypad";

const LABEL = "block text-center text-sm font-semibold text-heritage-primary";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span
      id={id}
      role="alert"
      className="block text-center text-sm font-medium text-heritage-danger"
    >
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
  /** Câu báo PIN vừa nhập chưa đúng. */
  error?: string;
  onSubmit: (pin: string) => void;
  onForgot: () => void;
}

/** Nhập PIN hiện tại bằng bàn phím số. Chưa gọi API: người gọi gửi lại request gốc kèm PIN này. */
export function EnterPinForm({ error, onSubmit, onForgot }: EnterPinFormProps) {
  return (
    <div className="space-y-3">
      <PinKeypad error={error} onSubmit={onSubmit} />
      <div className="border-t border-heritage-border pt-1 text-center">
        <button
          type="button"
          className="min-h-11 px-3 text-sm font-medium text-heritage-gold-hover underline underline-offset-4"
          onClick={onForgot}
        >
          Quên mã PIN?
        </button>
      </div>
    </div>
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
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { pin: "", confirmPin: "" },
  });
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
      <NewPinPair
        form={form}
        pinName="pin"
        confirmName="confirmPin"
        idPrefix="vault-pin-set"
        confirmLabel="Nhập lại mã PIN"
        autoFocus
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

/** Ô PIN đang dùng ở form đổi PIN; đủ 6 số thì sang ô mã mới. Đúng hay sai do Backend kiểm lúc lưu. */
function CurrentPinField({ form }: { form: UseFormReturn<ChangePinFormValues> }) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control: form.control, name: "currentPin" });
  return (
    <PinDotsField
      ref={ref}
      id="vault-pin-current"
      label="Mã PIN hiện tại"
      autoFocus
      value={value}
      error={fieldState.error?.message}
      onBlur={onBlur}
      onChange={(digits) => {
        onChange(digits);
        form.clearErrors("currentPin");
        if (digits.length === PIN_LENGTH) form.setFocus("newPin");
      }}
    />
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
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { currentPin: "", newPin: "", confirmPin: "" },
  });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        void action.execute(() => vaultPinService.change(vaultId, values), onDone);
      })}
    >
      <CurrentPinField form={form} />
      <NewPinPair
        form={form}
        pinName="newPin"
        confirmName="confirmPin"
        idPrefix="vault-pin-change"
        confirmLabel="Nhập lại mã PIN mới"
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
    mode: "onSubmit",
    reValidateMode: "onSubmit",
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
          className="min-h-11 rounded-xl bg-white font-normal"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "vault-pin-forgot-password-error" : undefined}
          {...form.register("password", { onChange: () => form.clearErrors("password") })}
        />
        <FieldError id="vault-pin-forgot-password-error" message={errors.password?.message} />
      </div>
      <NewPinPair
        form={form}
        pinName="newPin"
        confirmName="confirmPin"
        idPrefix="vault-pin-forgot"
        confirmLabel="Nhập lại mã PIN mới"
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
