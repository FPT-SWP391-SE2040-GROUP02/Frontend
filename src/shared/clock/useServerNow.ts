import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/shared/config/env";
import { demoClockService } from "./demoClockService";

export const demoClockKeys = {
  all: ["demo-clock"] as const,
  status: () => [...demoClockKeys.all, "status"] as const,
};

/**
 * Chỉ bật khi chạy `npm run dev` hoặc bản build có VITE_ENABLE_DEVTOOLS=true (cùng cờ với "Công cụ thử nghiệm").
 * Bản production không gọi API dev và không hiện gì. Đọc lúc gọi (không chốt khi nạp module) để test đổi được.
 */
export function isDemoClockEnabled(): boolean {
  return import.meta.env.DEV || ENV.ENABLE_DEVTOOLS;
}

/**
 * Giờ hệ thống và giờ thật. 404 (Backend không bật chế độ này) nghĩa là không giả lập: dữ liệu là null, không báo lỗi.
 * Lỗi mạng cũng không làm hỏng trang vì chỉ dùng để hiện dải báo và lấy độ lệch.
 */
export function useDemoClockStatus() {
  return useQuery({
    queryKey: demoClockKeys.status(),
    queryFn: ({ signal }) => demoClockService.getStatus(signal),
    enabled: isDemoClockEnabled(),
    retry: false,
    staleTime: 30_000,
  });
}

/**
 * Độ lệch (mili giây) giữa giờ hệ thống và giờ trình duyệt: 0 khi không giả lập hoặc chưa tải xong.
 * Cộng vào Date.now() ở chỗ cần "hôm nay" mà không tiện dùng hook trả về Date.
 */
export function useServerOffsetMs(): number {
  const status = useDemoClockStatus();
  if (status.data) {
    return status.data.offsetSeconds * 1000;
  }
  return 0;
}

/** Làm mới "bây giờ" mỗi chừng này mili giây để trang mở lâu vẫn đúng ngày (độ chính xác theo phút là đủ). */
const NOW_REFRESH_MS = 30_000;

/**
 * "Hôm nay" của hệ thống. Không giả lập (hoặc chưa tải xong) thì là giờ của trình duyệt; đang giả lập thì cộng độ lệch
 * mà Backend báo. Dùng cho logic cần biết hôm nay (chặn ngày, đếm ngược, "còn x ngày") thay cho new Date().
 * Giờ máy được chụp lúc mount và làm mới mỗi 30 giây, nên gọi trong lúc render vẫn thuần.
 */
export function useServerNow(): Date {
  const offsetMs = useServerOffsetMs();
  const [clientNowMs, setClientNowMs] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setClientNowMs(Date.now()), NOW_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);
  return new Date(clientNowMs + offsetMs);
}
