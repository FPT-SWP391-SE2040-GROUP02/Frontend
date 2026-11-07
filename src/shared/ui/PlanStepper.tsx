import { Check } from "lucide-react";

/** Tám bước của luồng bàn giao; khớp PlanStatus, không thêm trạng thái mới. */
export const PLAN_STEPS = [
  { label: "Lập kế hoạch", who: "Chủ kho" },
  { label: "Điểm danh", who: "Chủ kho" },
  { label: "Nhắc trễ", who: "Hệ thống" },
  { label: "Người thực thi vào cuộc", who: "Người thực thi" },
  { label: "Nộp giấy chứng tử", who: "Người thực thi" },
  { label: "Xét hồ sơ", who: "Người xét duyệt" },
  { label: "Bàn giao", who: "Người nhận" },
  { label: "Kết thúc", who: "Hệ thống" },
] as const;

/**
 * Bước đang diễn ra (0 đến 7) theo PlanStatus dạng API. Hồ sơ chứng tử đang mở (DEATH_CASE_OPEN) là bước 5 khi chưa
 * duyệt; Backend không phân biệt nộp và xét nên dùng "Xét hồ sơ" để tránh báo sai. BLOCKED (hết gói, đóng băng)
 * dừng ở bước 4 vì kho kẹt ở khâu Người thực thi. Trạng thái lạ trả -1 và thanh không đánh dấu bước nào.
 */
export function planStepIndex(planStatus: string): number {
  switch (planStatus) {
    case "DRAFT":
      return 0;
    case "ACTIVE":
      return 1;
    case "CHECKIN_OVERDUE":
      return 2;
    case "AWAITING_CHECK":
    case "BLOCKED":
      return 3;
    case "DEATH_CASE_OPEN":
      return 5;
    case "HANDOVER_IN_PROGRESS":
      return 6;
    case "CLOSED":
      return 7;
    default:
      return -1;
  }
}

/** Thanh tiến trình 8 bước: bước đã qua có dấu tích, bước hiện tại nổi bật kèm ai cần làm. */
export function PlanStepper({ planStatus }: { planStatus: string }) {
  const current = planStepIndex(planStatus);
  const frozen = planStatus === "BLOCKED";
  return (
    <ol aria-label="Tiến trình 8 bước" className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
      {PLAN_STEPS.map((step, index) => {
        const done = current > index || (planStatus === "CLOSED" && index === 7);
        const active = current === index && planStatus !== "CLOSED";
        return (
          <li
            key={step.label}
            aria-current={active ? "step" : undefined}
            className={`rounded-xl border p-3 text-sm ${
              active
                ? frozen
                  ? "border-red-300 bg-red-50"
                  : "border-heritage-primary bg-heritage-primary/5"
                : done
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-heritage-border bg-heritage-surface"
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              <span
                aria-hidden="true"
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-heritage-primary text-white"
                      : "bg-stone-200 text-stone-600"
                }`}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              {step.label}
            </span>
            <span className="mt-1 block text-xs text-heritage-muted">
              {active && frozen ? "Đóng băng: hết gói" : step.who}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
