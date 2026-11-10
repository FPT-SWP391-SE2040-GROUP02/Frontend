import { HandoverDocumentList, useMyDocuments } from "@/entities/handoverDocument";
import { buttonStyles } from "@/shared/ui/heritageKit";

/**
 * Mục Biên Bản của người nhận: mọi biên bản đã và đang làm, mới nhất trước, lưu không giới hạn để xem lại bất cứ lúc nào.
 * Biên bản xong ghi Hoàn tất; biên bản đang làm xám nhạt và ghi Chưa xong.
 */
export function RecipientDocuments() {
  const query = useMyDocuments();
  if (query.isPending) return <p role="status">Đang tải các biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-[#A32119]">Không tải được các biên bản của bạn.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  return (
    <HandoverDocumentList
      documents={query.data}
      viewer="recipient"
      emptyText="Bạn chưa có biên bản nào. Biên bản xuất hiện khi bạn chọn Chấp nhận hoặc Từ chối ở lượt bàn giao."
    />
  );
}
