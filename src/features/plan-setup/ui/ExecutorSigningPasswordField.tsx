import { useId } from "react";

interface ExecutorSigningPasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  /** Lỗi mật khẩu (sai, bị khóa, để trống); null thì không hiện. */
  error: string | null;
}

/** Ô mật khẩu tài khoản để ký nhận vai; chỉ nằm trong state của form, không lưu, không log. */
export function ExecutorSigningPasswordField({
  value,
  onChange,
  disabled,
  error,
}: ExecutorSigningPasswordFieldProps) {
  const inputId = useId();
  const errorId = useId();
  let describedBy: string | undefined;
  if (error) {
    describedBy = errorId;
  }
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-semibold">
        Mật khẩu tài khoản
      </label>
      <input
        id={inputId}
        type="password"
        autoComplete="current-password"
        maxLength={128}
        className="min-h-11 w-full rounded-xl border border-heritage-border bg-white px-4 text-sm"
        value={value}
        disabled={disabled}
        aria-invalid={error !== null}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-sm text-heritage-muted">Nhập mật khẩu để ký nhận vai Người thực thi.</p>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
