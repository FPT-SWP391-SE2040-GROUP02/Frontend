import { z } from "zod";

/** Ô cấu hình của một dịch vụ ngoài: chính hoặc dự phòng (SystemConfigSlot của Backend, wire viết hoa). */
export const configSlotNameSchema = z.enum(["PRIMARY", "FALLBACK"]);
export type ConfigSlotName = z.infer<typeof configSlotNameSchema>;

const dateTime = z.string().datetime({ offset: true });

/** Mã dịch vụ (GEMINI, EKYC, SMTP, SEPAY, R2); kiểm hình dạng để không ghép chuỗi lạ vào đường dẫn. */
export const serviceKeySchema = z.string().regex(/^[A-Z0-9_]{2,32}$/);

/** Khóa bí mật chỉ cho biết đã có giá trị hay chưa; Backend không bao giờ trả giá trị khóa. */
const secretStatusSchema = z.object({
  name: z.string(),
  hasValue: z.boolean(),
  last4: z.string().nullable(),
});

const slotSchema = z.object({
  slot: configSlotNameSchema,
  enabled: z.boolean(),
  source: z.enum(["DATABASE", "APPSETTINGS"]),
  settings: z.record(z.string(), z.string()),
  secrets: z.array(secretStatusSchema),
  version: z.number().int().nonnegative(),
  updatedAt: dateTime.nullable(),
  updatedBy: z.string().nullable(),
});

const statusSchema = z.object({
  activeSlot: configSlotNameSchema.nullable(),
  lastOutcome: z.enum(["SUCCEEDED", "FAILED"]).nullable(),
  lastAt: dateTime.nullable(),
  lastErrorCode: z.string().nullable(),
});

const entrySchema = z.object({
  serviceKey: serviceKeySchema,
  supportsFallback: z.boolean(),
  slots: z.array(slotSchema),
  status: statusSchema,
});

/** GET /admin/system-config → SystemConfigListResponse (raw, không envelope). */
export const systemConfigListSchema = z.object({ services: z.array(entrySchema) });
/** Response của PUT: một ô sau khi lưu. */
export const systemConfigSlotSchema = slotSchema;
export const testSystemConfigResponseSchema = z.object({
  ok: z.boolean(),
  errorCode: z.string().nullable(),
  latencyMs: z.number().int().nonnegative(),
});

export type SystemConfigList = z.infer<typeof systemConfigListSchema>;
/** Một dịch vụ trong danh sách: các ô và lần gọi gần nhất. */
export type SystemConfigEntry = z.infer<typeof entrySchema>;
/** Một ô của dịch vụ. */
export type SystemConfigSlot = z.infer<typeof slotSchema>;
export type TestSystemConfigResponse = z.infer<typeof testSystemConfigResponseSchema>;

const reasonSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập lý do thay đổi.")
  .max(500, "Lý do tối đa 500 ký tự.");
const settingsSchema = z.record(z.string(), z.string());

/** Bỏ khóa để trống (nghĩa là giữ nguyên khóa cũ) và cắt khoảng trắng hai đầu. */
const secretsRequestSchema = z.record(z.string(), z.string()).transform((secrets) => {
  const kept: Record<string, string> = {};
  for (const [name, value] of Object.entries(secrets)) {
    const trimmed = value.trim();
    if (trimmed) kept[name] = trimmed;
  }
  return kept;
});

/** Chỉ giữ `secrets` trong body khi còn ít nhất một khóa. */
function withSecretsIfAny<T extends { secrets?: Record<string, string> }>(body: T) {
  const { secrets, ...rest } = body;
  if (secrets && Object.keys(secrets).length > 0) return { ...rest, secrets };
  return rest;
}

/** PUT /admin/system-config/{serviceKey}/{slot}. */
export const updateSystemConfigRequestSchema = z
  .object({
    settings: settingsSchema,
    secrets: secretsRequestSchema.optional(),
    enabled: z.boolean(),
    reason: reasonSchema,
    version: z.number().int().nonnegative(),
  })
  .transform(withSecretsIfAny);
export type UpdateSystemConfigRequest = z.input<typeof updateSystemConfigRequestSchema>;

/** POST .../test: giá trị nháp, chưa lưu. */
export const testSystemConfigRequestSchema = z
  .object({ settings: settingsSchema, secrets: secretsRequestSchema.optional() })
  .transform(withSecretsIfAny);
export type TestSystemConfigRequest = z.input<typeof testSystemConfigRequestSchema>;

/** POST .../reset. */
export const resetSystemConfigRequestSchema = z.object({ reason: reasonSchema });
export type ResetSystemConfigRequest = z.input<typeof resetSystemConfigRequestSchema>;
