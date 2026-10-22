import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  FileCheck,
  Info,
} from "lucide-react";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { verifierReviewService } from "../api/verifierReviewService";
import type { AiDossierAnalysisResponse } from "../model/verifierReview.schema";
import type { VerifierActions } from "../model/verifierActions";

interface AiNotaryAssessmentCardProps {
  caseId: string;
  actions?: VerifierActions;
  onSelectAction?: (action: "approve" | "supplement" | "reject", suggestedNote?: string) => void;
}

const formatVietnamTime = (value: string) => {
  try {
    return formatDateTime(value);
  } catch {
    return value;
  }
};

export function AiNotaryAssessmentCard({ caseId, actions, onSelectAction }: AiNotaryAssessmentCardProps) {
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
      // Bỏ qua lỗi clipboard
    }
  };

  const getRiskTone = (level: string) => {
    switch (level) {
      case "HIGH":
        return {
          chip: "danger" as const,
          bg: "bg-[#F8E1DE] border-[#A32119]/30 text-[#7A1A14]",
          icon: <ShieldAlert className="size-5 text-[#A32119]" aria-hidden="true" />,
          label: "RỦI RO CAO",
        };
      case "MEDIUM":
        return {
          chip: "warning" as const,
          bg: "bg-[#F1E6CC] border-[#7A5B25]/30 text-[#5A4318]",
          icon: <AlertTriangle className="size-5 text-[#7A5B25]" aria-hidden="true" />,
          label: "RỦI RO TRUNG BÌNH",
        };
      default:
        return {
          chip: "success" as const,
          bg: "bg-[#DDEFE6] border-[#1F7A55]/30 text-[#0F4A32]",
          icon: <ShieldCheck className="size-5 text-[#1F7A55]" aria-hidden="true" />,
          label: "RỦI RO THẤP",
        };
    }
  };

  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case "APPROVE":
        return {
          label: "CHẤP THUẬN",
          tone: "success" as const,
          badgeBg: "bg-[#1F7A55] text-white",
          actionType: "approve" as const,
          isAllowed: actions ? actions.canOpenApprove : true,
          disabledReason: "Hồ sơ chưa đủ điều kiện chấp thuận (hoặc đang có cờ/chặn duyệt).",
        };
      case "SUPPLEMENT":
        return {
          label: "YÊU CẦU BỔ SUNG",
          tone: "warning" as const,
          badgeBg: "bg-[#7A5B25] text-white",
          actionType: "supplement" as const,
          isAllowed: actions ? actions.canRequestSupplement : true,
          disabledReason: "Hồ sơ hiện đang ở trạng thái chờ Executor bổ sung (SUPPLEMENT_REQUIRED), chưa thể gửi thêm yêu cầu.",
        };
      case "REJECT":
        return {
          label: "TỪ CHỐI",
          tone: "danger" as const,
          badgeBg: "bg-[#A32119] text-white",
          actionType: "reject" as const,
          isAllowed: actions ? actions.canReject : true,
          disabledReason: "Hồ sơ không thể từ chối trong trạng thái hiện tại.",
        };
      default:
        return {
          label: rec,
          tone: "neutral" as const,
          badgeBg: "bg-[#4D4D4B] text-white",
          actionType: "supplement" as const,
          isAllowed: actions ? actions.canRequestSupplement : true,
          disabledReason: "Thao tác không khả dụng.",
        };
    }
  };

  const getChecklistIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s === "VALID") {
      return <CheckCircle2 className="size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />;
    }
    if (s === "WARNING") {
      return <AlertTriangle className="size-4 shrink-0 text-[#7A5B25]" aria-hidden="true" />;
    }
    if (s === "ANOMALY" || s === "INVALID") {
      return <XCircle className="size-4 shrink-0 text-[#A32119]" aria-hidden="true" />;
    }
    return <Info className="size-4 shrink-0 text-heritage-gold" aria-hidden="true" />;
  };

  return (
    <Panel
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-heritage-gold animate-pulse" aria-hidden="true" />
          <span>Gemini AI Notary Co-Pilot</span>
          <span className="hidden sm:inline-block rounded-md bg-[#ECE8DB] px-2 py-0.5 text-[11px] font-normal text-heritage-muted">
            gemini-flash-lite
          </span>
        </div>
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
              className={`size-3.5 ${mutation.isPending ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Thẩm định lại
          </button>
        )
      }
      className="border-heritage-gold/40 bg-gradient-to-r from-heritage-surface via-[#FAF8F3] to-[#F7F4EC] shadow-xs"
    >
      {!assessment && !mutation.isPending && !mutation.isError && (
        <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div className="max-w-2xl space-y-1">
            <p className="text-sm font-medium text-heritage-primary">
              Trợ lý AI hỗ trợ rà soát 4 tiêu chuẩn pháp lý trước khi ra phán quyết
            </p>
            <p className="text-xs leading-relaxed text-heritage-muted">
              Tự động đối chiếu CCCD chủ kho với hồ sơ eKYC, phân tích trật tự mốc thời gian tử vong so với lịch sử điểm danh sinh tồn (DMS), kiểm tra tính hợp pháp của trích lục chứng tử và phát hiện cờ gian lận.
            </p>
          </div>
          <button
            type="button"
            className={buttonStyles.gold}
            onClick={() => mutation.mutate(caseId)}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Bắt đầu thẩm định AI
          </button>
        </div>
      )}

      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
          <RefreshCw className="size-7 animate-spin text-heritage-gold" aria-hidden="true" />
          <p className="text-sm font-semibold text-heritage-primary">
            Đang đối chiếu dữ liệu với Google Gemini AI…
          </p>
          <p className="text-xs text-heritage-muted max-w-sm">
            Hệ thống đang kiểm tra CCCD, trật tự thời gian điểm danh sinh tồn và tính toàn vẹn của chứng từ.
          </p>
        </div>
      )}

      {mutation.isError && (
        <div className="space-y-3 rounded-xl bg-[#F8E1DE] p-4 text-sm text-[#7A1A14]">
          <p className="font-semibold">Không thể kết nối trợ lý AI</p>
          <p className="text-xs">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Vui lòng thử lại hoặc rà soát thủ công theo quy trình."}
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

      {assessment && (
        <div className="space-y-5">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cột trái: Tóm tắt rủi ro & Đề xuất phán quyết */}
            <div className="space-y-4">
              {/* Tóm tắt & Rủi ro */}
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 ${getRiskTone(assessment.riskLevel).bg}`}
              >
                <div className="mt-0.5">{getRiskTone(assessment.riskLevel).icon}</div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold tracking-wide">
                      {getRiskTone(assessment.riskLevel).label}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {formatVietnamTime(assessment.analyzedAt)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold">{assessment.riskReason}</p>
                  <p className="text-xs leading-relaxed opacity-90">{assessment.summary}</p>
                </div>
              </div>

              {/* Đề xuất quyết định */}
              {(() => {
                const recStyle = getRecommendationStyle(assessment.recommendation);
                return (
                  <div className="space-y-3 rounded-xl border border-heritage-border bg-white p-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-heritage-muted uppercase tracking-wider">
                        Đề xuất quyết định của AI
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${recStyle.badgeBg}`}
                      >
                        {recStyle.label}
                      </span>
                    </div>
                    <p className="text-sm text-heritage-primary font-medium">
                      {assessment.recommendationReason}
                    </p>

                    {onSelectAction && (
                      <div className="pt-1">
                        <button
                          type="button"
                          className={buttonStyles.gold}
                          disabled={!recStyle.isAllowed}
                          onClick={() =>
                            onSelectAction(
                              recStyle.actionType,
                              assessment.proposedDecisionNote,
                            )
                          }
                        >
                          <FileCheck className="size-4" aria-hidden="true" />
                          Mở biểu mẫu {recStyle.label.toLowerCase()}
                        </button>
                        {!recStyle.isAllowed && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#7A5B25]">
                            <Info className="size-3.5 shrink-0" aria-hidden="true" />
                            <span>{recStyle.disabledReason}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Cột phải: Bảng 4 tiêu chí & Văn bản gợi ý */}
            <div className="space-y-4">
              {/* Bảng đối chiếu 4 tiêu chí */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-heritage-muted uppercase tracking-wider">
                  Bảng đối chiếu 4 tiêu chí pháp lý
                </h4>
                <div className="divide-y divide-heritage-border rounded-xl border border-heritage-border bg-white text-xs">
                  {assessment.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5">
                      <div className="mt-0.5">{getChecklistIcon(item.status)}</div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-heritage-primary">
                            {item.category}
                          </span>
                          <Chip
                            tone={
                              item.status.toUpperCase() === "VALID"
                                ? "success"
                                : item.status.toUpperCase() === "WARNING"
                                  ? "warning"
                                  : "danger"
                            }
                            className="text-[10px] py-0 px-1.5"
                          >
                            {item.status}
                          </Chip>
                        </div>
                        <p className="text-heritage-muted leading-relaxed">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Văn bản ghi chú đề xuất */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-heritage-muted uppercase tracking-wider">
                    Văn bản phản hồi gợi ý
                  </h4>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-heritage-gold hover:underline cursor-pointer"
                    onClick={() => handleCopyNote(assessment.proposedDecisionNote)}
                  >
                    {copied ? (
                      <>
                        <Check className="size-3 text-[#1F7A55]" aria-hidden="true" />
                        <span className="text-[#1F7A55] font-medium">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" aria-hidden="true" />
                        <span>Sao chép lý do</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="rounded-xl border border-heritage-border bg-[#FBF9F4] p-2.5 text-xs leading-relaxed text-[#2C2B29] font-mono select-all max-h-32 overflow-y-auto">
                  {assessment.proposedDecisionNote}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-heritage-muted pt-2 border-t border-heritage-border/60">
            <span>Mô hình: {assessment.modelName}</span>
            <span>Khuyến nghị AI có giá trị tham khảo chuyên môn công chứng</span>
          </div>
        </div>
      )}
    </Panel>
  );
}
