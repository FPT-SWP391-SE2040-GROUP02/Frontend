// Lucian UX/UI Prompt #403 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#403
import type { ReactNode } from "react";
import "./authForm.css";

/**
 * Nút gửi form đăng nhập, đăng ký: đang chờ server thì co thành vòng tròn xoay, xong thì hiện dấu tích.
 * Trình đọc màn hình vẫn nghe được câu trạng thái dù trên nút chỉ còn hình.
 */
export function MorphButton({
  pending,
  done,
  pendingLabel,
  doneLabel,
  disabled = false,
  children,
}: {
  pending: boolean;
  done: boolean;
  pendingLabel: string;
  doneLabel: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  let state: "idle" | "busy" | "ok" = "idle";
  let statusText = "";
  if (done) {
    state = "ok";
    statusText = doneLabel;
  } else if (pending) {
    state = "busy";
    statusText = pendingLabel;
  }
  return (
    <button
      type="submit"
      className="u403-go"
      data-state={state}
      aria-busy={state === "busy"}
      disabled={disabled || state !== "idle"}
    >
      <span className="u403-lb" aria-hidden={state !== "idle" || undefined}>
        {children}
      </span>
      <i className="u403-ring" aria-hidden="true" />
      <svg className="u403-ck" viewBox="0 0 22 22" aria-hidden="true">
        <path d="M5.5 11.5l4 4L17 7.5" />
      </svg>
      <span className="sr-only" aria-live="polite">
        {statusText}
      </span>
    </button>
  );
}
