import { z } from "zod";
import { apiClient } from "@/shared/api";
import {
  devEkycResetRequestSchema,
  devEkycResetSchema,
  devEkycPauseSchema,
  devEkycThresholdSchema,
  devRewindBeforeEkycSchema,
  devUpdateEkycThresholdRequestSchema,
  devVaultOptionsSchema,
  type DevEkycResetRequest,
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
  /** Xóa dữ liệu eKYC của một tài khoản để làm lại từ đầu; trả số lượng đã xóa. */
  async resetEkyc(request: DevEkycResetRequest) {
    return devEkycResetSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/admin/dev-tools/users/ekyc-reset",
        devEkycResetRequestSchema.parse(request),
      ),
    );
  },
  /** Đưa kho về trước eKYC và mua gói: xóa eKYC của Chủ tài sản, trả gói về Free, hủy đơn đang chờ. */
  async rewindBeforeEkyc(vaultId: string) {
    return devRewindBeforeEkycSchema.parse(
      await apiClient.post<unknown, unknown>(`${vault(vaultId)}/rewind-before-ekyc`),
    );
  },
  /** Ngưỡng so khớp khuôn mặt eKYC đang chạy (gồm cả override runtime nếu đã đặt). */
  async getEkycThreshold(signal?: AbortSignal) {
    return devEkycThresholdSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/dev-tools/ekyc-threshold", { signal }),
    );
  },
  /** Đặt lại ngưỡng so khớp (override runtime trong bộ nhớ, không lưu DB); ngoài dải an toàn thì 400. */
  async updateEkycThreshold(threshold: number) {
    return devEkycThresholdSchema.parse(
      await apiClient.put<unknown, unknown>(
        "/admin/dev-tools/ekyc-threshold",
        devUpdateEkycThresholdRequestSchema.parse({ threshold }),
      ),
    );
  },
  /** eKYC đang tạm ngừng hay không (chỉ ở bộ nhớ máy chủ). */
  async getEkycPause(signal?: AbortSignal) {
    return devEkycPauseSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/dev-tools/ekyc-pause", { signal }),
    );
  },
  /** Bật hoặc tắt tạm ngừng eKYC: bật thì mọi bước eKYC dùng dịch vụ giả và luôn đạt. */
  async setEkycPause(paused: boolean) {
    return devEkycPauseSchema.parse(
      await apiClient.put<unknown, unknown>("/admin/dev-tools/ekyc-pause", { paused }),
    );
  },
};
