import { z } from "zod";

/** Khóa cờ bảo trì trong GET /settings/public (Admin bật ở Cấu hình hệ thống). */
export const MAINTENANCE_SETTING_KEY = "Features.MaintenanceMode";

/**
 * Body của GET /settings/public: từ điển khóa → giá trị (số, true/false hoặc chuỗi), chỉ gồm tham số đang bật.
 * Thiếu khóa nghĩa là tham số đang tắt.
 */
export const publicSettingsSchema = z.record(z.string(), z.unknown());

export type PublicSettings = z.infer<typeof publicSettingsSchema>;

/** Đang bảo trì khi và chỉ khi cờ có giá trị boolean true. */
export function isMaintenanceOn(settings: PublicSettings): boolean {
  return settings[MAINTENANCE_SETTING_KEY] === true;
}
