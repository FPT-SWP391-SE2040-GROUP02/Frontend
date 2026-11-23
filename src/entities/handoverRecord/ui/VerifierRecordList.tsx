import { buttonStyles, Chip, formatDate, Panel } from "@/shared/ui/heritageKit";
import { caseCode } from "@/shared/lib/caseCode";
import { useVerifierRecords } from "../model/useHandoverRecord";
import { recordStatusLabel } from "../model/recordPresentation";

/**
 * Danh sách biên bản được giao cho luật sư. scope="open": biên bản luật sư chưa ký;
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
    <Panel
      title={scope === "open" ? "Biên bản cần xử lý" : "Biên bản đã hoàn tất"}
      labelledBy={`record-list-${scope}`}
      action={
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Tải lại
        </button>
      }
    >
      {items.length === 0 ? (
        <p role="status" className="py-4 text-sm">
          {scope === "open" ? "Chưa có biên bản nào cần xử lý." : "Chưa có biên bản nào hoàn tất."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <caption className="sr-only">Biên bản bàn giao</caption>
            <thead>
              <tr className="border-b border-heritage-border text-sm text-heritage-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Mã biên bản
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Chủ kho
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Người nhận
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Bước
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Ngày mở
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-heritage-border">
              {items.map((item) => {
                const status = recordStatusLabel[item.status];
                return (
                  <tr key={item.id}>
                    <td className="py-4 pr-4">
                      <button
                        type="button"
                        className="cursor-pointer font-semibold underline-offset-4 hover:underline"
                        onClick={() => onSelect(item.id)}
                      >
                        {`Biên bản #${caseCode(item.id)}`}
                      </button>
                    </td>
                    <td className="px-4 py-4">{item.ownerName || "—"}</td>
                    <td className="px-4 py-4">{item.recipientCount}</td>
                    <td className="px-4 py-4">
                      <Chip tone={status.tone}>{status.label}</Chip>
                    </td>
                    <td className="px-4 py-4 text-heritage-muted">
                      {formatDate(item.requestedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
