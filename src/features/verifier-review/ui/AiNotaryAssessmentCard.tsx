import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Info,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { buttonStyles, Chip, Panel, type Tone } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { verifierReviewService } from "../api/verifierReviewService";
import type { AiDossierAnalysisResponse } from "../model/verifierReview.schema";

interface AiNotaryAssessmentCardProps {
  caseId: string;
}

const RISK: Record<string, { label: string; tone: Tone }> = {
  HIGH: { label: "Rủi ro cao", tone: "danger" },
  MEDIUM: { label: "Rủi ro trung bình", tone: "warning" },
  LOW: { label: "Rủi ro thấp", tone: "success" },
};

const RECOMMENDATION: Record<string, { label: string; tone: Tone }> = {
  APPROVE: { label: "Nghiêng về chấp thuận", tone: "success" },
  SUPPLEMENT: { label: "Nghiêng về yêu cầu bổ sung", tone: "warning" },
  REJECT: { label: "Nghiêng về từ chối", tone: "danger" },
};

const CHECK_STATUS: Record<string, { label: string; tone: Tone }> = {
  VALID: { label: "Phù hợp", tone: "success" },
  WARNING: { label: "Cần xem", tone: "warning" },
  FLAGGED: { label: "Có cờ", tone: "warning" },
  ANOMALY: { label: "Bất thường", tone: "danger" },
  INVALID: { label: "Không hợp lệ", tone: "danger" },
};

function riskOf(level: string): { label: string; tone: Tone } {
  return RISK[level] ?? { label: level, tone: "neutral" };
}

function recommendationOf(value: string): { label: string; tone: Tone } {
  return RECOMMENDATION[value] ?? { label: value, tone: "neutral" };
}

function checkOf(status: string): { label: string; tone: Tone } {
  return CHECK_STATUS[status.toUpperCase()] ?? { label: status, tone: "neutral" };
}

function RiskIcon({ level }: { level: string }) {
  if (level === "HIGH") {
    return <ShieldAlert className="size-5 shrink-0 text-[#A32119]" aria-hidden="true" />;
  }
  if (level === "MEDIUM") {
    return <AlertTriangle className="size-5 shrink-0 text-[#7A5B25]" aria-hidden="true" />;
  }
  return <ShieldCheck className="size-5 shrink-0 text-[#1F7A55]" aria-hidden="true" />;
}

function CheckIcon({ status }: { status: string }) {
  const tone = checkOf(status).tone;
  if (tone === "success") {
    return <CheckCircle2 className="size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />;
  }
  if (tone === "danger") {
    return <XCircle className="size-4 shrink-0 text-[#A32119]" aria-hidden="true" />;
  }
  if (tone === "warning") {
    return <AlertTriangle className="size-4 shrink-0 text-[#7A5B25]" aria-hidden="true" />;
  }
  return <Info className="size-4 shrink-0 text-heritage-muted" aria-hidden="true" />;
}

function formatTime(value: string): string {
  try {
    return formatDateTime(value);
  } catch {
    return value;
  }
}

/**
 * Gợi ý của AI cho Người xét duyệt. AI chỉ tham khảo: thẻ này không mở biểu mẫu, không điền sẵn lý do và
 * không đổi điều kiện duyệt. Muốn dùng văn bản gợi ý, Người xét duyệt tự sao chép và chỉnh trước khi dán.
 */
export function AiNotaryAssessmentCard({ caseId }: AiNotaryAssessmentCardProps) {
  const [assessment, setAssessment] = useState<AiDossierAnalysisResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: (targetCaseId: string) => verifierReviewService.assessWithAi(targetCaseId),
    onSuccess: (data) => {
      setAssessment(data);
    },
  });

  const handleCopyNote = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Không có quyền clipboard thì bỏ qua; văn bản vẫn hiện để tự chọn và chép.
    }
  };

  const risk = assessment ? riskOf(assessment.riskLevel) : null;
  const recommendation = assessment ? recommendationOf(assessment.recommendation) : null;

  return (
    <Panel
      title={
        <span className="flex flex-wrap items-center gap-2">
          <Sparkles className="size-5 text-heritage-gold" aria-hidden="true" />
          Gợi ý của AI
          <Chip tone="neutral">Chỉ tham khảo</Chip>
        </span>
      }
      action={
        assessment && (
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(caseId)}
          >
            <RefreshCw
              className={`size-4 ${mutation.isPending ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Hỏi lại
          </button>
        )
      }
    >
      {!assessment && !mutation.isPending && !mutation.isError && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl space-y-1">
            <p className="text-sm font-semibold text-heritage-primary">
              AI gợi ý các điểm cần lưu ý. Quyết định vẫn là của bạn.
            </p>
            <p className="text-sm leading-6 text-heritage-muted">
              AI chỉ đọc các thông tin đã nhập trong hồ sơ (họ tên, ngày, số giấy, cờ cảnh báo),
              không xem ảnh giấy tờ và có thể sai. Hãy đối chiếu giấy tờ gốc trước khi quyết định.
            </p>
          </div>
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => mutation.mutate(caseId)}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Xem gợi ý của AI
          </button>
        </div>
      )}

      {mutation.isPending && (
        <p role="status" className="flex items-center gap-3 text-sm text-heritage-muted">
          <RefreshCw className="size-4 animate-spin text-heritage-gold" aria-hidden="true" />
          Đang lấy gợi ý từ AI… Gợi ý chỉ mang tính tham khảo và không thay đổi hồ sơ.
        </p>
      )}

      {mutation.isError && (
        <div role="alert" className="space-y-3 rounded-xl bg-[#F8E1DE] p-4 text-sm text-[#A32119]">
          <p className="font-semibold">Chưa lấy được gợi ý của AI</p>
          <p>
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Bạn vẫn xét duyệt bình thường theo giấy tờ và cảnh báo của hồ sơ."}
          </p>
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => mutation.mutate(caseId)}
          >
            Thử lại
          </button>
        </div>
      )}

      {assessment && risk && recommendation && (
        <div className="space-y-5">
          <p className="rounded-xl bg-[#ECE8DB] px-4 py-2.5 text-xs text-heritage-muted">
            Đây là gợi ý tham khảo của AI, có thể sai. Chấp thuận, yêu cầu bổ sung hoặc từ chối là
            quyết định của Người xét duyệt.
          </p>

          <section aria-label="Mức rủi ro" className="flex items-start gap-3">
            <RiskIcon level={assessment.riskLevel} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Chip tone={risk.tone}>{risk.label}</Chip>
                <span className="text-xs text-heritage-muted">
                  {formatTime(assessment.analyzedAt)}
                </span>
              </div>
              <p className="text-sm font-semibold text-heritage-primary">{assessment.riskReason}</p>
              <p className="text-sm leading-6 text-heritage-muted">{assessment.summary}</p>
            </div>
          </section>

          <section
            aria-label="Gợi ý tham khảo"
            className="space-y-2 border-t border-heritage-border pt-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-heritage-muted">
                Gợi ý tham khảo của AI
              </span>
              <Chip tone={recommendation.tone}>{recommendation.label}</Chip>
            </div>
            <p className="text-sm leading-6 text-heritage-primary">
              {assessment.recommendationReason}
            </p>
          </section>

          {assessment.checklist.length > 0 && (
            <section
              aria-label="Đối chiếu của AI"
              className="space-y-2 border-t border-heritage-border pt-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-heritage-muted">
                AI đối chiếu
              </h3>
              <ul className="divide-y divide-heritage-border">
                {assessment.checklist.map((item) => {
                  const status = checkOf(item.status);
                  return (
                    <li
                      key={item.category}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <CheckIcon status={item.status} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-heritage-primary">
                            {item.category}
                          </span>
                          <Chip tone={status.tone}>{status.label}</Chip>
                        </div>
                        <p className="text-sm leading-6 text-heritage-muted">{item.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section
            aria-label="Văn bản gợi ý"
            className="space-y-2 border-t border-heritage-border pt-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-heritage-muted">
                Văn bản gợi ý (tự chỉnh trước khi dùng)
              </h3>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-heritage-primary hover:bg-[#F4F1E6]"
                onClick={() => void handleCopyNote(assessment.proposedDecisionNote)}
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-[#1F7A55]" aria-hidden="true" />
                    <span className="text-[#1F7A55]">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4" aria-hidden="true" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
            <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-heritage-border bg-white p-3 text-sm leading-6">
              {assessment.proposedDecisionNote}
            </p>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-heritage-border pt-3 text-xs text-heritage-muted">
            <span>Mô hình: {assessment.modelName}</span>
            <span>Chỉ để tham khảo. Quyết định thuộc Người xét duyệt.</span>
          </div>
        </div>
      )}
    </Panel>
  );
}
