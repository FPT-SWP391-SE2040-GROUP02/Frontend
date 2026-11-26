export type ToastTone = "success" | "info" | "danger";

export interface ToastInput {
  message: string;
  tone?: ToastTone;
  /** Nhãn nút hành động trong thông báo (ví dụ "Hoàn tác"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Thời gian hiện, mili giây; 0 là không tự tắt. */
  durationMs?: number;
}

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
}

/** Số thông báo tối đa cùng hiện; cái cũ nhất bị đẩy ra khi vượt. */
export const MAX_TOASTS = 3;
const DEFAULT_DURATION_MS = 5000;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): ToastItem[] {
  return items;
}

/** Đẩy một thông báo nổi; trả về id để đóng sớm khi cần. */
export function showToast(input: ToastInput): number {
  const toast: ToastItem = {
    id: nextId,
    message: input.message,
    tone: input.tone ?? "success",
    actionLabel: input.actionLabel,
    onAction: input.onAction,
    durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
  };
  nextId += 1;
  items = [...items, toast].slice(-MAX_TOASTS);
  emit();
  return toast.id;
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

/** Chỉ dùng trong test: xóa sạch hàng đợi. */
export function resetToasts() {
  items = [];
  emit();
}
