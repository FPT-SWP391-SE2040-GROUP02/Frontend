import type { z } from "zod";
import { apiClient } from "@/shared/api";
import { paginationRequestSchema } from "@/shared/api/pagination.schema";
import type { PaginationParams } from "@/shared/types";
import { checkInStatusSchema, updateCheckInSettingsSchema } from "../model/checkIn.schema";

/** Transport điểm danh chính thức; không có endpoint pause/history riêng. */
export const checkInService = {
  /** GET chỉ đọc, không tự điểm danh khi mở trang. */
  async get(params?: PaginationParams, signal?: AbortSignal) {
    return checkInStatusSchema.parse(
      await apiClient.get<unknown, unknown>("/check-ins/me", {
        params: paginationRequestSchema.parse(params ?? {}),
        signal,
      }),
    );
  },
  /** POST sau hành động người dùng; không retry mutation. */
  async checkIn() {
    return checkInStatusSchema.parse(await apiClient.post<unknown, unknown>("/check-ins"));
  },
  /** POST điểm danh sinh trắc học qua Smartwatch (Galaxy Watch). */
  async checkInViaSmartwatch(request: {
    heartRate: number;
    deviceId?: string;
    isOnWrist: boolean;
    timestamp?: number;
  }) {
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
