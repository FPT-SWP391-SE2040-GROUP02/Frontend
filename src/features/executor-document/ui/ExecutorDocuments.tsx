import { HandoverDocumentList, useExecutorDocuments } from "@/entities/handoverDocument";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";

/**
 * Mục Biên Bản của Người thực thi: lịch sử mọi biên bản của các kho mình làm Người thực thi (không giới hạn thời gian).
 * Chỉ để xem lại: thông tin về Chủ kho đã chép sẵn từ hồ sơ chứng tử, Người thực thi không điền hay ký gì thêm.
 */
export function ExecutorDocuments() {
  const query = useExecutorDocuments();
  if (query.isPending) return <p role="status">Đang tải các biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-[#A32119]">Không tải được các biên bản.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  return (
    <Panel title="Biên Bản">
      <div className="space-y-4">
        <p className="text-sm text-heritage-muted">
          Biên bản của người nhận trong các kho bạn làm Người thực thi. Thông tin về Chủ kho lấy từ
          hồ sơ chứng tử đã duyệt nên bạn không cần điền hay ký, chỉ xem lại khi cần.
        </p>
        <HandoverDocumentList
          documents={query.data}
          viewer="executor"
          emptyText="Chưa có biên bản nào trong các kho bạn làm Người thực thi."
        />
      </div>
    </Panel>
  );
}
