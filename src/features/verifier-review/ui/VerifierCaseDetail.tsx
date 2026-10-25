import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useId, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Download,
  Eye,
  FileText,
  RefreshCw,
  TriangleAlert,
  X,
} from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { HTTP_STATUS } from "@/shared/constants";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { useVerifierCase, verifierKeys } from "../model/useVerifierReview";
import { verifierReviewService } from "../api/verifierReviewService";
import { caseCode } from "../model/caseCode";
import { conditionRows, queueStatus } from "../model/verifierPresentation";
import { VerifierObjectionBlock } from "./VerifierObjectionBlock";
import { VerifierOwnerIdentityPanel } from "./VerifierOwnerIdentityPanel";
import { AiNotaryAssessmentCard } from "./AiNotaryAssessmentCard";
import { getVerifierActions } from "../model/verifierActions";
import {
  flagLabels,
  decisionLabels,
  supplementPartLabels,
  ownerNoticeLabels,
  type verifierFlagKindSchema,
  type verifierDecisionKindSchema,
} from "../model/verifierReview.schema";
import { formatDateTime } from "@/shared/lib/dateFormat";
import type { z } from "zod";

const formatDate = (value: string | null) => (value ? formatDateTime(value) : "—");

/** Dạng gọn "18/10/2026 07:20" cho mốc thời gian; ngày đứng trước giờ. */
const formatCompact = (value: string) => {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(new Date(value));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("day")}/${pick("month")}/${pick("year")} ${pick("hour")}:${pick("minute")}`;
};

/** Ngày dạng "05/10/2026" từ chuỗi ISO yyyy-mm-dd của BE; thiếu thì hiện "—". */
const formatDay = (value: string | null) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

/** Thời điểm theo giờ Việt Nam, không phụ thuộc múi giờ trình duyệt. */
const formatVietnamTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));

const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
};

const blobName = (item: { fileName: string }) =>
  item.fileName.replace(/[^\p{L}\p{N} ._()-]/gu, "_");

/** Chi tiết một hồ sơ; mọi action dùng usePrivateAction; download qua blob ephemeral. */
export function VerifierCaseDetail({ caseId }: { caseId: string }) {
  const [params, setParams] = useSearchParams();
  const download = usePrivateAction();
  const query = useVerifierCase(caseId);
  const client = useQueryClient();
  const backToList = () => {
    const next = new URLSearchParams(params);
    next.delete("caseId");
    next.delete("modal");
    next.delete("flagId");
    next.delete("reason");
    setParams(next);
    void client.invalidateQueries({ queryKey: verifierKeys.lists() });
  };
  if (query.isPending)
    return (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải hồ sơ…
      </p>
    );
  if (query.isError) {
    // 404 DEATH_CASE_NOT_FOUND: hồ sơ không tồn tại hoặc phân công đã kết thúc (giao lại Verifier khác).
    if (isAxiosError(query.error) && query.error.response?.status === HTTP_STATUS.NOT_FOUND)
      return (
        <div role="alert" className="space-y-3 rounded-2xl bg-[#F1E6CC] p-5">
          <p className="text-sm text-[#5A4318]">Hồ sơ không còn được giao cho bạn.</p>
          <button type="button" className={buttonStyles.dark} onClick={backToList}>
            Về danh sách
          </button>
        </div>
      );
    return (
      <div role="alert" className="space-y-3 rounded-2xl bg-[#F8E1DE] p-5">
        <p className="text-sm text-[#7A1A14]">
          Không đọc được hồ sơ hoặc bạn không có quyền trong kho này.
        </p>
        <button
          type="button"
          className={buttonStyles.dark}
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          Thử lại
        </button>
      </div>
    );
  }
  const detail = query.data;
  const review = detail.reviewVersion;
  const status = queueStatus[detail.status];
  const actions = getVerifierActions(detail);
  const latestSupplement = detail.decisions
    .filter((decision) => decision.kind === "SUPPLEMENT_REQUESTED")
    .sort((a, b) => a.decidedAt.localeCompare(b.decidedAt))
    .at(-1);
  const requestedPartsText = (latestSupplement?.requestedParts ?? [])
    .map((part) => supplementPartLabels[part].toLocaleLowerCase("vi-VN"))
    .join(", ");
  const unreviewedFlags = detail.flags.filter((flag) => !flag.reviewedAt).length;
  const objectionEnded =
    detail.objectionEndsAt !== null &&
    new Date(detail.objectionEndsAt).getTime() <= query.dataUpdatedAt;
  const notice = detail.ownerNotice;
  const noticeDelivered =
    notice !== null && notice.status === "DELIVERED" && notice.deliveredAt !== null;
  let noticeText = "Chưa có";
  if (notice !== null && noticeDelivered && notice.deliveredAt !== null) {
    noticeText = `${ownerNoticeLabels.DELIVERED} ${formatCompact(notice.deliveredAt)}`;
  } else if (notice !== null) {
    noticeText = ownerNoticeLabels[notice.status];
  }
  let objectionText = "Chưa bắt đầu";
  if (detail.objectionEndsAt !== null) {
    let remainText = "đã qua";
    if (!objectionEnded) {
      const hoursLeft = Math.max(
        1,
        Math.ceil((new Date(detail.objectionEndsAt).getTime() - query.dataUpdatedAt) / 3_600_000),
      );
      remainText = `còn ${hoursLeft} giờ`;
    }
    objectionText = `${formatCompact(detail.objectionEndsAt)} · ${remainText}`;
  }
  const timeline = [
    { label: "Đã báo chủ kho", text: noticeText, done: noticeDelivered },
    { label: "Hết hạn phản đối", text: objectionText, done: objectionEnded },
  ];
  // Khi chờ bổ sung BE chưa tính hạn mới, nên không hiện mốc hạn xét.
  if (detail.status !== "SUPPLEMENT_REQUIRED" && detail.assignment.dueAt) {
    timeline.push({
      label: "Hạn xét duyệt",
      text: formatCompact(detail.assignment.dueAt),
      done: false,
    });
  }
  const conditions = conditionRows(
    detail.approveBlockers,
    detail.objectionEndsAt,
    unreviewedFlags,
    query.dataUpdatedAt,
  );
  const blockedReason = conditions.map((row) => row.reason).join("; ");
  const openModal = (kind: "approve" | "reject" | "reviewFlag" | "supplement", flagId?: string) => {
    const next = new URLSearchParams(params);
    next.set("modal", kind);
    if (kind === "reviewFlag" && flagId) next.set("flagId", flagId);
    else next.delete("flagId");
    next.delete("reason");
    setParams(next);
  };
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-heritage-primary">
              Hồ sơ #{caseCode(detail.id)}
            </h2>
            <Chip tone={status.tone}>{status.label}</Chip>
            {detail.supplementOverdueAt && <Chip tone="warning">Bổ sung quá hạn</Chip>}
            {detail.closedAt && <Chip tone="neutral">Đóng {formatDate(detail.closedAt)}</Chip>}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className={buttonStyles.outline} onClick={backToList}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Về hàng chờ
            </button>
            <button
              type="button"
              aria-label="Tải lại"
              title="Tải lại"
              className={buttonStyles.outline}
              disabled={query.isFetching}
              onClick={() => {
                // Đọc lại chi tiết (kể cả khi cache còn mới) và đánh dấu danh sách cũ để lần mở sau tải lại.
                void query.refetch();
                void client.invalidateQueries({ queryKey: verifierKeys.lists() });
              }}
            >
              <RefreshCw
                className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        <p className="text-sm text-heritage-muted">
          Kho: {detail.vaultId} · Phân công từ {formatDate(detail.assignment.assignedAt)} ·{" "}
          {/* BE không tính quá hạn khi chờ bổ sung; dueAt được tính lại lúc Executor gửi lại. */}
          {detail.status === "SUPPLEMENT_REQUIRED"
            ? "Đang chờ Executor bổ sung"
            : `Hạn xét ${formatDate(detail.assignment.dueAt)}`}
        </p>
        {detail.supplementOverdueAt && (
          <p className="text-sm text-[#7A5B25]">
            Executor bổ sung quá hạn từ {formatVietnamTime(detail.supplementOverdueAt)} (giờ Việt
            Nam).
          </p>
        )}
      </header>
      <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#5A4318]">
        Bạn chỉ xác nhận hồ sơ, không xem nội dung kho. Quyết định của bạn được ghi lại.
      </p>
      <VerifierObjectionBlock
        caseId={detail.id}
        enabled={detail.status === "SUSPENDED"}
        canConclude={!detail.approveBlockers.includes("VERIFIER_CONFLICT")}
        ownerIdentity={detail.ownerIdentity}
      />
      {detail.handover && (
        <Notice tone="success" role="status" title="Hồ sơ đã được chấp thuận">
          Đã mở {detail.handover.turnCount} lượt bàn giao · {detail.handover.invitationsSent} lời
          mời đã gửi · {detail.handover.invitationsFailed} lời mời chưa gửi được.
        </Notice>
      )}
      {detail.status === "SUPPLEMENT_REQUIRED" && (
        <Notice tone="warning" title="Đã gửi yêu cầu bổ sung">
          {requestedPartsText && <span className="block">Đã yêu cầu: {requestedPartsText}.</span>}
          Người thực hiện sẽ nộp bản bổ sung. Hồ sơ quay lại hàng chờ khi có bản mới.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* CỘT TRÁI (3fr): HỒ SƠ & TÀI LIỆU CHỨNG TỪ */}
        <div className="space-y-6">
          <section
            aria-label="Bản đang xét"
            className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
          >
            <h3 className="text-xl font-semibold text-heritage-primary">
              Bản đang xét (v{review.versionNo})
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ tên chủ kho" value={review.ownerFullName ?? "—"} />
              <Field
                label="CCCD (theo giấy tờ)"
                value={review.ownerCitizenId ? review.ownerCitizenId : "—"}
                sensitive={Boolean(review.ownerCitizenId)}
              />
              <Field label="Ngày mất" value={formatDay(review.dateOfDeath)} />
              <Field label="Số giấy chứng tử" value={review.certificateNumber ?? "—"} />
              <Field label="Ngày cấp" value={formatDay(review.issuedOn)} />
              <Field label="Nơi cấp" value={review.issuedBy ?? "—"} />
              <Field
                label="Gửi lúc"
                value={review.submittedAt ? formatCompact(review.submittedAt) : "—"}
              />
            </dl>
            <div>
              <h4 className="text-sm font-semibold">Trang giấy tờ</h4>
              {review.files.length === 0 ? (
                <p className="text-sm text-heritage-muted">Không có trang giấy nào.</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {review.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-heritage-border bg-white p-3"
                    >
                      <span className="inline-flex min-w-0 items-center gap-3 text-sm">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ECE8DB]">
                          <FileText className="size-5 text-heritage-muted" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block break-all font-semibold">
                            Trang {file.position} · {file.fileName}
                          </span>
                          <span className="block text-xs text-heritage-muted">
                            {FILE_TYPE_LABELS[file.contentType] ?? "Tệp"} ·{" "}
                            {formatStorageSize(file.sizeBytes)}
                          </span>
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Xem trang ${file.position}`}
                          className={buttonStyles.outline}
                          disabled={download.pending}
                          onClick={() =>
                            void download.execute(
                              () => verifierReviewService.downloadFile(detail.id, file.id),
                              (blob) => {
                                // Mở ở tab mới; blob chỉ nằm trong RAM và bị thu hồi sau 1 phút.
                                const url = URL.createObjectURL(blob);
                                window.open(url, "_blank", "noopener");
                                setTimeout(() => URL.revokeObjectURL(url), 60_000);
                              },
                            )
                          }
                        >
                          <Eye className="size-4" aria-hidden="true" />
                          Xem
                        </button>
                        <button
                          type="button"
                          aria-label={`Tải xuống trang ${file.position}`}
                          className={buttonStyles.outline}
                          disabled={download.pending}
                          onClick={() =>
                            void download.execute(
                              () => verifierReviewService.downloadFile(detail.id, file.id),
                              (blob) => {
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = blobName(file);
                                link.click();
                                setTimeout(() => URL.revokeObjectURL(url), 1000);
                              },
                            )
                          }
                        >
                          <Download className="size-4" aria-hidden="true" />
                          Tải xuống
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <VerifierOwnerIdentityPanel
            caseId={detail.id}
            review={review}
            identity={detail.ownerIdentity}
          />
          <section
            aria-label="Cảnh báo cần kiểm tra"
            className="space-y-3 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-heritage-primary">
                Cảnh báo của hồ sơ này
              </h3>
              {unreviewedFlags > 0 && <Chip tone="warning">{unreviewedFlags} chưa kiểm tra</Chip>}
            </div>
            <p className="text-sm text-heritage-muted">
              Hệ thống tự phát hiện những điểm bất thường khi người thực hiện nộp hồ sơ, ví dụ chủ
              kho vẫn điểm danh sau ngày mất hoặc CCCD không khớp. Bạn cần kiểm tra từng cảnh báo và
              ghi chú trước khi chấp thuận.
            </p>
            {detail.flags.length === 0 ? (
              <p className="text-sm text-heritage-muted">Không có cảnh báo nào.</p>
            ) : (
              <ul className="divide-y divide-heritage-border">
                {detail.flags.map((flag) => {
                  const reviewed = Boolean(flag.reviewedAt);
                  return (
                    <li
                      key={flag.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {flagLabels[flag.kind as z.infer<typeof verifierFlagKindSchema>]}
                        </p>
                        <p className="text-sm text-heritage-muted">{flag.detail}</p>
                        {flag.reviewNote && (
                          <p className="mt-1 text-sm">Ghi chú: {flag.reviewNote}</p>
                        )}
                        <p className="mt-1 text-xs text-heritage-muted">
                          Tạo {formatDate(flag.createdAt)} ·{" "}
                          {reviewed ? `Đã xét ${formatDate(flag.reviewedAt)}` : "Chưa xét"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Chip tone={reviewed ? "success" : "warning"}>
                          {reviewed ? "Đã kiểm tra" : "Chưa kiểm tra"}
                        </Chip>
                        {!reviewed && actions.canReviewFlag && (
                          <button
                            type="button"
                            className={buttonStyles.outline}
                            onClick={() => openModal("reviewFlag", flag.id)}
                          >
                            Kiểm tra
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          {/* Gợi ý của AI chỉ để tham khảo, đặt sau hồ sơ và cảnh báo: không mở biểu mẫu, không điền sẵn lý do. */}
          <AiNotaryAssessmentCard caseId={detail.id} />
          {detail.versions.length > 0 && (
            <section
              aria-label="Các bản cũ"
              className="space-y-2 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
            >
              <h3 className="text-xl font-semibold text-heritage-primary">Các bản cũ</h3>
              <ul className="divide-y divide-heritage-border text-sm">
                {detail.versions.map((v) => (
                  <li
                    key={v.versionNo}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                  >
                    <span>
                      v{v.versionNo} · ****{v.ownerCitizenIdLast4 ?? "—"} · {v.dateOfDeath ?? "—"} ·{" "}
                      {formatDate(v.submittedAt)}
                    </span>
                    <span className="text-xs text-heritage-muted">{v.files.length} trang</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {detail.decisions.length > 0 && (
            <section
              aria-label="Lịch sử quyết định"
              className="space-y-2 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
            >
              <h3 className="text-xl font-semibold text-heritage-primary">Lịch sử quyết định</h3>
              <ul className="divide-y divide-heritage-border text-sm">
                {detail.decisions.map((decision) => (
                  <li
                    key={`${decision.kind}-${decision.versionNo}-${decision.decidedAt}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0"
                  >
                    <span>
                      v{decision.versionNo} ·{" "}
                      {decisionLabels[decision.kind as z.infer<typeof verifierDecisionKindSchema>]}{" "}
                      · {decision.reason}
                    </span>
                    <span className="text-xs text-heritage-muted">
                      {formatDate(decision.decidedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* CỘT PHẢI (2fr): ĐIỀU KIỆN → QUYẾT ĐỊNH → MỐC THỜI GIAN, theo thiết kế 184/185 */}
        <div className="space-y-6">
          {/* 1. ĐIỀU KIỆN ĐỂ DUYỆT */}
          <Panel title="Điều kiện để duyệt">
            {!detail.canApprove && conditions.length > 0 ? (
              <div role="status" className="rounded-xl bg-[#F8E1DE] p-4 text-sm text-[#7A1A14]">
                <p>Chưa thể duyệt vì: {blockedReason}. Bạn có thể yêu cầu bổ sung hoặc từ chối.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {conditions.map((row) => (
                    <li key={row.key}>{row.detail}</li>
                  ))}
                </ul>
              </div>
            ) : detail.canApprove ? (
              <p role="status" className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-5 text-[#1F7A55]" aria-hidden="true" />
                Đủ điều kiện duyệt.
              </p>
            ) : (
              <p className="text-sm text-heritage-muted">Không có điều kiện chặn.</p>
            )}
          </Panel>

          {/* 2. QUYẾT ĐỊNH: ba ô có icon và mô tả */}
          {actions.canReject && (
            <Panel title="Quyết định">
              <div className="space-y-3">
                {actions.canOpenApprove && (
                  <DecisionTile
                    tone="approve"
                    icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
                    title="Duyệt mở bàn giao"
                    description={
                      detail.canApprove
                        ? "Hồ sơ hợp lệ. Người nhận sẽ được mời xác minh."
                        : `Chưa duyệt được: ${blockedReason}.`
                    }
                    disabled={!detail.canApprove}
                    onClick={() => openModal("approve")}
                  />
                )}
                {actions.canRequestSupplement && (
                  <DecisionTile
                    tone="supplement"
                    icon={<TriangleAlert className="size-5" aria-hidden="true" />}
                    title="Yêu cầu bổ sung"
                    description="Gửi lại cho người thực hiện, kèm lý do."
                    onClick={() => openModal("supplement")}
                  />
                )}
                <DecisionTile
                  tone="reject"
                  icon={<X className="size-5" aria-hidden="true" />}
                  title="Từ chối"
                  description="Hồ sơ không hợp lệ. Cần nêu lý do."
                  onClick={() => openModal("reject")}
                />
              </div>
              <p className="mt-4 text-sm text-heritage-muted">
                Quyết định được ghi nhật ký và gửi tới người thực hiện. Chấp thuận chưa mở kho;
                người nhận còn phải xác minh.
              </p>
            </Panel>
          )}

          {/* 3. MỐC THỜI GIAN */}
          <section
            aria-label="Mốc thời gian"
            className="space-y-3 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
          >
            <h3 className="text-xl font-semibold text-heritage-primary">Mốc thời gian</h3>
            <ol className="space-y-5">
              {timeline.map((item) => (
                <li key={item.label} className="flex gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${item.done ? "bg-[#2E9E6E]" : "bg-[#BDB8A6]"}`}
                  />
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-heritage-muted">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 4. HỒ SƠ TRƯỚC BỊ TỪ CHỐI (NẾU CÓ) */}
          {detail.previousCase && (
            <section
              aria-label="Hồ sơ trước bị từ chối"
              className="space-y-2 rounded-2xl border border-[#E6C98B] bg-[#F1E6CC] p-6 text-sm text-[#5A4318]"
            >
              <h3 className="text-lg font-semibold">Hồ sơ trước của kho này đã bị từ chối</h3>
              <p>Đóng lúc: {formatDate(detail.previousCase.closedAt)}</p>
              <p className="break-words">Lý do: {detail.previousCase.rejectReason ?? "—"}</p>
            </section>
          )}
        </div>
      </div>
      {download.error && (
        <p role="alert" className="text-sm text-destructive">
          {download.error}
        </p>
      )}
    </article>
  );
}

const DECISION_TILE_STYLES = {
  approve: {
    tile: "border-transparent bg-[#E0C486] text-[#0A281E] hover:bg-[#E8CF9B]",
    icon: "bg-[#0A281E]/10 text-[#0A281E]",
    title: "text-[#0A281E]",
    text: "text-[#3D3A2E]",
  },
  supplement: {
    tile: "border-[#0A281E] bg-white text-[#0A281E] hover:bg-[#F4F1E6]",
    icon: "bg-[#ECE8DB] text-[#0A281E]",
    title: "text-[#0A281E]",
    text: "text-heritage-muted",
  },
  reject: {
    tile: "border-[#A32119] bg-white hover:bg-[#FBEFED]",
    icon: "bg-[#F8E1DE] text-[#A32119]",
    title: "text-[#A32119]",
    text: "text-[#A32119]",
  },
} as const;

/** Ô quyết định: icon tròn, tiêu đề và một dòng mô tả; ô duyệt bị khóa hiện nền xám và lý do. */
function DecisionTile({
  tone,
  icon,
  title,
  description,
  disabled,
  onClick,
}: {
  tone: keyof typeof DECISION_TILE_STYLES;
  icon: ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const descriptionId = useId();
  const style = DECISION_TILE_STYLES[tone];
  let tileClass: string = style.tile;
  let iconClass: string = style.icon;
  let titleClass: string = style.title;
  let textClass: string = style.text;
  if (disabled) {
    tileClass = "cursor-not-allowed border-transparent bg-[#ECE8DB]";
    iconClass = "bg-[#DAD5C5] text-[#8A8574]";
    titleClass = "text-[#8A8574]";
    textClass = "text-[#8A8574]";
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={title}
      aria-describedby={descriptionId}
      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold ${tileClass}`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className={`block font-semibold ${titleClass}`}>{title}</span>
        <span id={descriptionId} className={`block text-sm ${textClass}`}>
          {description}
        </span>
      </span>
    </button>
  );
}

function Field({ label, value, sensitive }: { label: string; value: string; sensitive?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-heritage-muted">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-semibold ${sensitive ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
