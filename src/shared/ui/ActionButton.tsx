// Lucian UX/UI Prompt #004 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#004
import type { ComponentProps, ReactNode } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { cn } from "cn";
import "./actionButton.css";

type ActionState = "idle" | "run" | "done";

export interface ActionButtonProps extends ComponentProps<"button"> {
  /** Đang gửi hoặc đang tải: nút khóa (trừ khi hủy được) và hiện hiệu ứng chạy. */
  pending: boolean;
  /** Server đã báo xong, giữ dấu tích một nhịp trước khi màn hình đổi (useSuccessHold). */
  done?: boolean;
  pendingLabel: string;
  doneLabel: string;
  /** Câu lúc server còn chuẩn bị tệp, chưa gửi byte nào (chỉ nút tải). */
  preparingLabel?: string;
  /** Phần trăm thật từ server (0–100); null hoặc bỏ trống thì chỉ chạy vệt sáng, không hiện số giả. */
  progress?: number | null;
  /** Có thì bấm lại lúc đang chạy sẽ hủy. */
  onCancel?: () => void;
}

/**
 * Nút thao tác chờ server: đứng yên, đang chạy (vệt sáng, vòng xoay hoặc thanh phần trăm), xong (dấu tích).
 * Kích thước nút giữ theo nhãn dài nhất để các nút bên cạnh không nhảy chỗ.
 */
export function ActionButton({
  pending,
  done = false,
  pendingLabel,
  doneLabel,
  preparingLabel,
  progress = null,
  onCancel,
  disabled = false,
  className,
  children,
  onClick,
  type = "button",
  "aria-label": ariaLabel,
  ...props
}: ActionButtonProps) {
  let state: ActionState = "idle";
  if (pending) {
    state = "run";
    if (done) {
      state = "done";
    }
  }
  const cancellable = state === "run" && onCancel !== undefined;
  const locked = disabled || (state !== "idle" && !cancellable);

  // Chữ giữ chỗ phải là chữ dài nhất lúc chạy.
  let widestText = pendingLabel;
  let runText = pendingLabel;
  if (preparingLabel !== undefined) {
    widestText = preparingLabel;
    runText = preparingLabel;
  }
  if (progress !== null) {
    runText = `${pendingLabel} ${progress}%`;
  }
  // aria-label che chữ bên trong, nên lúc chạy phải ghép thêm trạng thái vào tên nút.
  let label = ariaLabel;
  if (ariaLabel !== undefined && state === "run") {
    label = `${ariaLabel}. ${runText}`;
    if (cancellable) {
      label = `${label}. Bấm để hủy`;
    }
  }
  if (ariaLabel !== undefined && state === "done") {
    label = `${ariaLabel}. ${doneLabel}`;
  }
  let activeFace: ReactNode = null;
  if (state === "run") {
    let spinner: ReactNode = null;
    if (progress === null) {
      spinner = <LoaderCircle className="u004-spin size-4" aria-hidden="true" />;
    }
    activeFace = (
      <span className="u004-face u004-run">
        {spinner}
        {runText}
        {cancellable && <span className="sr-only">, bấm để hủy</span>}
      </span>
    );
  }
  if (state === "done") {
    activeFace = (
      <span className="u004-face u004-ok">
        <Check className="u004-check size-4" aria-hidden="true" />
        {doneLabel}
      </span>
    );
  }

  return (
    <button
      {...props}
      type={type}
      className={cn("u004", className)}
      data-state={state}
      aria-busy={state === "run"}
      aria-label={label}
      disabled={locked}
      onClick={(event) => {
        if (cancellable) {
          event.preventDefault();
          onCancel();
          return;
        }
        onClick?.(event);
      }}
    >
      <span className="u004-track" aria-hidden="true">
        {progress !== null && state === "run" && (
          <span className="u004-bar" style={{ transform: `scaleX(${progress / 100})` }} />
        )}
      </span>
      <span className="u004-faces" aria-live="polite">
        <span className="u004-face u004-idle" aria-hidden={state !== "idle" || undefined}>
          {children}
        </span>
        {activeFace}
        {/* Giữ chỗ cho nhãn dài nhất bằng CSS để chữ này không lọt vào nội dung đọc được. */}
        <span className="u004-sizer" aria-hidden="true" data-label={widestText} />
      </span>
    </button>
  );
}
