import { compactButton, SectionCard, tableStyles } from "@/shared/ui/SectionCard";
import { buttonStyles, Chip, formatDateTime } from "@/shared/ui/heritageKit";
import { useRecipientSubmissions } from "../model/useRecipientReview";

/**
 * Hồ sơ danh tính người nhận đang chờ luật sư kiểm (bước 2 của biên bản bàn giao), nộp trước xếp trên.
 * Chỉ có hồ sơ của biên bản được giao cho bạn; Backend quyết định, màn hình không tự lọc.
 */
export function RecipientReviewList({ onOpen }: { onOpen: (submissionId: string) => void }) {
  const query = useRecipientSubmissions();
  if (query.isPending)
    return (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải hồ sơ danh tính…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-2xl bg-heritage-danger-bg p-5">
        <p className="text-sm text-heritage-danger">Không tải được hồ sơ danh tính.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          Thử lại
        </button>
      </div>
    );
  const items = [...query.data].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  );
  return (
    <SectionCard
      title="Chờ bạn kiểm danh tính"
      subtitle="Người nhận có tên trong biên bản nộp ảnh căn cước vào đây."
      labelledBy="recipient-review-list"
      action={
        <button
          type="button"
          className={compactButton.outline}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Tải lại
        </button>
      }
    >
      {items.length === 0 ? (
        <p role="status" className="p-8 text-center text-sm text-heritage-muted">
          Chưa có người nhận nào nộp căn cước.
        </p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className={`${tableStyles.table} min-w-[520px]`}>
            <caption className="sr-only">Hồ sơ danh tính chờ kiểm</caption>
            <thead>
              <tr className={tableStyles.head}>
                <th scope="col" className={tableStyles.th}>
                  Nộp lúc
                </th>
                <th scope="col" className={tableStyles.th}>
                  Đối chiếu tự động
                </th>
                <th scope="col" className={tableStyles.th}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.body}>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={tableStyles.td}>{formatDateTime(item.submittedAt)}</td>
                  <td className={tableStyles.td}>
                    {item.allMatch ? (
                      <Chip tone="success">Khớp thông tin Chủ kho khai</Chip>
                    ) : (
                      <Chip tone="danger">Có trường không khớp</Chip>
                    )}
                  </td>
                  <td className={tableStyles.td}>
                    <button
                      type="button"
                      className={compactButton.dark}
                      onClick={() => onOpen(item.id)}
                    >
                      Kiểm danh tính
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
