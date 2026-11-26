// Lucian UX/UI Prompt #480 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#480
import { useState, type Ref, type SyntheticEvent } from "react";
import { cn } from "cn";
import { PIN_LENGTH } from "../model/pinRules";
import "./pinKeypad.css";

/** Con trỏ luôn ở cuối: ô nhập trong suốt nên bấm vào giữa mà chèn số thì người dùng không thấy được. */
function caretToEnd(event: SyntheticEvent<HTMLInputElement>): void {
  const input = event.currentTarget;
  input.setSelectionRange(input.value.length, input.value.length);
}

/**
 * Ô nhập mã PIN dạng sáu chấm, cùng kiểu với hộp nhập PIN nhưng không có bàn phím trên màn hình: gõ bằng bàn phím
 * máy tính, điện thoại tự mở bàn phím số. Chỉ nhận chữ số; kiểm tra đúng sai thuộc form gọi nó.
 */
export function PinDotsField({
  id,
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  success,
  autoFocus,
  ref,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
  hint?: string;
  error?: string;
  success?: string;
  autoFocus?: boolean;
  ref?: Ref<HTMLInputElement>;
}) {
  const messageId = `${id}-message`;
  // Vị trí chấm vừa xóa, để chấm đó thu nhỏ lại.
  const [removed, setRemoved] = useState<number | null>(null);

  let state: "bad" | "good" | undefined;
  let message = hint;
  let messageStyle = "text-heritage-muted";
  if (error) {
    state = "bad";
    message = error;
    messageStyle = "font-medium text-heritage-danger";
  } else if (success) {
    state = "good";
    message = success;
    messageStyle = "font-medium text-heritage-success";
  }

  let role: "alert" | "status" | undefined;
  if (state === "bad") role = "alert";
  if (state === "good") role = "status";

  return (
    <div className="u480 space-y-1.5">
      <label htmlFor={id} className="block text-center text-sm font-semibold text-heritage-primary">
        {label}
      </label>
      <div className="u480-field u480-box" data-state={state}>
        <input
          ref={ref}
          id={id}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          maxLength={PIN_LENGTH}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          value={value}
          onFocus={caretToEnd}
          onClick={caretToEnd}
          onBlur={onBlur}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
            if (digits.length < value.length) {
              setRemoved(digits.length);
            } else {
              setRemoved(null);
            }
            onChange(digits);
          }}
        />
        <div className="u480-dots" aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <i
              key={index}
              className={cn(
                "u480-d",
                index < value.length && "is-on",
                index === removed && index >= value.length && "is-off",
                index === value.length && "is-next",
              )}
            />
          ))}
        </div>
      </div>
      {message && (
        <p id={messageId} role={role} className={cn("text-center text-sm", messageStyle)}>
          {message}
        </p>
      )}
    </div>
  );
}
