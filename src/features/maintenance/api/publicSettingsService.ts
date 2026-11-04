import { axiosClient } from "@/shared/api/axiosClient";
import { publicSettingsSchema, type PublicSettings } from "../model/maintenance.schema";

/** Đọc tham số công khai; không cần đăng nhập và Backend luôn cho qua kể cả khi đang bảo trì. */
export const publicSettingsService = {
  async getPublicSettings(signal?: AbortSignal): Promise<PublicSettings> {
    return publicSettingsSchema.parse(
      await axiosClient.get<unknown, unknown>("/settings/public", { signal }),
    );
  },
};
