import { useSearchParams } from "react-router-dom";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { buttonStyles, Chip, formatDate, Panel } from "@/shared/ui/heritageKit";
import { useVerifierCases, verifierKeys } from "../model/useVerifierReview";
import { caseCode } from "../model/caseCode";
import { historyDecision, isOpenCase, queueStatus } from "../model/verifierPresentation";
import type { PaginationParams } from "@/shared/types";

const dateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "Chưa có";

/**
 * Danh sách hồ sơ giao cho Verifier. scope="open": hàng chờ (thiết kế "Hàng chờ xét duyệt");
 * scope="closed": lịch sử các hồ sơ đã có kết quả. Chọn hồ sơ qua onSelect (URL ?caseId=).
 */
export function VerifierCaseList({
  scope = "open",
  title,
  onSelect,
}: {
  scope?: "open" | "closed";
  title?: string;
  onSelect: (caseId: string) => void;
}) {
  const [params, setParams] = useSearchParams();
  const selected = params.get("caseId");
  const requested = Number(params.get("page") ?? 1);
  const page =
    Number.isSafeInteger(requested) && requested > 0 && requested <= 1_000_000 ? requested : 1;
  const setPage = (value: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(value));
    setParams(next);
  };
  const pagination: PaginationParams = { pageIndex: page, pageSize: 20 };
  const query = useVerifierCases(pagination);
  const client = useQueryClient();
  const detailFetching = useIsFetching({
    queryKey: verifierKeys.detail(selected ?? "none"),
    exact: true,
  });
  const refreshing = query.isFetching || detailFetching > 0;
  const refresh = () => {
    void query.refetch();
    if (selected) {
      void client.invalidateQueries({ queryKey: verifierKeys.detail(selected), exact: true });
    }
  };
  const heading = title ?? (scope === "open" ? "Hàng chờ xét duyệt" : "Đã xử lý");
  if (query.isPending)
    return (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải danh sách hồ sơ…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-2xl bg-[#F8E1DE] p-5">
        <p className="text-sm text-[#7A1A14]">Không tải được danh sách hồ sơ.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={refresh}
          disabled={refreshing}
        >
          Thử lại
        </button>
      </div>
    );
  const data = query.data;
  const items = data.items.filter((item) =>
    scope === "open" ? isOpenCase(item.status) : !isOpenCase(item.status),
  );
  return (
    <Panel
      title={heading}
      labelledBy={`verifier-list-${scope}`}
      action={
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={refreshing}
          onClick={refresh}
        >
          Tải lại
        </button>
      }
    >
      <section aria-label="Hồ sơ chứng tử" className="space-y-4">
        <p className="text-sm text-heritage-muted">
          {scope === "open"
            ? `${data.totalCount} hồ sơ đang được giao`
            : `${items.length} hồ sơ đã có kết quả`}
        </p>
        {items.length === 0 && (
          <p role="status" className="py-4 text-sm">
            {scope === "open"
              ? "Hiện không có hồ sơ nào đang được giao cho tài khoản này."
              : "Chưa có hồ sơ nào đã xử lý."}
          </p>
        )}
        {scope === "open" ? (
          <ul className="divide-y divide-heritage-border">
            {items.map((item) => {
              const status = queueStatus[item.status];
              return (
                <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    aria-pressed={selected === item.id}
                    onClick={() => onSelect(item.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-4 rounded-xl p-2 text-left transition-colors hover:bg-[#F4F1E6]"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="break-words font-semibold">Hồ sơ #{caseCode(item.id)}</p>
                      <p className="text-sm text-heritage-muted">
                        CCCD · ****{item.ownerCitizenIdLast4 ?? "—"} · Ngày mất:{" "}
                        {item.dateOfDeath ?? "—"}
                      </p>
                      <p className="text-sm text-heritage-muted">
                        {item.status === "SUPPLEMENT_REQUIRED"
                          ? "Đang chờ Executor bổ sung"
                          : `Hạn xét: ${dateTime(item.dueAt)}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Chip tone={status.tone}>{status.label}</Chip>
                      {item.supplementOverdueAt && <Chip tone="warning">Bổ sung quá hạn</Chip>}
                      {item.unreviewedFlagCount > 0 && (
                        <Chip tone="warning">{item.unreviewedFlagCount} cờ chưa xét</Chip>
                      )}
                      <span className={buttonStyles.outline} aria-hidden="true">
                        Xem hồ sơ
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <caption className="sr-only">Hồ sơ đã xử lý</caption>
                <thead>
                  <tr className="border-b border-heritage-border text-xs text-heritage-muted">
                    <th scope="col" className="py-3 pr-4 font-semibold">
                      Mã hồ sơ
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      CCCD Chủ kho
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Quyết định
                    </th>
                    <th scope="col" className="py-3 pl-4 font-semibold">
                      Ngày
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-heritage-border">
                  {items.map((item) => {
                    const decision = historyDecision[item.status];
                    return (
                      <tr key={item.id}>
                        <td className="py-4 pr-4">
                          <button
                            type="button"
                            className="font-semibold underline-offset-4 hover:underline"
                            onClick={() => onSelect(item.id)}
                          >
                            Hồ sơ #{caseCode(item.id)}
                          </button>
                        </td>
                        <td className="px-4 py-4">****{item.ownerCitizenIdLast4 ?? "—"}</td>
                        <td className="px-4 py-4">
                          {decision && <Chip tone={decision.tone}>{decision.label}</Chip>}
                        </td>
                        <td className="py-4 pl-4 text-heritage-muted">
                          {item.closedAt ? formatDate(item.closedAt) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
        {(data.totalPages > 1 || page > 1) && (
          <nav aria-label="Phân trang" className="flex items-center justify-between gap-4">
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={page <= 1 || query.isFetching}
              onClick={() => setPage(page - 1)}
            >
              Trang trước
            </button>
            <span className="text-sm">
              Trang {data.pageIndex}/{data.totalPages}
            </span>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={!data.hasNextPage || query.isFetching}
              onClick={() => setPage(page + 1)}
            >
              Trang sau
            </button>
          </nav>
        )}
      </section>
    </Panel>
  );
}
