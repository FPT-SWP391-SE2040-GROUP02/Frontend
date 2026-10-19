import { useSearchParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { useVerifierCases } from "../model/useVerifierReview";
import { caseStatusLabels } from "../model/verifierReview.schema";
import type { z } from "zod";
import type { verifierCaseStatusSchema } from "../model/verifierReview.schema";
import type { PaginationParams } from "@/shared/types";

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "Chưa có";
/** Danh sách hồ sơ Verifier; chọn hồ sơ theo URL search param `caseId`. */
export function VerifierCaseList({ onSelect }: { onSelect: (caseId: string) => void }) {
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
  if (query.isPending)
    return (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải danh sách hồ sơ…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Không tải được danh sách hồ sơ.</p>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại
        </Button>
      </div>
    );
  const data = query.data;
  return (
    <section aria-label="Hồ sơ chứng tử" className="space-y-3">
      {data.items.length === 0 && (
        <p role="status">Hiện không có hồ sơ nào đang được giao cho tài khoản này.</p>
      )}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-heritage-muted">{data.totalCount} hồ sơ đang được giao</p>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Tải lại
        </Button>
      </div>
      <ul className="divide-y divide-heritage-border overflow-hidden rounded-xl border border-heritage-border bg-heritage-surface">
        {data.items.map((item) => {
          const isSelected = selected === item.id;
          const status = caseStatusLabels[item.status as z.infer<typeof verifierCaseStatusSchema>];
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(item.id)}
                className={`flex w-full items-start justify-between gap-4 p-4 text-left transition-colors ${
                  isSelected ? "bg-heritage-primary/5" : "hover:bg-heritage-primary/5"
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <p className="break-words text-sm font-semibold">Hồ sơ #{item.id.slice(0, 8)}</p>
                  <p className="text-xs text-heritage-muted">
                    CCCD · ****{item.ownerCitizenIdLast4 ?? "—"} · Ngày mất:{" "}
                    {item.dateOfDeath ?? "—"}
                  </p>
                  <p className="text-xs text-heritage-muted">
                    {item.status === "SUPPLEMENT_REQUIRED"
                      ? "Đang chờ Executor bổ sung"
                      : `Hạn xét: ${formatDate(item.dueAt)}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="rounded-full bg-heritage-primary/10 px-3 py-1 text-xs font-semibold text-heritage-primary">
                    {status}
                  </span>
                  {item.unreviewedFlagCount > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      {item.unreviewedFlagCount} cờ chưa xét
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {(data.totalPages > 1 || page > 1) && (
        <nav aria-label="Phân trang" className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Trang trước
          </Button>
          <span className="text-sm">
            Trang {data.pageIndex}/{data.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!data.hasNextPage || query.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Trang sau
          </Button>
        </nav>
      )}
    </section>
  );
}
