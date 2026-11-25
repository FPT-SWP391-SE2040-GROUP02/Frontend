import { useQueryClient } from "@tanstack/react-query";
import { claimStatusLabel, RecordFileList } from "@/entities/handoverRecord";
import { Chip, formatDateTime, Panel } from "@/shared/ui/heritageKit";
import { handoverRequestService } from "../api/handoverRequestService";
import { type MyClaim } from "../model/handoverRequest.schema";
import { handoverRequestKeys, useMyClaims } from "../model/useHandoverRequest";
import { SupplementForm } from "./SupplementForm";

/** Câu cho người nhận biết yêu cầu đang ở đâu. */
function claimText(claim: MyClaim): string {
  if (claim.cancelReason) return `Luật sư đã hủy yêu cầu này. Lý do: ${claim.cancelReason}`;
  if (claim.recordStatus === "CANCELLED") return "Yêu cầu này đã bị hủy.";
  switch (claim.status) {
    case "SUBMITTED":
      return "Luật sư đang xét giấy tờ của bạn.";
    case "SUPPLEMENT_REQUESTED":
      return "Luật sư cần thêm giấy tờ. Nộp bổ sung ở dưới.";
    case "ACCEPTED":
      return "Giấy tờ đã được chấp nhận. Khi luật sư chốt biên bản, bạn sẽ nhận thư mời nộp căn cước rồi ký.";
    case "REJECTED":
      return "Luật sư đã từ chối yêu cầu này.";
  }
}

/** Mục "Yêu cầu nhận tài sản" trong cổng người nhận: kết quả luật sư xét, tệp đã nộp, nộp bổ sung khi được yêu cầu. */
export function MyClaimsPanel() {
  const client = useQueryClient();
  const query = useMyClaims();
  if (!query.isSuccess || query.data.length === 0) return null;
  return (
    <Panel title="Yêu cầu nhận tài sản" labelledBy="my-claims">
      <div className="space-y-4">
        {query.data.map((claim) => {
          let status = claimStatusLabel[claim.status];
          if (claim.recordStatus === "CANCELLED")
            status = {
              label: claim.cancelReason ? "Luật sư đã hủy" : "Đã hủy",
              tone: "neutral",
            };
          return (
            <article
              key={claim.id}
              aria-label={`Yêu cầu nhận tài sản của ${claim.ownerName}`}
              className="space-y-3 rounded-2xl border border-heritage-border bg-white/70 p-5"
            >
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-heritage-primary">Kho của {claim.ownerName}</h3>
                  <p className="text-sm text-heritage-muted">
                    Gửi {formatDateTime(claim.createdAt)}
                  </p>
                </div>
                <Chip tone={status.tone}>{status.label}</Chip>
              </header>
              <p className="text-sm leading-6">{claimText(claim)}</p>
              {claim.reviewReason && (
                <p className="text-sm">
                  <span className="font-semibold">Lý do của luật sư: </span>
                  {claim.reviewReason}
                </p>
              )}
              <RecordFileList
                files={claim.files}
                download={(file, options) =>
                  handoverRequestService.downloadFile(claim.id, file.id, options)
                }
              />
              {claim.status === "SUPPLEMENT_REQUESTED" && claim.recordStatus !== "CANCELLED" && (
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
    </Panel>
  );
}
