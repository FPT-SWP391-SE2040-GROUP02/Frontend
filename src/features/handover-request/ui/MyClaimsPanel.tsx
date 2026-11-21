import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { claimStatusLabel, RecordFileList } from "@/entities/handoverRecord";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Chip, formatDateTime, Panel } from "@/shared/ui/heritageKit";
import { handoverRequestService } from "../api/handoverRequestService";
import { filesError, type MyClaim } from "../model/handoverRequest.schema";
import { handoverRequestKeys, useMyClaims } from "../model/useHandoverRequest";
import { DocumentPicker } from "./DocumentPicker";

/** Câu cho người nhận biết yêu cầu đang ở đâu. */
function claimText(claim: MyClaim): string {
  if (claim.recordStatus === "CANCELLED") return "Chủ kho đã hủy yêu cầu này.";
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

function SupplementForm({ claim }: { claim: MyClaim }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const error = filesError(files);
  return (
    <div className="space-y-3 border-t border-heritage-border pt-4">
      <DocumentPicker files={files} onChange={setFiles} disabled={action.pending} />
      {touched && error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <label className="block space-y-1 text-sm font-semibold">
        Lời nhắn (không bắt buộc)
        <textarea
          className="min-h-20 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal"
          maxLength={1000}
          value={note}
          disabled={action.pending}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button
        type="button"
        className={buttonStyles.dark}
        disabled={action.pending}
        onClick={() => {
          setTouched(true);
          if (error) return;
          void action.execute(
            () => handoverRequestService.supplement(claim.id, note, files),
            () => {
              void client.invalidateQueries({ queryKey: handoverRequestKeys.mine });
              setFiles([]);
              setNote("");
              setTouched(false);
            },
          );
        }}
      >
        {action.pending ? "Đang nộp…" : "Nộp bổ sung"}
      </button>
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
    </div>
  );
}

/** Mục "Yêu cầu nhận tài sản" trong cổng người nhận: kết quả luật sư xét, tệp đã nộp, nộp bổ sung khi được yêu cầu. */
export function MyClaimsPanel() {
  const query = useMyClaims();
  if (!query.isSuccess || query.data.length === 0) return null;
  return (
    <Panel title="Yêu cầu nhận tài sản" labelledBy="my-claims">
      <div className="space-y-4">
        {query.data.map((claim) => {
          let status = claimStatusLabel[claim.status];
          if (claim.recordStatus === "CANCELLED")
            status = { label: "Chủ kho đã hủy", tone: "neutral" };
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
                download={(file) => handoverRequestService.downloadFile(claim.id, file.id)}
              />
              {claim.status === "SUPPLEMENT_REQUESTED" && claim.recordStatus !== "CANCELLED" && (
                <SupplementForm claim={claim} />
              )}
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
