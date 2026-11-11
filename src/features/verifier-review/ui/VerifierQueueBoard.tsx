import { useMemo, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Search } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";
import { caseCode } from "../model/caseCode";
import {
  queueCategory,
  queueCategoryLabels,
  type QueueCategory,
} from "../model/verifierPresentation";
import type { z } from "zod";
import type { verifierCaseSummarySchema } from "../model/verifierReview.schema";

type Summary = z.infer<typeof verifierCaseSummarySchema>;
type Filter = "ALL" | QueueCategory;

const FILTER_PARAM = "filter";
const SEARCH_PARAM = "q";

/** Chip lọc: Tất cả, Chờ xét duyệt, Chờ bổ sung. */
const filterOptions: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "REVIEW", label: "Chờ xét duyệt" },
  { value: "SUPPLEMENT", label: "Đã từ chối" },
];

import { formatDateTime } from "@/shared/lib/dateFormat";

const filterMeta: Record<Filter, { dotColor: string }> = {
  ALL: { dotColor: "bg-heritage-muted" },
  REVIEW: { dotColor: "bg-blue-500" },
  SUPPLEMENT: { dotColor: "bg-orange-500" },
};

function parseFilter(value: string | null): Filter {
  const found = filterOptions.find((option) => option.value === value);
  if (found) return found.value;
  return "ALL";
}

const REVIEW_STEPS = [
  { title: "Mở hồ sơ", text: "Bên trái là thông tin eKYC gốc, bên phải là giấy chứng tử." },
  { title: "So 3 thông tin", text: "Họ tên, số CCCD, ngày sinh. Khớp thì tích ô." },
  { title: "Xem con dấu, chữ ký", text: "Giấy phải rõ, đủ trang, có dấu đỏ và chữ ký." },
  { title: "Ra quyết định", text: "Duyệt và mở kho, yêu cầu nộp lại, hoặc từ chối." },
] as const;

function StatCard({ title, value, note }: { title: string; value: number; note: string }) {
  return (
    <div className="rounded-2xl border border-heritage-border bg-heritage-surface p-5">
      <p className="text-sm">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-heritage-primary">{value}</p>
      <p className="mt-1 text-sm text-heritage-muted">{note}</p>
    </div>
  );
}

/**
 * Hàng chờ của Verifier theo thiết kế (màn "Hàng chờ", "Hàng chờ — lọc", "Hàng chờ — chưa có hồ sơ"):
 * 3 ô số liệu, chip lọc và ô tìm trên URL (?filter=, ?q=), bảng hồ sơ. Số liệu tính trên các hồ sơ
 * đang mở của trang hiện tại. DTO không có tên kho/người báo tin nên cột Chủ kho chỉ hiện 4 số cuối CCCD.
 */
export function VerifierQueueBoard({
  items,
  selected,
  refreshing,
  onRefresh,
  onSelect,
  children,
}: {
  items: Summary[];
  selected: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onSelect: (caseId: string) => void;
  /** Phân trang đặt cuối bảng. */
  children?: ReactNode;
}) {
  const [params, setParams] = useSearchParams();
  const filter = parseFilter(params.get(FILTER_PARAM));
  const search = params.get(SEARCH_PARAM) ?? "";
  const rows = useMemo(
    () => items.map((item) => ({ item, category: queueCategory(item) })),
    [items],
  );
  const counts = {
    ALL: rows.length,
    REVIEW: rows.filter((row) => row.category === "REVIEW").length,
    SUPPLEMENT: rows.filter((row) => row.category === "SUPPLEMENT").length,
  };
  const featured = rows
    .filter((row) => row.category === "REVIEW")
    .map((row) => row.item)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const keyword = search.trim().toLowerCase();
  const visible = rows.filter(({ item, category }) => {
    if (filter !== "ALL" && category !== filter) return false;
    if (!keyword) return true;
    const haystack =
      `${caseCode(item.id)} ${item.ownerCitizenIdLast4 ?? ""} ${item.executorFullName ?? ""} ${item.executorEmail ?? ""}`.toLowerCase();
    return haystack.includes(keyword);
  });
  const updateParam = (name: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && !(name === FILTER_PARAM && value === "ALL")) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Đang chờ bạn" value={counts.ALL} note="hồ sơ cần xem" />
        <StatCard title="Chờ xét duyệt" value={counts.REVIEW} note="xem được ngay" />
        <StatCard title="Đã từ chối" value={counts.SUPPLEMENT} note="Chờ Người thực thi nộp lại" />
      </div>
      {featured && (
        <section
          aria-label="Nên xem tiếp"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E6C98B] bg-[#F1E6CC] p-5"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7A5B25]">
              Nên xem tiếp
            </p>
            <p className="text-lg font-semibold text-heritage-primary">
              Hồ sơ báo tin #{caseCode(featured.id)}
            </p>
            <p className="text-sm text-heritage-muted">
              Người nộp: {featured.executorFullName ?? "Người thực hiện"}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Bắt đầu thẩm định hồ sơ #${caseCode(featured.id)}`}
            className={buttonStyles.gold}
            onClick={() => onSelect(featured.id)}
          >
            Bắt đầu thẩm định
          </button>
        </section>
      )}
      <Panel
        title="Danh sách hồ sơ"
        labelledBy="verifier-list-open"
        action={
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={refreshing}
            onClick={onRefresh}
          >
            Tải lại
          </button>
        }
      >
        {rows.length === 0 ? (
          <section aria-label="Hồ sơ chứng tử" className="space-y-3 py-2">
            <CheckCircle2 className="size-6 text-[#1F7A55]" aria-hidden="true" />
            <p role="status" className="text-lg font-semibold text-heritage-primary">
              Hiện chưa có hồ sơ nào chờ bạn.
            </p>
            <p className="text-sm text-heritage-muted">
              Khi người thực hiện nộp hồ sơ báo tin, hồ sơ sẽ hiện ở đây. Bạn sẽ nhận email nhắc.
            </p>
            <Link className={buttonStyles.outline} to={ROUTES.NOTARY.HISTORY}>
              Xem lịch sử xét duyệt
            </Link>
            {children}
          </section>
        ) : (
          <section aria-label="Hồ sơ chứng tử" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  className={
                    filter === option.value
                      ? "inline-flex items-center gap-2 min-h-11 rounded-full bg-heritage-primary px-4 text-sm font-semibold text-white shadow-sm"
                      : "inline-flex items-center gap-2 min-h-11 rounded-full border border-heritage-border bg-white/60 px-4 text-sm hover:bg-[#F4F1E6] dark:bg-black/20"
                  }
                  onClick={() => updateParam(FILTER_PARAM, option.value)}
                >
                  {option.value !== "ALL" && (
                    <span
                      className={`size-2 shrink-0 rounded-full ${filterMeta[option.value].dotColor}`}
                      aria-hidden="true"
                    />
                  )}
                  <span>{option.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                      filter === option.value
                        ? "bg-white/20 text-white"
                        : "bg-heritage-border/50 text-heritage-muted"
                    }`}
                  >
                    {counts[option.value]}
                  </span>
                </button>
              ))}
              <label className="relative ml-auto block min-w-56 flex-1 sm:max-w-sm">
                <span className="sr-only">Tìm hồ sơ</span>
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-heritage-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  maxLength={64}
                  placeholder="Tìm theo mã hồ sơ hoặc 4 số cuối CCCD"
                  className="min-h-11 w-full rounded-xl border border-heritage-border bg-white pl-9 pr-3 text-sm"
                  onChange={(event) => updateParam(SEARCH_PARAM, event.target.value)}
                />
              </label>
            </div>
            {visible.length === 0 ? (
              <p role="status" className="py-4 text-sm text-heritage-muted">
                Không có hồ sơ nào khớp bộ lọc.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <caption className="sr-only">Hồ sơ đang được giao</caption>
                  <thead>
                    <tr className="border-b border-heritage-border text-xs text-heritage-muted">
                      <th scope="col" className="py-3 pr-4 font-semibold">
                        Chủ kho
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Mã hồ sơ
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Người nộp
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Nộp lúc
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Lần nộp
                      </th>
                      <th scope="col" className="py-3 pl-4">
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-heritage-border">
                    {visible.map(({ item, category }) => {
                      const status = queueCategoryLabels[category];
                      return (
                        <tr key={item.id}>
                          <td className="py-4 pr-4">
                            <p className="font-semibold">
                              CCCD ****{item.ownerCitizenIdLast4 ?? "—"}
                            </p>
                            <p className="text-xs text-heritage-muted">
                              Ngày mất: {item.dateOfDeath ?? "—"}
                            </p>
                          </td>
                          <td className="px-4 py-4 font-mono text-xs">{caseCode(item.id)}</td>
                          <td className="px-4 py-4">
                            {item.executorFullName ?? "Người thực hiện"}
                          </td>
                          <td className="px-4 py-4">
                            {formatDateTime(item.submittedAt ?? item.assignedAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{(item.reviewVersionNo ?? 1) > 1 ? "Nộp lại" : "Lần đầu"}</span>
                              {category === "SUPPLEMENT" && (
                                <Chip tone={status.tone}>{status.label}</Chip>
                              )}
                              {item.supplementOverdueAt && (
                                <Chip tone="warning">Nộp lại quá hạn</Chip>
                              )}
                              {item.unreviewedFlagCount > 0 && (
                                <Chip tone="warning">
                                  {item.unreviewedFlagCount} cảnh báo chưa kiểm tra
                                </Chip>
                              )}
                            </div>
                          </td>
                          <td className="py-4 pl-4 text-right">
                            <button
                              type="button"
                              aria-pressed={selected === item.id}
                              aria-label={`Xem hồ sơ #${caseCode(item.id)}`}
                              className={buttonStyles.outline}
                              onClick={() => onSelect(item.id)}
                            >
                              Thẩm định
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {children}
          </section>
        )}
      </Panel>
      <Panel title="Cách thẩm định một hồ sơ">
        <ol className="grid gap-4 md:grid-cols-4">
          {REVIEW_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-sm font-semibold text-[#0A281E]"
              >
                {index + 1}
              </span>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="text-sm text-heritage-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
