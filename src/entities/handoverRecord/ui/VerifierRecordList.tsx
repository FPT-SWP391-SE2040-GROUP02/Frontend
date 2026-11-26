import { compactButton, SectionCard, tableStyles } from "@/shared/ui/SectionCard";
import { buttonStyles, Chip, formatDate } from "@/shared/ui/heritageKit";
import { caseCode } from "@/shared/lib/caseCode";
import { useVerifierRecords } from "../model/useHandoverRecord";
import { recordStatusLabel } from "../model/recordPresentation";

/**
 * Danh sách biên bản được giao cho luật sư. scope="open": biên bản chưa đủ chữ ký;
 * scope="closed": biên bản đã hoàn tất. Chọn biên bản qua onSelect (URL ?recordId=).
 */
export function VerifierRecordList({
  scope,
  onSelect,
}: {
  scope: "open" | "closed";
  onSelect: (recordId: string) => void;
}) {
  const query = useVerifierRecords();
  if (query.isPending)
    return (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải danh sách biên bản…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-2xl bg-heritage-danger-bg p-5">
        <p className="text-sm text-heritage-danger">Không tải được danh sách biên bản.</p>
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
  const items = query.data.filter((item) =>
    scope === "open" ? item.status !== "COMPLETED" : item.status === "COMPLETED",
  );
  return (
    <SectionCard
      title={scope === "open" ? "Biên bản cần xử lý" : "Biên bản đã hoàn tất"}
      subtitle={
        scope === "open"
          ? "Các biên bản bàn giao được giao cho bạn."
          : "Đã có đủ chữ ký của luật sư, Người thực thi và mọi người nhận."
      }
      labelledBy={`record-list-${scope}`}
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
          {scope === "open" ? "Chưa có biên bản nào cần xử lý." : "Chưa có biên bản nào hoàn tất."}
        </p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className={`${tableStyles.table} min-w-[620px]`}>
            <caption className="sr-only">Biên bản bàn giao</caption>
            <thead>
              <tr className={tableStyles.head}>
                <th scope="col" className={tableStyles.th}>
                  Mã biên bản
                </th>
                <th scope="col" className={tableStyles.th}>
                  Chủ kho
                </th>
                <th scope="col" className={tableStyles.th}>
                  Người nhận
                </th>
                <th scope="col" className={tableStyles.th}>
                  Bước
                </th>
                <th scope="col" className={tableStyles.th}>
                  Ngày mở
                </th>
                <th scope="col" className={tableStyles.th}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.body}>
              {items.map((item) => {
                const status = recordStatusLabel[item.status];
                return (
                  <tr key={item.id}>
                    <td className={tableStyles.td}>
                      <button
                        type="button"
                        className="cursor-pointer font-semibold underline-offset-4 hover:underline"
                        onClick={() => onSelect(item.id)}
                      >
                        {`Biên bản #${caseCode(item.id)}`}
                      </button>
                    </td>
                    <td className={tableStyles.td}>{item.ownerName || "—"}</td>
                    <td className={tableStyles.td}>{item.recipientCount}</td>
                    <td className={tableStyles.td}>
                      <Chip tone={status.tone}>{status.label}</Chip>
                    </td>
                    <td className={`${tableStyles.td} text-heritage-muted`}>
                      {formatDate(item.requestedAt)}
                    </td>
                    <td className={`${tableStyles.td} text-right`}>
                      <button
                        type="button"
                        className={compactButton.dark}
                        aria-label={`Mở #${caseCode(item.id)}`}
                        onClick={() => onSelect(item.id)}
                      >
                        Mở
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
