import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import { useExecutorRecord } from "../model/useHandoverRecord";
import { RecordDocument } from "./RecordDocument";
import { RecordStepper } from "./RecordStepper";

/** Câu cho Người thực thi biết biên bản đang chờ ai. */
function waitingText(record: HandoverRecord): string {
  switch (record.status) {
    case "DRAFTING":
      return "Người nhận đã gửi yêu cầu kèm giấy tờ. Luật sư đang xét giấy tờ và lập biên bản: ai nhận tài sản nào. Bạn chưa phải làm gì.";
    case "IDENTITY_CHECK":
      return "Biên bản đã chốt. Người nhận đã nhận thư mời và đang nộp căn cước để luật sư kiểm.";
    case "SIGNING":
      return "Mọi người nhận đã được xác nhận danh tính. Đang chờ luật sư ký biên bản.";
    case "COMPLETED":
      return "Luật sư đã ký: đây là yêu cầu chuyển giao. Vào mục Bàn giao để gửi mã và ký phiếu giao nhận.";
    case "CANCELLED":
      return "Chủ kho đã hủy yêu cầu nhận tài sản. Kho đã mở khóa.";
  }
}

/** Chưa có yêu cầu nhận tài sản: Người thực thi chưa phải làm gì; người nhận là người gửi yêu cầu kèm giấy tờ. */
function WaitingForRequest() {
  return (
    <Panel title="Chưa có yêu cầu nhận tài sản" labelledBy="waiting-request">
      <div className="space-y-3 text-sm leading-6">
        <p>
          Khi có việc xảy ra với Chủ kho, người nhận sẽ gửi yêu cầu nhận tài sản kèm giấy tờ. Hệ
          thống khóa kho, báo cho bạn và phân công một luật sư xét giấy tờ, lập biên bản bàn giao.
        </p>
        <p className="text-heritage-muted">
          Bạn chỉ giữ mã mở gói và giao tài sản theo biên bản luật sư lập. Bạn không tự chia, bán
          hay cho tài sản.
        </p>
      </div>
    </Panel>
  );
}

/** Mục Biên bản bàn giao của Người thực thi: theo dõi ba bước; biên bản luật sư ký là yêu cầu chuyển giao. */
export function ExecutorRecordPanel({ vaultId }: { vaultId: string }) {
  const query = useExecutorRecord(vaultId);
  if (query.isPending) return <p role="status">Đang tải biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được biên bản hoặc bạn không có quyền trong kho này.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const record = query.data;
  if (!record) return <WaitingForRequest />;
  return (
    <div className="space-y-6">
      <RecordStepper status={record.status} />
      <Notice tone={record.status === "COMPLETED" ? "success" : "neutral"} role="status">
        {waitingText(record)}
      </Notice>
      <RecordDocument record={record} />
    </div>
  );
}
