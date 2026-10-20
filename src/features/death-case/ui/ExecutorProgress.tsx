import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import type { DeathCase, ExecutorVault } from "../model/deathCase.schema";
import { useActiveCaseId, useDeathCase } from "../model/useDeathCase";
import { useHandoverProgress } from "../model/useHandoverProgress";
import { deriveLog, deriveSteps, type StepState } from "../model/progressSteps";
import { remainingText } from "../model/remainingText";
import { HandoverProgressPanel } from "./HandoverProgressPanel";
import { buttonStyles, Chip, formatDateTime, InfoRow, Panel } from "@/shared/ui/heritageKit";
import { caseStatusInfo } from "./executorLabels";

const noticeStatusLabels: Record<string, string> = {
  PENDING: "Đang gửi",
  DELIVERED: "Đã gửi",
  FAILED: "Chưa gửi được",
  CANCELLED: "Đã hủy",
};

const stepStyles: Record<StepState, string> = {
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

function describe(record: DeathCase | null | undefined, now: Date): string {
  if (!record) return "Chưa có hồ sơ báo tin. Tiến trình bắt đầu sau khi bạn gửi hồ sơ.";
  switch (record.status) {
    case "DRAFT":
      return "Hồ sơ đang ở dạng nháp. Hãy hoàn tất và gửi ở mục Báo tin.";
    case "SUPPLEMENT_REQUIRED":
      return "Người xét duyệt cần bổ sung thông tin. Vào mục Báo tin để nộp bản bổ sung.";
    case "SUSPENDED":
      return "Hồ sơ đang tạm dừng. Hệ thống sẽ xử lý tiếp khi đủ điều kiện.";
    case "REJECTED":
      return "Hồ sơ bị từ chối. Xem lý do ở mục Báo tin.";
    case "APPROVED_FOR_HANDOVER":
      return "Hồ sơ đã được duyệt. Bàn giao đang diễn ra, xem chi tiết bên dưới.";
    case "UNDER_REVIEW": {
      const sent = record.currentVersion.submittedAt
        ? `Hồ sơ đã gửi lúc ${formatDateTime(record.currentVersion.submittedAt)}. `
        : "";
      const open = record.objectionEndsAt ? new Date(record.objectionEndsAt) > now : false;
      return `${sent}${open ? "Chủ kho có 72 giờ để phản đối, sau đó hồ sơ sang bước xét duyệt." : "Hồ sơ đang chờ Người xét duyệt."}`;
    }
  }
}

/** Thanh 6 bước, nhật ký và hạn đang chờ; kèm tiến độ bàn giao khi hồ sơ đã gửi. */
export function ExecutorProgress({ vault }: { vault: ExecutorVault }) {
  const caseId = useActiveCaseId(vault);
  const query = useDeathCase(caseId);
  const record = query.data ?? null;
  const approved = record?.status === "APPROVED_FOR_HANDOVER";
  const handover = useHandoverProgress(caseId ?? "", Boolean(caseId) && approved);
  const now = new Date();
  if (caseId && query.isPending) return <p role="status">Đang tải hồ sơ…</p>;
  if (caseId && query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không đọc được hồ sơ hoặc bạn không có quyền trong kho này.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const steps = deriveSteps(record, handover.data, now);
  const log = deriveLog(record);
  const info = record ? caseStatusInfo[record.status] : null;
  return (
    <div className="space-y-6">
      <Panel
        title="Bước hiện tại"
        action={info ? <Chip tone={info.tone}>{info.label}</Chip> : undefined}
      >
        <ol className="grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 xl:grid-cols-6">
          {steps.map((step, index) => (
            <li
              key={step.label}
              aria-current={step.state === "current" ? "step" : undefined}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span
                aria-hidden="true"
                className={`flex size-11 items-center justify-center rounded-full border-2 text-sm font-semibold ${stepStyles[step.state]}`}
              >
                {step.state === "done" ? <Check className="size-5" /> : index + 1}
              </span>
              <span className="text-sm font-semibold">{step.label}</span>
              <span className={`text-xs font-semibold ${captionStyles[step.state]}`}>
                {step.caption}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm leading-6 text-heritage-muted">{describe(record, now)}</p>
        {!record && (
          <Link className={`${buttonStyles.gold} mt-4`} to={ROUTES.EXECUTOR.REPORT}>
            Đi tới Báo tin
          </Link>
        )}
      </Panel>

      {record && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel title="Nhật ký">
            <ul className="divide-y divide-heritage-border">
              {log.map((entry) => (
                <li
                  key={`${entry.at}-${entry.text}`}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <span>{entry.text}</span>
                  <time dateTime={entry.at} className="shrink-0 text-heritage-muted">
                    {formatDateTime(entry.at)}
                  </time>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Đang chờ">
            <dl>
              <InfoRow label="Chủ kho">{vault.ownerFullName}</InfoRow>
              <InfoRow label="Thông báo">
                {record.ownerNotice
                  ? (noticeStatusLabels[record.ownerNotice.status] ?? record.ownerNotice.status)
                  : "Chưa gửi hồ sơ"}
              </InfoRow>
              <InfoRow label="Hạn phản đối">
                {record.objectionEndsAt
                  ? `${formatDateTime(record.objectionEndsAt)} (${remainingText(record.objectionEndsAt, now.toISOString())})`
                  : "Chưa bắt đầu"}
              </InfoRow>
            </dl>
          </Panel>
        </div>
      )}

      {record && record.status !== "DRAFT" && caseId && <HandoverProgressPanel caseId={caseId} />}
    </div>
  );
}
