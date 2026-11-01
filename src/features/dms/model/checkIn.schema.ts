import { z } from "zod";
import { paginatedListSchema } from "@/shared/api/pagination.schema";
const timestamp = z.string().datetime({ offset: true });
/** DTO của kỳ điểm danh; thời gian do server xác nhận. */
export const checkInPeriodSchema = z.object({
  sequence: z.number().int().positive(),
  startedAt: timestamp,
  dueAt: timestamp,
  graceEndsAt: timestamp,
  checkedInAt: timestamp.nullable(),
  overdueAt: timestamp.nullable(),
  awaitingCheckAt: timestamp.nullable(),
  /** Lúc kỳ đóng; có mà checkedInAt null = kỳ bị dừng vì kế hoạch không còn chạy (SETUP-16). BE cũ không trả. */
  closedAt: timestamp.nullable().optional(),
});
/** Raw CheckInStatusResponse, không suy diễn từ mock DMS. */
export const checkInStatusSchema = z.object({
  status: z.enum(["NOT_STARTED", "ACTIVE", "CHECKIN_OVERDUE", "AWAITING_CHECK", "PAUSED"]),
  planStatus: z.string().min(1),
  serverTime: timestamp,
  lastCheckInAt: timestamp.nullable(),
  /** Executor đã điểm danh hộ trong ngày Việt Nam hôm nay: khóa nút của chủ kho. BE cũ không trả nên mặc định false. */
  checkedInByExecutorToday: z.boolean().default(false),
  nextCheckInDueAt: timestamp.nullable(),
  graceEndsAt: timestamp.nullable(),
  settings: z.object({
    cycleDays: z.number().int(),
    graceDays: z.number().int(),
    pendingCycleDays: z.number().int().nullable(),
    pendingGraceDays: z.number().int().nullable(),
    etag: z.string().min(1).max(64),
  }),
  history: paginatedListSchema(checkInPeriodSchema),
});
/** PATCH yêu cầu etag và ít nhất một giá trị hợp lệ; không tự thay lịch đang chạy. */
export const updateCheckInSettingsSchema = z
  .object({
    etag: z.string().min(1).max(64),
    cycleDays: z
      .union([z.literal(30), z.literal(60), z.literal(90)])
      .nullable()
      .optional(),
    graceDays: z
      .union([z.literal(7), z.literal(14), z.literal(30)])
      .nullable()
      .optional(),
  })
  .refine((value) => value.cycleDays != null || value.graceDays != null);
