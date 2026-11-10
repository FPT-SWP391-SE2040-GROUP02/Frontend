import { z } from "zod";

const instant = z.string().datetime({ offset: true });

/** GET /dev/clock và POST /dev/clock/reset → DemoClockStatusResponse. */
export const demoClockStatusSchema = z.object({
  /** Giờ hệ thống đang dùng (UTC) = giờ thật + độ lệch. */
  nowUtc: instant,
  realNowUtc: instant,
  offsetSeconds: z.number().int(),
  isSimulated: z.boolean(),
});
export type DemoClockStatus = z.infer<typeof demoClockStatusSchema>;

/** Loại mốc của một bước tua (DemoClockStepResponse.kind). */
export const DEMO_STEP_KINDS = [
  "CHECK_IN_REMINDER",
  "CHECK_IN_DUE",
  "CHECK_IN_GRACE_END",
  "EXECUTOR_INVITATION",
  "SERVICE_EXPIRY",
  "HANDOVER_DEADLINE",
  "INCIDENT",
  "TARGET_DAY",
] as const;
export type DemoStepKind = (typeof DEMO_STEP_KINDS)[number];

export const demoClockStepSchema = z.object({
  at: instant,
  /** Kiểu chuỗi để một loại mốc mới của Backend không làm hỏng cả danh sách; nhãn lạ hiện nguyên mã. */
  kind: z.string(),
  itemsProcessed: z.number().int().nonnegative(),
  emailsSent: z.number().int().nonnegative(),
  failures: z.number().int().nonnegative(),
});
export type DemoClockStep = z.infer<typeof demoClockStepSchema>;

/** POST /dev/clock/travel → DemoClockTravelResponse. */
export const demoClockTravelSchema = z.object({
  clock: demoClockStatusSchema,
  steps: z.array(demoClockStepSchema),
});
export type DemoClockTravel = z.infer<typeof demoClockTravelSchema>;

/** Ngày đích dạng yyyy-MM-dd; Backend đặt giờ là 9:00 sáng giờ Việt Nam của ngày đó. */
export const demoClockTravelRequestSchema = z.object({
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có dạng yyyy-MM-dd."),
});
export type DemoClockTravelRequest = z.infer<typeof demoClockTravelRequestSchema>;
