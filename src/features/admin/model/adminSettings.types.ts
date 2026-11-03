import { z } from "zod";

export const systemSettingSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  value: z.string(),
  dataType: z.string(),
  category: z.string(),
  description: z.string(),
  isEnabled: z.boolean(),
  updatedAt: z.string(),
  updatedBy: z.string().nullable().optional(),
});

export type SystemSetting = z.infer<typeof systemSettingSchema>;

export const updateSystemSettingSchema = z.object({
  value: z.string().min(1, "Giá trị không được để trống").max(2000),
  isEnabled: z.boolean().optional(),
});

export type UpdateSystemSettingInput = z.infer<typeof updateSystemSettingSchema>;
