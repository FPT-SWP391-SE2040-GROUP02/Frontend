// Lucian UX/UI Prompt #403 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#403
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "cn";
import { Input } from "@/shared/ui/input";
import "./authForm.css";

export interface AuthFieldProps extends Omit<ComponentProps<"input">, "id" | "className"> {
  id: string;
  label: string;
  /** Câu lỗi hiện dưới ô. */
  error?: string;
  /** Server từ chối giá trị này: tô đỏ ô, câu giải thích nằm ở khung báo lỗi có id `rejectedBy`. */
  rejected?: boolean;
  rejectedBy?: string;
  /** Tăng lên một đơn vị thì ô rung một lần. */
  shake?: number;
  hint?: ReactNode;
  /** Nút nằm ở mép phải trong ô (con mắt). */
  end?: ReactNode;
}

/** Ô nhập có nhãn nổi: nhãn nằm trong ô, chọn ô hoặc đã gõ thì nhãn thu nhỏ lên trên. */
export function AuthField({
  id,
  label,
  error,
  rejected = false,
  rejectedBy,
  shake = 0,
  hint,
  end,
  ...input
}: AuthFieldProps) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = box.current;
    if (node === null || shake === 0) {
      return;
    }
    // Gỡ rồi gắn lại class để chuyển động chạy lại ở lần sai sau.
    node.classList.remove("is-shake");
    void node.offsetWidth;
    node.classList.add("is-shake");
  }, [shake]);

  const bad = Boolean(error) || rejected;
  const describedBy: string[] = [];
  if (hint) {
    describedBy.push(`${id}-hint`);
  }
  if (error) {
    describedBy.push(`${id}-error`);
  }
  if (rejected && rejectedBy) {
    describedBy.push(rejectedBy);
  }

  return (
    <div className={cn("u403-fd text-left", bad && "is-bad")}>
      <div ref={box} className={cn("u403-f", Boolean(end) && "has-end")}>
        {/* Ô phải đứng trước nhãn để CSS nâng nhãn theo trạng thái ô. placeholder trắng dùng cho :placeholder-shown. */}
        <Input
          {...input}
          id={id}
          placeholder=" "
          aria-invalid={bad}
          aria-describedby={describedBy.join(" ") || undefined}
          className="u403-in rounded-xl text-sm"
        />
        <label htmlFor={id}>{label}</label>
        {end}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="pt-1.5 text-sm text-heritage-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="u403-msg pt-1.5 text-sm font-medium text-heritage-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Nút hiện/ẩn mật khẩu hình con mắt. */
export function PasswordEye({
  shown,
  disabled,
  onToggle,
}: {
  shown: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="u403-eye"
      aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      aria-pressed={shown}
      disabled={disabled}
      onClick={onToggle}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <g className="lid">
          <path d="M2 10s3-5.2 8-5.2S18 10 18 10s-3 5.2-8 5.2S2 10 2 10z" />
          <circle cx="10" cy="10" r="2.4" />
        </g>
        <g className="lash">
          <path d="M3 10.4c2 2.4 4.4 3.4 7 3.4s5-1 7-3.4M6 13l-1 1.6M10 14v1.8M14 13l1 1.6" />
        </g>
      </svg>
    </button>
  );
}
