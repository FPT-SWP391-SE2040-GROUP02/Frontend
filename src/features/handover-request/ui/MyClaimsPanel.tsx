import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check } from "lucide-react";
import type { CSSProperties } from "react";
import { claimStatusLabel, DocumentFiles } from "@/entities/handoverRecord";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Chip, formatDateTime } from "@/shared/ui/heritageKit";
import { PortalSkeleton } from "@/shared/ui/PortalSkeleton";
import { handoverRequestService } from "../api/handoverRequestService";
import { type MyClaim } from "../model/handoverRequest.schema";
import {
  handoverRequestKeys,
  useAvailableHandovers,
  useMyClaims,
} from "../model/useHandoverRequest";
import { SupplementForm } from "./SupplementForm";

/** Câu cho người nhận biết yêu cầu đang ở đâu. */
function claimText(claim: MyClaim): string {
  // Bị từ chối là kết quả của chính yêu cầu này, kể cả khi biên bản đã tự đóng sau đó.
  if (claim.status === "REJECTED") return "Luật sư đã từ chối yêu cầu này.";
  if (claim.cancelReason) return `Luật sư đã hủy yêu cầu này. Lý do: ${claim.cancelReason}`;
  if (claim.recordStatus === "CANCELLED") return "Yêu cầu này đã bị hủy.";
  switch (claim.status) {
    case "SUBMITTED":
      return "Luật sư đang xét giấy tờ của bạn.";
    case "SUPPLEMENT_REQUESTED":
      return "Luật sư cần thêm giấy tờ. Nộp bổ sung ở dưới.";
    case "ACCEPTED":
      return "Giấy tờ đã được chấp nhận. Khi luật sư chốt phương án chia, bạn sẽ nhận thư mời nộp căn cước rồi ký.";
  }
}

/** Yêu cầu đang chờ mà còn lý do là lý do của lần xét trước (đã bổ sung hoặc gửi lại). */
function reasonLabel(claim: MyClaim): string {
  if (claim.status === "SUBMITTED") return "Lý do xét lần trước: ";
  return "Lý do của luật sư: ";
}

/**
 * Thông báo đỏ ở trang Việc cần làm khi luật sư cần giấy tờ bổ sung: nói kho nào, lý do gì, và đưa tới trang nộp.
 * Không có yêu cầu nào cần bổ sung thì không hiện.
 */
export function ClaimSupplementNotice() {
  const query = useMyClaims();
  const claim = query.data?.find(
    (item) => item.status === "SUPPLEMENT_REQUESTED" && item.recordStatus !== "CANCELLED",
  );
  if (!claim) return null;
  return (
    <div
      role="alert"
      className="flex flex-wrap items-start gap-3 rounded-2xl border border-heritage-danger-border bg-heritage-danger-bg px-4 py-3.5 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-heritage-danger" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <b className="block text-heritage-primary">
          {`Giấy tờ cần bổ sung: tài sản của ${claim.ownerName}`}
        </b>
        {claim.reviewReason && <p>{claim.reviewReason}</p>}
      </div>
      <Link to={ROUTES.BENEFICIARY.REQUESTS} className={`${buttonStyles.dark} min-h-9 px-3`}>
        Nộp bổ sung ngay
      </Link>
    </div>
  );
}

/**
 * Trang "Giấy tờ và Yêu cầu": kết quả luật sư xét giấy tờ đã nộp, tệp đã nộp, nộp bổ sung khi được yêu cầu.
 * Chưa có yêu cầu nào thì báo trống và chỉ đường sang trang gửi yêu cầu.
 */
export function MyClaimsPanel() {
  const client = useQueryClient();
  const query = useMyClaims();
  // Backend cho biết yêu cầu bị từ chối nào còn gửi lại được; form gửi nằm ở trang Nhận tài sản.
  const available = useAvailableHandovers();
  if (query.isPending) return <PortalSkeleton label="Đang tải các yêu cầu…" rows={2} />;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger">
          Không tải được các yêu cầu của bạn.
        </p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  if (query.data.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-heritage-border bg-white p-6">
        <p role="status" className="font-semibold text-heritage-primary">
          Bạn chưa gửi yêu cầu nhận tài sản nào.
        </p>
        <p className="text-sm text-heritage-muted">
          Khi Chủ tài sản đã qua đời, bạn gửi yêu cầu kèm giấy chứng tử và di chúc ở trang Nhận tài
          sản. Luật sư xét xong, kết quả hiện ở đây.
        </p>
        <Link to={ROUTES.DASHBOARD.RECEIVE_ASSETS} className={buttonStyles.outline}>
          Mở trang Nhận tài sản
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {query.data.map((claim, index) => {
        let status = claimStatusLabel[claim.status];
        if (claim.recordStatus === "CANCELLED" && claim.status !== "REJECTED")
          status = {
            label: claim.cancelReason ? "Luật sư đã hủy" : "Đã hủy",
            tone: "neutral",
          };
        const supplement =
          claim.status === "SUPPLEMENT_REQUESTED" && claim.recordStatus !== "CANCELLED";
        const accepted = claim.status === "ACCEPTED" && claim.recordStatus !== "CANCELLED";
        const canResend =
          claim.status === "REJECTED" &&
          Boolean(available.data?.some((row) => row.claimId === claim.id && row.canRequest));
        return (
          <article
            key={claim.id}
            aria-label={`Yêu cầu nhận tài sản của ${claim.ownerName}`}
            style={{ "--pm-i": index } as CSSProperties}
            className={`pm-rise space-y-3.5 rounded-2xl border bg-heritage-surface p-5 shadow-card ${supplement ? "border-heritage-danger bg-white" : "border-heritage-border"}`}
          >
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-heritage-primary">
                  Tài sản của {claim.ownerName}
                </h3>
                <p className="text-sm text-heritage-muted">
                  Đã gửi {formatDateTime(claim.createdAt)}
                </p>
              </div>
              <Chip tone={status.tone}>{status.label}</Chip>
            </header>
            {supplement && (
              <div className="flex items-start gap-3 rounded-2xl border border-heritage-danger-border bg-heritage-danger-bg px-4 py-3 text-sm">
                <AlertTriangle
                  className="mt-0.5 size-5 shrink-0 text-heritage-danger"
                  aria-hidden="true"
                />
                <div>
                  <b className="block text-heritage-primary">Lý do luật sư yêu cầu bổ sung:</b>
                  {claim.reviewReason ?? "Luật sư cần thêm giấy tờ."}
                </div>
              </div>
            )}
            {accepted && (
              <div className="flex items-start gap-3 rounded-2xl border border-heritage-success-border bg-heritage-success-bg px-4 py-3 text-sm">
                <Check
                  className="mt-0.5 size-5 shrink-0 text-heritage-success"
                  aria-hidden="true"
                />
                <div>
                  <b className="block text-heritage-primary">Giấy tờ đã hợp lệ</b>
                  {claimText(claim)}
                </div>
              </div>
            )}
            {!supplement && !accepted && <p className="text-sm leading-6">{claimText(claim)}</p>}
            {!supplement && claim.reviewReason && (
              <p className="text-sm">
                <span className="font-semibold">{reasonLabel(claim)}</span>
                {claim.reviewReason}
              </p>
            )}
            {canResend && (
              <Link to={ROUTES.DASHBOARD.RECEIVE_ASSETS} className={buttonStyles.dark}>
                Gửi lại yêu cầu
              </Link>
            )}
            <DocumentFiles
              files={claim.files}
              download={(file, options) =>
                handoverRequestService.downloadFile(claim.id, file.id, options)
              }
            />
            {supplement && (
              <SupplementForm
                send={(note, files) => handoverRequestService.supplement(claim.id, note, files)}
                onSent={() => {
                  void client.invalidateQueries({ queryKey: handoverRequestKeys.mine });
                  void client.invalidateQueries({ queryKey: handoverRequestKeys.available });
                }}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
