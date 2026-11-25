import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import { handoverRecordKeys, useRecipientRecord } from "../model/useHandoverRecord";
import { RecordDocument } from "./RecordDocument";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

/**
 * Người nhận xem phần của mình trong biên bản bàn giao và ký khi tới bước ký.
 * Phần của người này đủ chữ ký (luật sư, Người thực thi và chính người đó) thì lượt được mở quyền tải,
 * không chờ người nhận khác; onChanged để trang làm mới lượt.
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
  let text = "Bạn cần nộp ảnh căn cước để luật sư xác nhận danh tính, sau đó mới ký được.";
  if (me !== undefined && me.identityConfirmedAt) {
    text = "Danh tính của bạn đã được xác nhận. Chờ tới lượt ký biên bản.";
  }
  if (record.status === "DRAFTING") text = "Luật sư đang sửa biên bản. Bạn chờ bản mới rồi ký.";
  if (record.canSign) text = "Đọc kỹ phần tài sản của bạn rồi bấm Ký biên bản.";
  if (me !== undefined && me.signedAt) {
    text = "Bạn đã ký. Chờ luật sư hoặc Người thực thi ký.";
  }
  if (opened) {
    text =
      "Phần của bạn đã đủ chữ ký. Người thực thi sẽ gửi mã nhận vào email của bạn để mở tài sản.";
  }
  return (
    <div className="space-y-4">
      <Notice
        tone={opened ? "success" : "neutral"}
        role="status"
        action={
          record.canSign ? (
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
          ) : undefined
        }
      >
        {text}
      </Notice>
      {sign.error && (
        <p role="alert" className="text-sm text-destructive">
          {sign.error}
        </p>
      )}
      {me && (
        <RecordDocument
          record={record}
          title="Phần của bạn trong biên bản bàn giao"
          layout="stacked"
        />
      )}
    </div>
  );
}
