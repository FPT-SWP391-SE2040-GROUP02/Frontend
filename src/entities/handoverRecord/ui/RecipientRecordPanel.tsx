import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import { handoverRecordKeys, useRecipientRecord } from "../model/useHandoverRecord";
import { RecordDocument } from "./RecordDocument";

/**
 * Người nhận xem phần của mình trong biên bản bàn giao và ký khi tới bước ký.
 * Đủ chữ ký ba bên thì lượt được mở quyền tải; onChanged để trang làm mới lượt.
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
  let text =
    "Luật sư đang kiểm danh tính những người nhận khác. Khi đủ người, bạn sẽ ký được biên bản.";
  if (record.status === "DRAFTING") text = "Luật sư đang sửa biên bản. Bạn chờ bản mới rồi ký.";
  if (record.status === "SIGNING" && record.canSign)
    text = "Đọc kỹ phần tài sản của bạn rồi bấm Ký biên bản.";
  if (record.status === "SIGNING" && !record.canSign)
    text = "Bạn đã ký. Đang chờ các bên còn lại ký.";
  if (record.status === "COMPLETED")
    text = "Biên bản đã đủ chữ ký. Người thực thi sẽ gửi mã nhận vào email của bạn để mở tài sản.";
  return (
    <div className="space-y-4">
      <Notice
        tone={record.status === "COMPLETED" ? "success" : "neutral"}
        role="status"
        action={
          record.canSign ? (
            <button
              type="button"
              className={buttonStyles.dark}
              disabled={sign.pending}
              onClick={() =>
                void sign.execute(
                  () => handoverRecordService.signAsRecipient(turnId),
                  (next) => {
                    client.setQueryData(handoverRecordKeys.recipient(turnId), next);
                    onChanged?.();
                  },
                )
              }
            >
              {sign.pending ? "Đang ký…" : "Ký biên bản"}
            </button>
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
      {me && <RecordDocument record={record} title="Phần của bạn trong biên bản bàn giao" />}
    </div>
  );
}
