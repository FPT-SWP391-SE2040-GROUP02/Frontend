import { useEffect, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { dismissToast, getToasts, subscribeToasts, type ToastItem } from "@/shared/lib/toastStore";
import "./toast.css";

/** Thời gian chạy hiệu ứng thoát trước khi gỡ hẳn khỏi hàng đợi. */
const LEAVE_MS = 220;

function ToastCard({ toast, depth }: { toast: ToastItem; depth: number }) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (leaving) {
      const timer = window.setTimeout(() => dismissToast(toast.id), LEAVE_MS);
      return () => window.clearTimeout(timer);
    }
    if (toast.durationMs <= 0 || paused) {
      return;
    }
    const timer = window.setTimeout(() => setLeaving(true), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [leaving, paused, toast.durationMs, toast.id]);

  return (
    <div
      className="toast relative"
      data-tone={toast.tone}
      data-depth={Math.min(depth, 2)}
      data-leaving={leaving}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span aria-hidden="true" className="toast-dot" />
      <span className="toast-msg">{toast.message}</span>
      {toast.actionLabel && (
        <button
          type="button"
          className="toast-act"
          onClick={() => {
            toast.onAction?.();
            setLeaving(true);
          }}
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        className="toast-x"
        aria-label="Đóng thông báo"
        onClick={() => setLeaving(true)}
      >
        <X aria-hidden="true" size={16} />
      </button>
      {toast.durationMs > 0 && !paused && !leaving && (
        <span
          aria-hidden="true"
          className="toast-bar"
          style={{ animationDuration: `${toast.durationMs}ms` }}
        />
      )}
    </div>
  );
}

/** Khung hiển thị thông báo nổi; đặt một lần ở gốc ứng dụng. Vùng đọc màn hình hình lặng, lịch sự. */
export function ToastHost() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((toast, index) => (
        <ToastCard key={toast.id} toast={toast} depth={toasts.length - 1 - index} />
      ))}
    </div>
  );
}
