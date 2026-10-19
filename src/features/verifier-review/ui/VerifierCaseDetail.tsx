import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { CheckCircle2, AlertTriangle, ShieldAlert, FileText, Download, X } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { HTTP_STATUS } from "@/shared/constants";
import { Button } from "@/shared/ui/button";
import { useVerifierCase, verifierKeys } from "../model/useVerifierReview";
import { verifierReviewService } from "../api/verifierReviewService";
import { caseCode } from "../model/caseCode";
import { getVerifierActions } from "../model/verifierActions";
import {
  caseStatusLabels,
  flagLabels,
  blockerLabels,
  decisionLabels,
  ownerNoticeLabels,
  type verifierCaseStatusSchema,
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
        <div role="alert" className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">Hồ sơ không còn được giao cho bạn.</p>
          <Button type="button" onClick={backToList}>
            Về danh sách
          </Button>
        </div>
      );
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Không đọc được hồ sơ hoặc bạn không có quyền trong kho này.
        </p>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại
        </Button>
      </div>
    );
  }
  const detail = query.data;
  const review = detail.reviewVersion;
  const status = caseStatusLabels[detail.status as z.infer<typeof verifierCaseStatusSchema>];
  const actions = getVerifierActions(detail);
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
          <h2 className="text-lg font-semibold">Hồ sơ #{caseCode(detail.id)}</h2>
          <span className="rounded-full bg-heritage-primary/10 px-3 py-1 text-xs font-semibold text-heritage-primary">
            {status}
          </span>
          {detail.supplementOverdueAt && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Bổ sung quá hạn
            </span>
          )}
          {detail.closedAt && (
            <span className="rounded-full bg-heritage-muted/10 px-3 py-1 text-xs font-semibold text-heritage-muted">
              Đóng {formatDate(detail.closedAt)}
            </span>
          )}
        </div>
        <p className="text-sm text-heritage-muted">
          Kho: {detail.vaultId} · Phân công từ {formatDate(detail.assignment.assignedAt)} ·{" "}
          {/* BE không tính quá hạn khi chờ bổ sung; dueAt được tính lại lúc Executor gửi lại. */}
          {detail.status === "SUPPLEMENT_REQUIRED"
            ? "Đang chờ Executor bổ sung"
            : `Hạn xét ${formatDate(detail.assignment.dueAt)}`}
        </p>
        {detail.supplementOverdueAt && (
          <p className="text-sm text-amber-800">
            Executor bổ sung quá hạn từ {formatVietnamTime(detail.supplementOverdueAt)} (giờ Việt
            Nam).
          </p>
        )}
      </header>
      <section
        aria-label="Mốc thời gian"
        className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-5"
      >
        <h3 className="font-semibold">Mốc thời gian</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
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
          className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800"
        >
          <h3 className="font-semibold">Hồ sơ trước của kho này đã bị từ chối</h3>
          <p>Đóng lúc: {formatDate(detail.previousCase.closedAt)}</p>
          <p className="break-words">Lý do: {detail.previousCase.rejectReason ?? "—"}</p>
        </section>
      )}
      <section
        aria-label="Bản đang xét"
        className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-5"
      >
        <h3 className="font-semibold">Bản đang xét (v{review.versionNo})</h3>
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
            <ul className="mt-2 space-y-2">
              {review.files.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-heritage-border p-3"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-sm">
                    <FileText className="size-4 text-heritage-gold" aria-hidden="true" />
                    <span className="break-all">
                      Trang {file.position} · {file.fileName} ·{" "}
                      {file.sizeBytes.toLocaleString("vi-VN")} byte
                    </span>
                  </span>
                  <Button
                    variant="outline"
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
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      {detail.versions.length > 0 && (
        <section
          aria-label="Các bản cũ"
          className="space-y-2 rounded-xl border border-heritage-border bg-heritage-surface p-5"
        >
          <h3 className="font-semibold">Các bản cũ</h3>
          <ul className="space-y-1 text-sm">
            {detail.versions.map((v) => (
              <li key={v.versionNo} className="flex items-center justify-between gap-3">
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
      <section
        aria-label="Cờ cần xem xét"
        className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-5"
      >
        <h3 className="font-semibold">Cờ của bản đang xét</h3>
        {detail.flags.length === 0 ? (
          <p className="text-sm text-heritage-muted">Không có cờ nào.</p>
        ) : (
          <ul className="space-y-2">
            {detail.flags.map((flag) => {
              const reviewed = Boolean(flag.reviewedAt);
              return (
                <li
                  key={flag.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-heritage-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {flagLabels[flag.kind as z.infer<typeof verifierFlagKindSchema>]}
                    </p>
                    <p className="text-xs text-heritage-muted">{flag.detail}</p>
                    {flag.reviewNote && <p className="mt-1 text-xs">Ghi chú: {flag.reviewNote}</p>}
                    <p className="mt-1 text-[11px] text-heritage-muted">
                      Tạo {formatDate(flag.createdAt)} ·{" "}
                      {reviewed ? `Đã xét ${formatDate(flag.reviewedAt)}` : "Chưa xét"}
                    </p>
                  </div>
                  {!reviewed && actions.canReviewFlag && (
                    <Button variant="outline" onClick={() => openModal("reviewFlag", flag.id)}>
                      Xem xét
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {detail.decisions.length > 0 && (
        <section
          aria-label="Lịch sử quyết định"
          className="space-y-2 rounded-xl border border-heritage-border bg-heritage-surface p-5"
        >
          <h3 className="font-semibold">Lịch sử quyết định</h3>
          <ul className="space-y-1 text-sm">
            {detail.decisions.map((decision) => (
              <li
                key={`${decision.kind}-${decision.versionNo}-${decision.decidedAt}`}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  v{decision.versionNo} ·{" "}
                  {decisionLabels[decision.kind as z.infer<typeof verifierDecisionKindSchema>]} ·{" "}
                  {decision.reason}
                </span>
                <span className="text-xs text-heritage-muted">
                  {formatDate(decision.decidedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!detail.canApprove && detail.approveBlockers.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <ShieldAlert className="size-5 shrink-0" aria-hidden="true" />
          <ul className="list-disc space-y-1 pl-4">
            {detail.approveBlockers.map((item) => (
              <li key={item}>{blockerLabels[item as z.infer<typeof approveBlockerSchema>]}</li>
            ))}
          </ul>
        </div>
      )}
      {detail.handover && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          <p>
            Đã mở {detail.handover.turnCount} lượt bàn giao · {detail.handover.invitationsSent} lời
            mời đã gửi · {detail.handover.invitationsFailed} lời mời chưa gửi được.
          </p>
        </div>
      )}
      {actions.canReject && (
        <footer className="flex flex-wrap items-center gap-3">
          {actions.canRequestSupplement && (
            <Button onClick={() => openModal("supplement")} variant="outline">
              <AlertTriangle className="size-4" aria-hidden="true" />
              Yêu cầu bổ sung
            </Button>
          )}
          {actions.canOpenApprove && (
            <Button disabled={!detail.canApprove} onClick={() => openModal("approve")}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Duyệt mở bàn giao
            </Button>
          )}
          <Button onClick={() => openModal("reject")} variant="outline">
            <X className="size-4" aria-hidden="true" />
            Từ chối
          </Button>
        </footer>
      )}
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
      <dd className={`mt-2 break-words text-sm font-medium ${sensitive ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
