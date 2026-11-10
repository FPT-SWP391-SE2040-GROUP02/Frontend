import type { DemoClockStep } from "@/shared/clock/demoClock.schema";

const KIND_LABELS: Record<string, string> = {
  CHECK_IN_REMINDER: "Gửi thư nhắc điểm danh",
  CHECK_IN_DUE: "Đến hạn điểm danh",
  CHECK_IN_GRACE_END: "Hết thời gian chờ, báo Người thực thi",
  EXECUTOR_INVITATION: "Lời mời Người thực thi (nhắc hoặc hết hạn)",
  SERVICE_EXPIRY: "Hết hạn gói dịch vụ",
  HANDOVER_DEADLINE: "Hạn của người nhận (phản hồi, quyết định hoặc tải)",
  INCIDENT: "Nhắc hoặc báo lên về sự cố",
  TARGET_DAY: "Tới ngày đã chọn",
};

/** Nhãn dễ hiểu của loại mốc; loại mốc lạ hiện nguyên mã để không giấu thông tin. */
export function stepKindLabel(kind: string): string {
  if (Object.hasOwn(KIND_LABELS, kind)) {
    return KIND_LABELS[kind];
  }
  return kind;
}

/** Dòng phụ của bước: số email đã gửi và số mục lỗi (nếu có). */
export function stepDetail(step: DemoClockStep): string {
  const parts: string[] = [];
  if (step.emailsSent > 0) {
    parts.push(`${step.emailsSent} email đã gửi`);
  }
  if (step.itemsProcessed > 0) {
    parts.push(`${step.itemsProcessed} việc đã xử lý`);
  }
  if (step.failures > 0) {
    parts.push(`${step.failures} việc lỗi`);
  }
  if (parts.length === 0) {
    return "Không có việc nào cần xử lý";
  }
  return parts.join(" · ");
}
