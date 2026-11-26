import { useState } from "react";

/** Thời gian giữ dấu tích trước khi màn hình đổi. Máy bật giảm chuyển động thì giữ ngắn như mẫu gốc. */
const HOLD_MS = 800;
const REDUCED_HOLD_MS = 100;

let overrideMs: number | null = null;

/** Chỉ để cấu hình test: đặt 0 cho test không phải chờ hiệu ứng. */
export function setSuccessHoldMs(value: number | null): void {
  overrideMs = value;
}

function holdMs(wanted: number = HOLD_MS): number {
  if (overrideMs !== null) {
    return overrideMs;
  }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return REDUCED_HOLD_MS;
  }
  return wanted;
}

/** Thời gian tối thiểu trước khi báo xong. Test và máy bật giảm chuyển động thì không kéo dài. */
function minRunMs(wanted: number): number {
  if (overrideMs !== null) {
    return overrideMs;
  }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return 0;
  }
  return wanted;
}

function pause(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export interface SuccessHoldOptions {
  /** Giữ dấu tích lâu hơn mặc định (ví dụ vòng tải tệp cần đủ thời gian để thấy). */
  holdMs?: number;
  /** Hiệu ứng chạy ít nhất chừng này rồi mới báo xong; lỗi vẫn báo ngay. */
  minRunMs?: number;
}

/**
 * Bọc thao tác gửi server: xong thì bật `done` và chờ một nhịp để nút hiện dấu tích, rồi mới trả kết quả cho nơi
 * gọi cập nhật màn hình. Lỗi thì ném ra ngay, không chờ. Dùng cùng ActionButton:
 * `action.execute(() => success.hold(() => service.sign()), publish)`.
 */
export function useSuccessHold(options?: SuccessHoldOptions) {
  const [done, setDone] = useState(false);

  /** `succeeded` trả false khi server trả lời mà thao tác chưa thành (ví dụ hồ sơ đã có): không hiện dấu tích. */
  async function hold<T>(
    operation: () => Promise<T>,
    succeeded?: (result: T) => boolean,
  ): Promise<T> {
    setDone(false);
    const shortest = minRunMs(options?.minRunMs ?? 0);
    let result: T;
    if (shortest > 0) {
      // Promise.all báo lỗi ngay khi thao tác lỗi, không chờ hết thời gian tối thiểu.
      [result] = await Promise.all([operation(), pause(shortest)]);
    } else {
      result = await operation();
    }
    if (succeeded !== undefined && !succeeded(result)) {
      return result;
    }
    setDone(true);
    const wait = holdMs(options?.holdMs);
    if (wait > 0) {
      await pause(wait);
    }
    return result;
  }

  return { done, hold };
}
