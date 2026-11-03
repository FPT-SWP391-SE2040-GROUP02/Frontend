import { apiClient } from "@/shared/api";
import { systemSettingSchema, type SystemSetting } from "../model/adminSettings.types";

export const adminSettingsService = {
  async getAll(signal?: AbortSignal): Promise<SystemSetting[]> {
    const raw = await apiClient.get<unknown, unknown>("/admin/settings", { signal });
    return systemSettingSchema.array().parse(raw);
  },

  async update(key: string, value: string, isEnabled?: boolean): Promise<SystemSetting> {
    const raw = await apiClient.put<unknown, unknown>(
      `/admin/settings/${encodeURIComponent(key)}`,
      { value, isEnabled },
    );
    return systemSettingSchema.parse(raw);
  },

  async batchUpdate(
    items: Array<{ key: string; value: string; isEnabled?: boolean }>,
    reason?: string,
  ): Promise<SystemSetting[]> {
    const raw = await apiClient.put<unknown, unknown>("/admin/settings/batch", { items, reason });
    return systemSettingSchema.array().parse(raw);
  },

  async create(data: {
    key: string;
    value: string;
    dataType?: string;
    category?: string;
    description?: string;
    isEnabled?: boolean;
  }): Promise<SystemSetting> {
    const raw = await apiClient.post<unknown, unknown>("/admin/settings", data);
    return systemSettingSchema.parse(raw);
  },
};
