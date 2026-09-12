import { z } from "zod";
import { APP_MESSAGES } from "@/shared/constants";

/**
 * @file dms.schema.ts
 * @description Zod validation schemas cho hệ sinh thái Dead Man's Switch (DMS Heartbeat).
 */

/**
 * Schema xác thực cấu hình kênh thông báo nhịp sinh tồn
 */
export const notificationChannelSchema = z.object({
  type: z.enum(["EMAIL", "SMS", "TELEGRAM", "VOICE_CALL"]),
  enabled: z.boolean(),
  targetValue: z.string().trim().min(1, {
    message: APP_MESSAGES.VALIDATION.REQUIRED("Địa chỉ liên hệ nhận thông báo"),
  }),
});

export type NotificationChannelFormInput = z.infer<typeof notificationChannelSchema>;

/**
 * Schema xác thực cấu hình chu kỳ kiểm tra sinh tồn (DMS Settings)
 */
export const dmsConfigSchema = z.object({
  /** Chu kỳ kiểm tra sinh tồn (ngày) - Tối thiểu 7 ngày, tối đa 365 ngày */
  checkIntervalDays: z
    .number({
      required_error: APP_MESSAGES.VALIDATION.REQUIRED("Chu kỳ kiểm tra"),
      invalid_type_error: APP_MESSAGES.VALIDATION.NUMBER("Chu kỳ kiểm tra"),
    })
    .min(7, { message: "Chu kỳ kiểm tra tối thiểu là 7 ngày" })
    .max(365, { message: "Chu kỳ kiểm tra tối đa là 365 ngày" }),

  /** Thời gian ân hạn (ngày) - Tối thiểu 3 ngày, tối đa 60 ngày */
  gracePeriodDays: z
    .number({
      required_error: APP_MESSAGES.VALIDATION.REQUIRED("Thời gian ân hạn"),
      invalid_type_error: APP_MESSAGES.VALIDATION.NUMBER("Thời gian ân hạn"),
    })
    .min(3, { message: "Thời gian ân hạn tối thiểu là 3 ngày" })
    .max(60, { message: "Thời gian ân hạn tối đa là 60 ngày" }),

  /** Tần suất gửi nhắc nhở trước hạn (ngày) */
  reminderFrequencyDays: z
    .number({
      required_error: APP_MESSAGES.VALIDATION.REQUIRED("Tần suất nhắc nhở"),
      invalid_type_error: APP_MESSAGES.VALIDATION.NUMBER("Tần suất nhắc nhở"),
    })
    .min(1, { message: "Tần suất nhắc nhở tối thiểu 1 ngày" })
    .max(14, { message: "Tần suất nhắc nhở tối đa 14 ngày" }),

  /** Danh sách kênh thông báo */
  channels: z.array(notificationChannelSchema).min(1, {
    message: "Bắt buộc kích hoạt ít nhất 1 kênh nhận thông báo cảnh báo",
  }),

  /** Tự động gửi cảnh báo khẩn cấp tới người giám hộ khi vào Grace Period */
  notifyExecutorOnGracePeriod: z.boolean().default(true),
});

export type DmsConfigFormInput = z.infer<typeof dmsConfigSchema>;

/**
 * Schema xác thực yêu cầu gửi nhịp ping sinh tồn
 */
export const pingRequestSchema = z.object({
  source: z.enum(["WEB", "EMAIL_LINK", "TELEGRAM", "MOBILE_APP"]).default("WEB"),
  clientTimestamp: z.string().datetime().optional(),
  note: z.string().max(255).optional(),
});

export type PingRequestInput = z.infer<typeof pingRequestSchema>;
