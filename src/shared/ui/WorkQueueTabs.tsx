import type { ReactNode } from "react";

/** Một dòng việc trong danh sách: dòng chính, dòng phụ, các nhãn nhỏ và một nút hành động. */
export interface WorkQueueRow {
  key: string;
  title: string;
  subtitle: string;
  /** Các nhãn nhỏ (lựa chọn, đã bổ sung...) do nơi dùng dựng sẵn. */
  chips?: ReactNode;
  /** Nút hoặc liên kết ở cuối dòng. */
  action: ReactNode;
}

/** Một tab: tên, số đếm, dòng gợi ý, các dòng việc và nội dung khi trống. */
export interface WorkQueueTab {
  key: string;
  label: string;
  count: number;
  /** Dòng nhỏ dưới tab nói cách làm việc ở tab này. */
  hint: string;
  rows: WorkQueueRow[];
  emptyTitle: string;
  emptyText: string;
  /** true: dòng đầu tiên tô nổi (việc nên làm trước). */
  highlightFirst?: boolean;
}

/**
 * Danh sách việc cần làm có hai tab và số đếm, dùng chung cho Hồ sơ báo tin và Hồ sơ người nhận của Người xét duyệt.
 * Tab nào đang mở do nơi dùng giữ (thường là tham số trên URL). Thứ tự dòng do nơi dùng quyết định, ở đây không sắp xếp lại.
 */
export function WorkQueueTabs({
  tabs,
  activeKey,
  onSelect,
  ariaLabel,
}: {
  tabs: WorkQueueTab[];
  activeKey: string;
  onSelect: (key: string) => void;
  ariaLabel: string;
}) {
  const active = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];
  if (!active) return null;
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const selected = tab.key === active.key;
          return (
            <button
              key={tab.key}
              id={`work-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`work-panel-${tab.key}`}
              className={
                selected
                  ? "inline-flex min-h-11 items-center gap-2 rounded-full bg-heritage-primary px-4 text-sm font-semibold text-white shadow-sm"
                  : "inline-flex min-h-11 items-center gap-2 rounded-full border border-heritage-border bg-white/60 px-4 text-sm hover:bg-[#F4F1E6]"
              }
              onClick={() => onSelect(tab.key)}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                  selected ? "bg-white/20 text-white" : "bg-heritage-border/50 text-heritage-muted"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`work-panel-${active.key}`}
        aria-labelledby={`work-tab-${active.key}`}
        className="space-y-3"
      >
        <p className="text-sm text-heritage-muted">{active.hint}</p>
        {active.rows.length === 0 ? (
          <div
            role="status"
            className="space-y-1 rounded-2xl border border-heritage-border bg-white p-6"
          >
            <p className="font-semibold text-heritage-primary">{active.emptyTitle}</p>
            <p className="text-sm text-heritage-muted">{active.emptyText}</p>
          </div>
        ) : (
          <ul className="space-y-3" aria-label={active.label}>
            {active.rows.map((row, index) => {
              const featured = Boolean(active.highlightFirst) && index === 0;
              return (
                <li
                  key={row.key}
                  data-featured={featured ? "true" : undefined}
                  className={
                    featured
                      ? "flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-l-8 border-[#E0C486] border-l-[#B8892D] bg-[#FFFBEF] p-4 shadow-sm"
                      : "flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-heritage-border bg-white p-4 shadow-sm"
                  }
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-heritage-primary">{row.title}</p>
                    <p className="text-sm text-heritage-muted">{row.subtitle}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    {row.chips}
                    {row.action}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
