import { useState } from "react";

/** Thời gian giữ dấu tích trước khi màn hình đổi. Máy bật giảm chuyển động thì giữ ngắn như mẫu gốc. */
const HOLD_MS = 800;
const REDUCED_HOLD_MS = 100;

let overrideMs: number | null = null;

/** Chỉ để cấu hình test: đặt 0 cho test không phải chờ hiệu ứng. */
export function setSuccessHoldMs(value: number | null): void {
  overrideMs = value;
}

function holdMs(): number {
  if (overrideMs !== null) {
    return overrideMs;
  }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return REDUCED_HOLD_MS;
  }
  return HOLD_MS;
}

/**
 * Bọc thao tác gửi server: xong thì bật `done` và chờ một nhịp để nút hiện dấu tích, rồi mới trả kết quả cho nơi
 * gọi cập nhật màn hình. Lỗi thì ném ra ngay, không chờ. Dùng cùng ActionButton:
 * `action.execute(() => success.hold(() => service.sign()), publish)`.
 */
export function useSuccessHold() {
  const [done, setDone] = useState(false);

  /** `succeeded` trả false khi server trả lời mà thao tác chưa thành (ví dụ hồ sơ đã có): không hiện dấu tích. */
  async function hold<T>(
    operation: () => Promise<T>,
    succeeded?: (result: T) => boolean,
  ): Promise<T> {
    setDone(false);
    const result = await operation();
    if (succeeded !== undefined && !succeeded(result)) {
      return result;
    }
    setDone(true);
    const wait = holdMs();
    if (wait > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, wait));
    }
    return result;
  }

  return { done, hold };
}
