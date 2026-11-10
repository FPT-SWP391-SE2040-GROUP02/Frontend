import { isAxiosError } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { HTTP_STATUS } from "@/shared/constants";
import {
  demoClockStatusSchema,
  demoClockTravelRequestSchema,
  demoClockTravelSchema,
  type DemoClockStatus,
  type DemoClockTravel,
  type DemoClockTravelRequest,
} from "./demoClock.schema";

/** Mỗi lần tua chạy việc nền ở từng mốc nên có thể lâu hơn mặc định 90 giây của apiClient. */
const TRAVEL_TIMEOUT_MS = 300_000;

/**
 * Transport nút "Tua thời gian" (DemoClockController). Backend chỉ mở ở Development/Staging; môi trường khác trả 404.
 */
export const demoClockService = {
  /**
   * Giờ hệ thống và giờ thật. Không cần đăng nhập. 404 (Backend không bật chế độ này) trả null
   * nghĩa là không giả lập, không phải lỗi.
   */
  async getStatus(signal?: AbortSignal): Promise<DemoClockStatus | null> {
    try {
      return demoClockStatusSchema.parse(
        await apiClient.get<unknown, unknown>("/dev/clock", { signal }),
      );
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === HTTP_STATUS.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },
  /** Tua tới ngày chọn; trả đồng hồ mới và danh sách bước đã chạy. Chỉ Admin. */
  async travel(request: DemoClockTravelRequest): Promise<DemoClockTravel> {
    return demoClockTravelSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/dev/clock/travel",
        demoClockTravelRequestSchema.parse(request),
        { timeout: TRAVEL_TIMEOUT_MS },
      ),
    );
  },
  /** Về ngày thật; dữ liệu đã sinh ra trong lúc tua giữ nguyên. Chỉ Admin. */
  async reset(): Promise<DemoClockStatus> {
    return demoClockStatusSchema.parse(await apiClient.post<unknown, unknown>("/dev/clock/reset"));
  },
};
