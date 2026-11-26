import { useQueryClient } from "@tanstack/react-query";
import { Check, PenLine } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ActionButton } from "@/shared/ui/ActionButton";
import { Hero } from "@/shared/ui/Hero";
import { buttonStyles, Chip, formatDateTime, Panel } from "@/shared/ui/heritageKit";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { handoverRecordKeys, useRecipientRecord } from "../model/useHandoverRecord";
import { PaperPreviewButton } from "./PaperPreviewButton";
import { ReceiptPaper } from "./ReceiptPaper";
import { RecordPaper } from "./RecordPaper";

/** Một ô chữ ký trong phần tóm tắt: ai, tên, đã ký lúc nào hoặc đang chờ. */
function SignatureBox({
  caption,
  name,
  signedAt,
  you = false,
  pendingText,
}: {
  caption: string;
  name: string;
  signedAt: string | null;
  you?: boolean;
  pendingText: string;
}) {
  let tone = "border-heritage-border bg-white";
  if (signedAt) tone = "border-heritage-success-border bg-heritage-success-bg";
  else if (you) tone = "border-heritage-gold bg-heritage-warning-bg";
  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-heritage-muted">{caption}</p>
      <p className="my-0.5 text-sm font-semibold text-heritage-primary">{name || "—"}</p>
      {signedAt ? (
        <p className="text-xs font-semibold text-heritage-success">
          {`✓ Đã ký · ${formatDateTime(signedAt)}`}
        </p>
      ) : (
        <p
          className={`text-xs font-semibold ${you ? "text-heritage-warning" : "text-heritage-muted"}`}
        >
          {pendingText}
        </p>
      )}
    </div>
  );
}

/** Câu nói bước hiện tại của người nhận trong biên bản. */
function recipientText(record: HandoverRecord, me: RecordRecipient | undefined): string {
  const opened = me !== undefined && me.turnStatus === "HANDOVER_COMMITTED";
  let text = "Bạn cần nộp ảnh căn cước để luật sư xác nhận danh tính, sau đó mới ký được.";
  if (me !== undefined && me.identityConfirmedAt) {
    text = "Danh tính của bạn đã được xác nhận. Chờ tới lượt ký biên bản.";
  }
  if (record.status === "DRAFTING") text = "Luật sư đang sửa biên bản. Bạn chờ bản mới rồi ký.";
  if (record.canSign) {
    text =
      "Bấm Xem và ký biên bản, đọc kỹ phần tài sản của bạn rồi bấm Ký biên bản ở ô chữ ký của bạn.";
  }
  if (me !== undefined && me.signedAt) {
    text = "Bạn đã ký. Chờ luật sư hoặc Người thực thi ký.";
  }
  if (opened) {
    text =
      "Phần của bạn đã đủ chữ ký. Người thực thi sẽ gửi mã nhận vào email của bạn để mở tài sản.";
  }
  return text;
}

/**
 * Người nhận xem phần của mình trong biên bản bàn giao và ký khi tới bước ký: thẻ việc cần làm, tóm tắt phần của bạn
 * và ba ô chữ ký (luật sư, Người thực thi, bạn). Nút ký chỉ nằm trong khung "Xem và ký biên bản", ngay ô chữ ký của chính
 * người nhận trên tờ biên bản. Phần của người này đủ chữ ký (luật sư, Người thực thi và chính người đó) thì lượt được
 * mở quyền tải, không chờ người nhận khác; onChanged để trang làm mới lượt.
 */
export function RecipientRecordPanel({
  turnId,
  onChanged,
}: {
  turnId: string;
  onChanged?: () => void;
}) {
  const client = useQueryClient();
  const sign = usePrivateAction();
  const signed = useSuccessHold();
  const query = useRecipientRecord(turnId);
  if (query.isPending) return <p role="status">Đang tải biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được biên bản bàn giao.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const record = query.data;
  const me = record.recipients[0];
  const opened = me !== undefined && me.turnStatus === "HANDOVER_COMMITTED";
  const text = recipientText(record, me);
  // Nút ký chỉ nằm trong khung "Xem và ký biên bản", ngay ô chữ ký của chính người nhận.
  const signButton = record.canSign ? (
    <>
      <ActionButton
        className={buttonStyles.dark}
        pending={sign.pending}
        done={signed.done}
        pendingLabel="Đang ký…"
        doneLabel="Đã ký"
        onClick={() =>
          void sign.execute(
            () => signed.hold(() => handoverRecordService.signAsRecipient(turnId)),
            (next) => {
              client.setQueryData(handoverRecordKeys.recipient(turnId), next);
              onChanged?.();
            },
          )
        }
      >
        Ký biên bản
      </ActionButton>
      {sign.error && (
        <p role="alert" className="max-w-56 text-center text-sm text-destructive">
          {sign.error}
        </p>
      )}
    </>
  ) : undefined;
  const signAction =
    signButton && me ? { target: { recipientId: me.beneficiaryId }, node: signButton } : undefined;
  let tone: "gold" | "ok" | "info" = "info";
  let eyebrow = "Biên bản bàn giao";
  let title = "Biên bản bàn giao của bạn";
  if (record.canSign) {
    tone = "gold";
    eyebrow = "Bước 5: Cần bạn xem và ký xác nhận";
    title = "Danh tính đã được duyệt. Mở biên bản để đọc và ký";
  } else if (opened) {
    tone = "ok";
    eyebrow = "Bước 5 đã xong";
    title = "Biên bản đã đủ chữ ký";
  } else if (me?.signedAt) {
    title = "Bạn đã ký biên bản";
  }
  return (
    <div className="space-y-5">
      <Hero
        tone={tone}
        eyebrow={
          <>
            <PenLine className="size-4" aria-hidden="true" />
            {eyebrow}
          </>
        }
        title={title}
        actions={
          me ? (
            <PaperPreviewButton
              label={record.canSign ? "Xem và ký biên bản" : "Xem biên bản"}
              title="Biên bản bàn giao"
              fileName={`Bien-ban-ban-giao-ban-${record.revisionNo}`}
              primary={record.canSign}
              paper={<RecordPaper record={record} signAction={signAction} />}
            />
          ) : undefined
        }
      >
        {text}
      </Hero>
      {me && (
        <Panel
          title="Tóm tắt phần của bạn trong Biên bản bàn giao"
          labelledBy={`recipient-summary-${record.id}`}
          action={
            me.identityConfirmedAt ? (
              <Chip tone="success">
                <Check className="mr-1 size-4" aria-hidden="true" />
                Đã xác minh danh tính
              </Chip>
            ) : undefined
          }
        >
          <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-heritage-muted">Người nhận</dt>
            <dd className="font-semibold">{`${me.fullName} · CCCD ${me.citizenId}`}</dd>
            <dt className="text-heritage-muted">Chủ tài sản</dt>
            <dd className="font-semibold">{record.ownerName || "—"}</dd>
            <dt className="text-heritage-muted">Phần tài sản</dt>
            <dd>
              <ul className="space-y-1 font-semibold">
                {me.assets.map((asset) => (
                  <li key={asset.assetId}>{asset.name || "Tài sản đã bị xóa"}</li>
                ))}
              </ul>
            </dd>
          </dl>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <SignatureBox
              caption="1. Luật sư lập biên bản"
              name={record.verifierName}
              signedAt={record.verifierSignedAt}
              pendingText="Chờ ký"
            />
            <SignatureBox
              caption="2. Người thực thi"
              name={record.executorName}
              signedAt={record.executorSignedAt}
              pendingText="Chờ ký"
            />
            <SignatureBox
              caption="3. Người nhận (bạn)"
              name={me.fullName}
              signedAt={me.signedAt}
              you
              pendingText={record.canSign ? "● Mở biên bản để ký" : "Chờ tới lượt"}
            />
          </div>
        </Panel>
      )}
    </div>
  );
}

/**
 * Hai nút xem tờ biên bản và phiếu giao nhận của chính người nhận (sau khi đã ký và được mở quyền tải). Biên bản tải
 * theo lượt nên chỉ gọi API khi `enabled`; chưa có biên bản thì không hiện nút nào.
 */
export function RecipientPaperButtons({
  turnId,
  enabled = true,
  compact = false,
}: {
  turnId: string;
  enabled?: boolean;
  compact?: boolean;
}) {
  const query = useRecipientRecord(turnId, enabled);
  const record = query.data;
  const me = record?.recipients[0];
  if (!record || !me) return null;
  return (
    <>
      <PaperPreviewButton
        label="Xem biên bản"
        title="Biên bản bàn giao"
        fileName={`Bien-ban-ban-giao-ban-${record.revisionNo}`}
        paper={<RecordPaper record={record} />}
      />
      {me.turnStatus === "HANDOVER_COMMITTED" && (
        <PaperPreviewButton
          label={compact ? "Xem phiếu" : "Xem phiếu giao nhận"}
          title="Phiếu giao nhận"
          fileName="Phieu-giao-nhan"
          paper={<ReceiptPaper record={record} recipient={me} />}
        />
      )}
    </>
  );
}
