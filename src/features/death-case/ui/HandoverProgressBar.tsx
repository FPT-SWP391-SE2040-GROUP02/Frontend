import { Check } from "lucide-react";
import { Panel } from "@/shared/ui/heritageKit";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";
import type { DeathCase } from "../model/deathCase.schema";
import { useHandoverProgress } from "../model/useHandoverProgress";
import { deriveSteps, type StepState } from "../model/progressSteps";

const dotStyles: Record<StepState, string> = {
  done: "border-[#2E9E6E] bg-[#2E9E6E] text-white",
  current: "border-[#1A4B3B] bg-[#1A4B3B] text-white ring-4 ring-[#BFE6D3]",
  pending: "border-[#BDB8A6] bg-white text-heritage-muted",
  error: "border-[#A32119] bg-[#A32119] text-white",
};

const captionStyles: Record<StepState, string> = {
  done: "text-[#1F7A55]",
  current: "text-[#1A4B3B]",
  pending: "text-heritage-muted",
  error: "text-[#A32119]",
};

/**
 * Thanh tiến trình bàn giao ở tổng quan Người thực thi. Người thực thi không xem được nội dung hay danh sách gói,
 * chỉ biết người nhận đã đồng ý nhận và đã tải xong tài sản chưa; mọi con số do Backend trả về, không tự suy thêm.
 */
export function HandoverProgressBar({
  record,
  caseId,
}: {
  record: DeathCase | null | undefined;
  caseId: string | null;
}) {
  const policy = usePolicyWindows();
  const approved = record?.status === "APPROVED_FOR_HANDOVER";
  const handover = useHandoverProgress(caseId ?? "", Boolean(caseId) && approved);
  const progress = handover.data;
  const steps = deriveSteps(record, progress, policy.grantDays, null);

  let summary = "Tiến trình bắt đầu sau khi bạn gửi hồ sơ và Người xét duyệt đồng ý.";
  if (approved && progress) {
    const turns = progress.turns;
    const accepted = turns.filter((turn) => turn.status === "HANDOVER_COMMITTED");
    const totalItems = accepted.reduce((sum, turn) => sum + turn.totalItems, 0);
    const downloaded = accepted.reduce((sum, turn) => sum + turn.downloadedItems, 0);
    summary = `${accepted.length}/${progress.summary.totalTurns} người nhận đã đồng ý nhận`;
    if (accepted.length > 0) summary += ` · ${downloaded}/${totalItems} tài sản đã được tải`;
    summary += ".";
  } else if (record && !approved) {
    summary = "Hồ sơ chưa được duyệt nên chưa bắt đầu bàn giao cho người nhận.";
  }

  return (
    <Panel title="Tiến trình bàn giao">
      <ol className="grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 xl:grid-cols-5">
        {steps.map((step, index) => (
          <li
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span
              aria-hidden="true"
              className={`flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${dotStyles[step.state]}`}
            >
              {step.state === "done" ? <Check className="size-5" /> : index + 1}
            </span>
            <span className="text-xs font-semibold leading-snug">{step.label}</span>
            <span className={`text-xs font-semibold ${captionStyles[step.state]}`}>
              {step.caption}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm leading-6 text-heritage-muted">{summary}</p>
    </Panel>
  );
}
