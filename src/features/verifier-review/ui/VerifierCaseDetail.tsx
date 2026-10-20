import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { AlertTriangle, CheckCircle2, Download, FileText, ShieldAlert, X } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { HTTP_STATUS } from "@/shared/constants";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { useVerifierCase, verifierKeys } from "../model/useVerifierReview";
import { verifierReviewService } from "../api/verifierReviewService";
import { caseCode } from "../model/caseCode";
import { queueStatus } from "../model/verifierPresentation";
import { VerifierObjectionBlock } from "./VerifierObjectionBlock";
import { getVerifierActions } from "../model/verifierActions";
import {
  flagLabels,
  blockerLabels,
  decisionLabels,
  ownerNoticeLabels,
  type verifierFlagKindSchema,
  type verifierDecisionKindSchema,
  type approveBlockerSchema,
} from "../model/verifierReview.schema";
import type { z } from "zod";

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";

/** Thời điểm theo giờ Việt Nam, không phụ thuộc múi giờ trình duyệt. */
const formatVietnamTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));

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
  const unreviewedFlags = detail.flags.filter((flag) => !flag.reviewedAt).length;
  const openModal = (kind: "approve" | "reject" | "reviewFlag" | "supplement", flagId?: string) => {
    const next = new URLSearchParams(params);
    next.set("modal", kind);
    if (kind === "reviewFlag" && flagId) next.set("flagId", flagId);
    else next.delete("flagId");
    setParams(next);
  };
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={buttonStyles.outline} onClick={backToList}>
            Về hàng chờ
          </button>
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={query.isFetching}
            onClick={() => {
              // Đọc lại chi tiết (kể cả khi cache còn mới) và đánh dấu danh sách cũ để lần mở sau tải lại.
              void query.refetch();
              void client.invalidateQueries({ queryKey: verifierKeys.lists() });
            }}
          >
            Tải lại
          </button>
          <h2 className="text-lg font-semibold">Hồ sơ #{caseCode(detail.id)}</h2>
          <Chip tone={status.tone}>{status.label}</Chip>
          {detail.supplementOverdueAt && <Chip tone="warning">Bổ sung quá hạn</Chip>}
          {detail.closedAt && <Chip tone="neutral">Đóng {formatDate(detail.closedAt)}</Chip>}
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
      <Notice tone="warning" title="Bạn chỉ xác nhận hồ sơ, không xem nội dung kho">
        Quyết định của bạn được ghi lại.
      </Notice>
      <VerifierObjectionBlock
        caseId={detail.id}
        enabled={detail.status === "SUSPENDED"}
        canConclude={!detail.approveBlockers.includes("VERIFIER_CONFLICT")}
      />
      {detail.handover && (
        <Notice tone="success" role="status" title="Hồ sơ đã được chấp thuận">
          Đã mở {detail.handover.turnCount} lượt bàn giao · {detail.handover.invitationsSent} lời
          mời đã gửi · {detail.handover.invitationsFailed} lời mời chưa gửi được.
        </Notice>
      )}
      {detail.status === "SUPPLEMENT_REQUIRED" && (
        <Notice tone="warning" title="Đã gửi yêu cầu bổ sung">
          Người thực hiện sẽ nộp bản bổ sung. Hồ sơ quay lại hàng chờ khi có bản mới.
        </Notice>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <section
            aria-label="Bản đang xét"
            className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
          >
            <h3 className="text-xl font-semibold text-heritage-primary">
              Bản đang xét (v{review.versionNo})
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ tên Owner" value={review.ownerFullName ?? "—"} />
              <Field
                label="CCCD"
                value={review.ownerCitizenId ? review.ownerCitizenId : "—"}
                sensitive={Boolean(review.ownerCitizenId)}
              />
              <Field label="4 số cuối CCCD" value={review.ownerCitizenIdLast4 ?? "—"} />
              <Field label="Ngày mất" value={review.dateOfDeath ?? "—"} />
              <Field label="Số giấy chứng tử" value={review.certificateNumber ?? "—"} />
              <Field label="Ngày cấp" value={review.issuedOn ?? "—"} />
              <Field label="Nơi cấp" value={review.issuedBy ?? "—"} />
              <Field label="Gửi lúc" value={formatDate(review.submittedAt)} />
            </dl>
            <div>
              <h4 className="text-sm font-semibold">Trang giấy tờ</h4>
              {review.files.length === 0 ? (
                <p className="text-sm text-heritage-muted">Không có trang giấy nào.</p>
              ) : (
                <ul className="mt-2 divide-y divide-heritage-border">
                  {review.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <span className="inline-flex min-w-0 items-center gap-3 text-sm">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ECE8DB]">
                          <FileText className="size-5 text-heritage-muted" aria-hidden="true" />
                        </span>
                        <span className="break-all">
                          Trang {file.position} · {file.fileName} ·{" "}
                          {formatStorageSize(file.sizeBytes)}
                        </span>
                      </span>
                      <button
                        type="button"
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
                        Tải nội dung
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <section
            aria-label="Cờ cần xem xét"
            className="space-y-3 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-heritage-primary">Cờ của bản đang xét</h3>
              {unreviewedFlags > 0 && <Chip tone="warning">{unreviewedFlags} cần review</Chip>}
            </div>
            {detail.flags.length === 0 ? (
              <p className="text-sm text-heritage-muted">Không có cờ nào.</p>
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
                          {reviewed ? "Đã review" : "Cần review"}
                        </Chip>
                        {!reviewed && actions.canReviewFlag && (
                          <button
                            type="button"
                            className={buttonStyles.outline}
                            onClick={() => openModal("reviewFlag", flag.id)}
                          >
                            Xem xét
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
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
        <div className="space-y-6">
          <Panel title="Điều kiện để duyệt">
            {!detail.canApprove && detail.approveBlockers.length > 0 ? (
              <div role="status" className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-[#7A5B25]">
                  <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <ul className="list-disc space-y-1 pl-4">
                    {detail.approveBlockers.map((item) => (
                      <li key={item}>
                        {blockerLabels[item as z.infer<typeof approveBlockerSchema>]}
                      </li>
                    ))}
                  </ul>
                </div>
                <Chip tone="danger">Chặn duyệt</Chip>
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
          {actions.canReject && (
            <Panel title="Quyết định">
              <div className="flex flex-wrap gap-3">
                {actions.canRequestSupplement && (
                  <button
                    type="button"
                    className={buttonStyles.outline}
                    onClick={() => openModal("supplement")}
                  >
                    <AlertTriangle className="size-4" aria-hidden="true" />
                    Yêu cầu bổ sung
                  </button>
                )}
                {actions.canOpenApprove && (
                  <button
                    type="button"
                    className={buttonStyles.gold}
                    disabled={!detail.canApprove}
                    onClick={() => openModal("approve")}
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Duyệt mở bàn giao
                  </button>
                )}
                <button
                  type="button"
                  className={buttonStyles.danger}
                  onClick={() => openModal("reject")}
                >
                  <X className="size-4" aria-hidden="true" />
                  Từ chối
                </button>
              </div>
              <p className="mt-4 text-xs text-heritage-muted">
                Quyết định được ghi nhật ký và gửi tới người thực hiện. Chấp thuận chưa mở kho;
                người nhận còn phải xác minh.
              </p>
            </Panel>
          )}
          <section
            aria-label="Mốc thời gian"
            className="space-y-3 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
          >
            <h3 className="text-xl font-semibold text-heritage-primary">Mốc thời gian</h3>
            <dl className="grid gap-4">
              <Field
                label="Hết hạn phản đối"
                value={detail.objectionEndsAt ? formatDate(detail.objectionEndsAt) : "Chưa bắt đầu"}
              />
              <Field
                label="Báo Owner"
                value={
                  detail.ownerNotice
                    ? detail.ownerNotice.status === "DELIVERED" && detail.ownerNotice.deliveredAt
                      ? `${ownerNoticeLabels.DELIVERED} ${formatDate(detail.ownerNotice.deliveredAt)}`
                      : ownerNoticeLabels[detail.ownerNotice.status]
                    : "Chưa có"
                }
              />
            </dl>
          </section>
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
