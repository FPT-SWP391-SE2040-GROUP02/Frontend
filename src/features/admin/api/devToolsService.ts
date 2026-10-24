import { z } from "zod";
import { apiClient } from "@/shared/api";
import {
  devClockSchema,
  devEkycResetRequestSchema,
  devEkycResetSchema,
  devRewindBeforeEkycSchema,
  devTimeTravelRequestSchema,
  devVaultOptionsSchema,
  type DevEkycResetRequest,
  type DevTimeTravelRequest,
} from "../model/devTools.schema";

const id = z.string().uuid();
const vault = (vaultId: string) => `/admin/dev-tools/vaults/${id.parse(vaultId)}`;

/**
 * Transport công cụ thử nghiệm theo DevToolsController. Backend chỉ mở ở Development và chỉ cho Admin;
 * môi trường khác hoặc không phải Admin đều trả 404.
 */
export const devToolsService = {
  /** Danh sách kho để chọn hồ sơ thử. */
  async listVaults(signal?: AbortSignal) {
    return devVaultOptionsSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/dev-tools/vaults", { signal }),
    );
  },
  /** Trạng thái đồng hồ và các mốc của một kho. */
  async getClock(vaultId: string, signal?: AbortSignal) {
    return devClockSchema.parse(
      await apiClient.get<unknown, unknown>(`${vault(vaultId)}/clock`, { signal }),
    );
  },
  /** Tua tới một mốc; trả trạng thái mới sau khi máy chủ xử lý xong. */
  async timeTravel(vaultId: string, request: DevTimeTravelRequest) {
    return devClockSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${vault(vaultId)}/time-travel`,
        devTimeTravelRequestSchema.parse(request),
      ),
    );
  },
  /** Về thời gian hiện tại; trạng thái đã phát sinh giữ nguyên. */
  async resetClock(vaultId: string) {
    return devClockSchema.parse(
      await apiClient.post<unknown, unknown>(`${vault(vaultId)}/reset-clock`),
    );
  },
  /** Xóa dữ liệu eKYC của một tài khoản để làm lại từ đầu; trả số lượng đã xóa. */
  async resetEkyc(request: DevEkycResetRequest) {
    return devEkycResetSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/admin/dev-tools/users/ekyc-reset",
        devEkycResetRequestSchema.parse(request),
      ),
    );
  },
  /** Đưa kho về trước eKYC và mua gói: xóa eKYC của Chủ kho, trả gói về Free, hủy đơn đang chờ. */
  async rewindBeforeEkyc(vaultId: string) {
    return devRewindBeforeEkycSchema.parse(
      await apiClient.post<unknown, unknown>(`${vault(vaultId)}/rewind-before-ekyc`),
    );
  },
};
