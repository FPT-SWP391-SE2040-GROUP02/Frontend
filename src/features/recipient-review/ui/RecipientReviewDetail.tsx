import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Chip, InfoRow, Notice, Panel } from "@/shared/ui/heritageKit";
import { recipientReviewService } from "../api/recipientReviewService";
import { SUBMISSION_STATUS_LABELS } from "../model/recipientReview.schema";
import {
  recipientReviewKeys,
  useRecipientImage,
  useRecipientSubmission,
} from "../model/useRecipientReview";

function MatchRow({ label, matches }: { label: string; matches: boolean }) {
  return (
    <InfoRow label={label}>
      {matches ? <Chip tone="success">Khớp</Chip> : <Chip tone="danger">Không khớp</Chip>}
    </InfoRow>
  );
}

/** Ảnh căn cước một mặt, chỉ giữ trong RAM và thu hồi khi rời màn hình. */
function IdentityImage({ id, side, label }: { id: string; side: "front" | "back"; label: string }) {
  const { state, retry } = useRecipientImage(id, side);
  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-semibold">{label}</figcaption>
      {state.status === "loading" && <p role="status">Đang tải ảnh…</p>}
      {state.status === "error" && (
        <div role="alert" className="space-y-2">
          <p className="text-sm text-destructive">Không tải được ảnh.</p>
          <button type="button" className={buttonStyles.outline} onClick={retry}>
            Thử lại
          </button>
        </div>
      )}
      {state.status === "ready" && (
        <img
          src={state.url}
          alt={label}
          className="w-full rounded-xl border border-heritage-border"
        />
      )}
    </figure>
  );
}

/**
 * Luật sư kiểm danh tính một người nhận có tên trong biên bản: xem kết quả đối chiếu với thông tin Chủ kho đã khai,
 * ảnh căn cước hai mặt, rồi xác nhận hoặc yêu cầu làm lại. Chưa khớp thì chưa sang bước ký.
 */
export function RecipientReviewDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const client = useQueryClient();
  const query = useRecipientSubmission(id);
  const approve = usePrivateAction();
  const supplement = usePrivateAction();
  const [reason, setReason] = useState("");
  const busy = approve.pending || supplement.pending;
  const done = () => {
    void client.invalidateQueries({ queryKey: recipientReviewKeys.all });
    void client.invalidateQueries({ queryKey: ["handover-record"] });
  };
  if (query.isPending) return <p role="status">Đang tải hồ sơ danh tính…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được hồ sơ hoặc hồ sơ không thuộc biên bản của bạn.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => void query.refetch()}
          >
            Thử lại
          </button>
          <button type="button" className={buttonStyles.outline} onClick={onBack}>
            Về danh sách
          </button>
        </div>
      </div>
    );
  }
  const detail = query.data;
  return (
    <div className="space-y-6">
      <button type="button" className={buttonStyles.outline} onClick={onBack}>
        Về danh sách
      </button>
      <Panel
        title="Danh tính người nhận"
        labelledBy="recipient-identity"
        action={<Chip>{SUBMISSION_STATUS_LABELS[detail.status]}</Chip>}
      >
        <div className="space-y-5">
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <MatchRow label="Họ tên" matches={detail.nameMatches} />
            <MatchRow label="Số căn cước" matches={detail.citizenIdMatches} />
            <MatchRow label="Ngày sinh" matches={detail.dateOfBirthMatches} />
            <InfoRow label="4 số cuối căn cước">{`****${detail.citizenIdLast4}`}</InfoRow>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <IdentityImage id={detail.id} side="front" label="Căn cước mặt trước" />
            <IdentityImage id={detail.id} side="back" label="Căn cước mặt sau" />
          </div>
          {!detail.allMatch && (
            <Notice tone="warning" title="Có trường không khớp">
              Thông tin người nhận khai không khớp với thông tin Chủ kho đã khai. Yêu cầu người nhận
              làm lại xác minh.
            </Notice>
          )}
        </div>
      </Panel>
      {(detail.canApprove || detail.canRequestSupplement) && (
        <Panel title="Kết quả kiểm" labelledBy="recipient-identity-actions">
          <div className="space-y-4 text-sm">
            {detail.canApprove && (
              <button
                type="button"
                className={buttonStyles.dark}
                disabled={busy}
                onClick={() =>
                  void approve.execute(() => recipientReviewService.approve(detail.id), done)
                }
              >
                {approve.pending ? "Đang xác nhận…" : "Xác nhận đúng người"}
              </button>
            )}
            {detail.canRequestSupplement && (
              <div className="space-y-2">
                <label className="block space-y-1 font-semibold">
                  Lý do yêu cầu làm lại
                  <textarea
                    className="min-h-24 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal"
                    maxLength={1000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className={buttonStyles.outline}
                  disabled={busy || reason.trim().length === 0}
                  onClick={() =>
                    void supplement.execute(
                      () => recipientReviewService.requestSupplement(detail.id, reason.trim()),
                      () => {
                        setReason("");
                        done();
                      },
                    )
                  }
                >
                  {supplement.pending ? "Đang gửi…" : "Yêu cầu làm lại"}
                </button>
              </div>
            )}
            {(approve.error || supplement.error) && (
              <p role="alert" className="text-destructive">
                {approve.error || supplement.error}
              </p>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
