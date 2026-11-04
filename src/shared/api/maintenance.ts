import { isAxiosError } from "axios";
import { HTTP_STATUS } from "@/shared/constants";

/** Mã lỗi Backend trả kèm 503 khi hệ thống đang bảo trì; chỉ tài khoản ADMIN còn gọi API được. */
export const MAINTENANCE_ERROR_CODE = "MAINTENANCE_MODE";

const listeners = new Set<() => void>();

/**
 * Đăng ký nhận tín hiệu "Backend vừa báo bảo trì". Transport chỉ báo; tầng app quyết định đổi giao diện.
 * @returns Hàm hủy đăng ký.
 */
export function subscribeMaintenance(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Phân biệt 503 bảo trì với 503 khác (ví dụ dịch vụ eKYC tạm lỗi) bằng trường code của ProblemDetails. */
export function isMaintenanceError(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== HTTP_STATUS.SERVICE_UNAVAILABLE)
    return false;
  const body: unknown = error.response.data;
  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    body.code === MAINTENANCE_ERROR_CODE
  );
}

/** Gọi từ interceptor của apiClient: báo cho mọi listener khi response là 503 MAINTENANCE_MODE. */
export function reportMaintenance(error: unknown): void {
  if (!isMaintenanceError(error)) return;
  for (const listener of listeners) listener();
}
