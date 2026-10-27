import type { z } from "zod";
import { apiClient } from "@/shared/api";
import { paginationRequestSchema } from "@/shared/api/pagination.schema";
import type { PaginationParams } from "@/shared/types";
import { checkInStatusSchema, updateCheckInSettingsSchema } from "../model/checkIn.schema";

const checkInHistoryQuerySchema = paginationRequestSchema.pick({
  pageIndex: true,
  pageSize: true,
});

/** Transport điểm danh chính thức; không có endpoint pause/history riêng. */
export const checkInService = {
  /** GET chỉ đọc, không tự điểm danh khi mở trang; chỉ gửi phân trang lịch sử. */
  async get(params?: Pick<PaginationParams, "pageIndex" | "pageSize">, signal?: AbortSignal) {
    return checkInStatusSchema.parse(
      await apiClient.get<unknown, unknown>("/check-ins/me", {
        params: checkInHistoryQuerySchema.parse(params ?? {}),
        signal,
      }),
    );
  },
  /** POST sau hành động người dùng; không retry mutation. */
  async checkIn() {
    return checkInStatusSchema.parse(await apiClient.post<unknown, unknown>("/check-ins"));
  },
  /** POST điểm danh sinh trắc học qua Smartwatch (Galaxy Watch). */
  async checkInViaSmartwatch(request: { heartRate: number; isOnWrist: boolean }) {
    return checkInStatusSchema.parse(
      await apiClient.post<unknown, unknown>("/check-ins/smartwatch", request),
    );
  },
  /** POST sinh mã PIN 6 số để ghép nối với đồng hồ bất kỳ. */
  async getSmartwatchPairingCode() {
    return apiClient.post<unknown, { code: string; expiresInSeconds: number }>(
      "/smartwatch/pairing-code",
    );
  },
  /** GET kiểm tra trạng thái ghép nối của mã PIN 6 số. */
  async getSmartwatchPairingStatus(code: string, signal?: AbortSignal) {
    return apiClient.get<
      unknown,
      {
        paired: boolean;
        status: "pending" | "paired" | "expired";
        deviceName?: string;
        pairedAt?: string;
      }
    >("/smartwatch/pairing-status", {
      params: { code },
      signal,
    });
  },
  /** PATCH giữ etag; 409 yêu cầu tải lại, không optimistic. */
  async updateSettings(request: z.infer<typeof updateCheckInSettingsSchema>) {
    return checkInStatusSchema.parse(
      await apiClient.patch<unknown, unknown>(
        "/vaults/me/check-in-settings",
        updateCheckInSettingsSchema.parse(request),
      ),
    );
  },
};
