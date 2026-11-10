import { type ReactNode } from "react";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";

/** Bốn bước bàn giao; nội dung cố định theo SRS, chỉ số ngày tải lấy từ tham số Admin cấu hình. */
function handoverSteps(grantDays: number): Array<{ title: string; detail: string }> {
  return [
    { title: "Báo tin", detail: "Người thực thi nộp giấy chứng tử." },
    { title: "Xét duyệt", detail: "Người xét duyệt kiểm tra hồ sơ." },
    {
      title: "Người nhận xác nhận",
      detail: "Người nhận viết biên bản đồng ý hoặc từ chối, chờ duyệt.",
    },
    {
      title: "Nhập mã và tải",
      detail: `Người nhận nhập mã mở gói do Người thực thi trao, tải trong ${grantDays} ngày.`,
    },
  ];
}

/**
 * Danh sách bốn bước bàn giao, dùng chung cho trạng thái trước và sau khi kích hoạt.
 * `activeStep` (bắt đầu từ 1) tô đậm bước đang diễn ra; chưa truyền thì không bước nào được tô.
 */
export function HandoverStepsCard({
  title = "Bàn giao diễn ra thế nào",
  subtitle = "Chỉ bắt đầu khi Người thực thi báo tin. Trước đó bạn luôn có quyền dừng lại.",
  activeStep,
}: {
  title?: string;
  subtitle?: string;
  activeStep?: number;
}) {
  const policy = usePolicyWindows();
  const rows: ReactNode[] = [];
  let stepNumber = 0;
  for (const step of handoverSteps(policy.grantDays)) {
    stepNumber = stepNumber + 1;
    const isActive = activeStep === stepNumber;
    let badgeStyle = "bg-[#E0C486] text-[#0A281E]";
    let rowStyle = "";
    if (isActive) {
      badgeStyle = "bg-[#0A281E] text-white";
      rowStyle = "rounded-xl bg-heritage-canvas px-3";
    }
    let current: "step" | undefined;
    if (isActive) {
      current = "step";
    }
    rows.push(
      <li
        key={step.title}
        aria-current={current}
        className={`flex items-start gap-4 border-b border-heritage-border py-4 last:border-b-0 ${rowStyle}`}
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${badgeStyle}`}
          aria-hidden="true"
        >
          {stepNumber}
        </span>
        <div>
          <p className="font-semibold">{step.title}</p>
          <p className="text-sm text-heritage-muted">{step.detail}</p>
        </div>
      </li>,
    );
  }
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h2 className="text-xl font-medium text-heritage-primary">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-heritage-muted">{subtitle}</p>
      <ol className="mt-3">{rows}</ol>
    </section>
  );
}
