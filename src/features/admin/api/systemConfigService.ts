import { apiClient } from "@/shared/api";
import {
  configSlotNameSchema,
  resetSystemConfigRequestSchema,
  serviceKeySchema,
  systemConfigListSchema,
  systemConfigSlotSchema,
  testSystemConfigRequestSchema,
  testSystemConfigResponseSchema,
  updateSystemConfigRequestSchema,
  type ConfigSlotName,
  type ResetSystemConfigRequest,
  type TestSystemConfigRequest,
  type UpdateSystemConfigRequest,
} from "../model/systemConfig.schema";

const target = (serviceKey: string, slot: ConfigSlotName) =>
  `/admin/system-config/${serviceKeySchema.parse(serviceKey)}/${configSlotNameSchema.parse(slot)}`;

/** Transport cấu hình dịch vụ ngoài theo AdminSystemConfigController; không Admin → BE trả 404 (SEC-04). */
export const systemConfigService = {
  /** Các dịch vụ đã nối: ô chính/dự phòng, trạng thái lần gọi gần nhất. Không có giá trị khóa nào. */
  async list(signal?: AbortSignal) {
    return systemConfigListSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/system-config", { signal }),
    );
  },
  /** Lưu một ô. `version` lệch với ô trên máy chủ → 409 EDIT_CONFLICT. Khóa để trống thì không gửi. */
  async update(serviceKey: string, slot: ConfigSlotName, request: UpdateSystemConfigRequest) {
    const body = updateSystemConfigRequestSchema.parse(request);
    return systemConfigSlotSchema.parse(
      await apiClient.put<unknown, unknown>(target(serviceKey, slot), body),
    );
  },
  /** Thử kết nối bằng giá trị đang nhập mà không lưu. Dịch vụ hỏng vẫn là 200 với `ok = false`. */
  async test(serviceKey: string, slot: ConfigSlotName, request: TestSystemConfigRequest) {
    const body = testSystemConfigRequestSchema.parse(request);
    return testSystemConfigResponseSchema.parse(
      await apiClient.post<unknown, unknown>(`${target(serviceKey, slot)}/test`, body),
    );
  },
  /** Xóa cấu hình đã lưu của ô để quay về cấu hình mặc định của máy chủ; BE trả 204. */
  async reset(serviceKey: string, slot: ConfigSlotName, request: ResetSystemConfigRequest) {
    const body = resetSystemConfigRequestSchema.parse(request);
    await apiClient.post<unknown, unknown>(`${target(serviceKey, slot)}/reset`, body);
  },
};
