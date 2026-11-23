import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { useRecipientRecord } from "../model/useHandoverRecord";
import { RecordDocument } from "./RecordDocument";

/** Người nhận xem phần của mình trong biên bản bàn giao và phiếu giao nhận. Biên bản do luật sư ký. */
export function RecipientRecordPanel({ turnId }: { turnId: string }) {
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
  let text = "Danh tính của bạn đã được xác nhận. Đang chờ luật sư ký biên bản.";
  if (record.status === "DRAFTING") text = "Luật sư đang sửa biên bản. Bạn chờ bản mới.";
  if (record.status === "COMPLETED")
    text =
      "Luật sư đã ký biên bản. Người thực thi sẽ gửi mã nhận vào email của bạn; tải và kiểm tra xong thì ký phiếu giao nhận.";
  return (
    <div className="space-y-4">
      <Notice tone={record.status === "COMPLETED" ? "success" : "neutral"} role="status">
        {text}
      </Notice>
      {record.recipients.length > 0 && (
        <RecordDocument record={record} title="Phần của bạn trong biên bản bàn giao" />
      )}
    </div>
  );
}
