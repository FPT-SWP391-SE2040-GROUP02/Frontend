import { useEffect, useState } from "react";

/** Làm mới "bây giờ" mỗi chừng này mili giây để trang mở lâu vẫn đúng ngày (độ chính xác theo phút là đủ). */
const NOW_REFRESH_MS = 30_000;

/**
 * "Hôm nay" cho logic cần biết ngày hiện tại (chặn ngày, đếm ngược, "còn x ngày") thay cho new Date().
 * Giờ máy được chụp lúc mount và làm mới mỗi 30 giây, nên gọi trong lúc render vẫn thuần.
 */
export function useServerNow(): Date {
  const [clientNowMs, setClientNowMs] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setClientNowMs(Date.now()), NOW_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);
  return new Date(clientNowMs);
}
