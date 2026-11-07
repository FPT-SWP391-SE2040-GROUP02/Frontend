import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";

const SEARCH_DEBOUNCE_MS = 400;

/** Thanh công cụ lọc của các trang danh sách Admin: một hàng gọn, tự xuống dòng trên màn hẹp. */
export function ListFilterBar({
  children,
  onClear,
  clearLabel = "Xóa bộ lọc",
}: {
  children: ReactNode;
  onClear?: () => void;
  clearLabel?: string;
}) {
  return (
    <div role="group" aria-label="Bộ lọc" className="flex flex-wrap items-center gap-3">
      {children}
      {onClear && (
        <Button variant="ghost" className="min-h-11" onClick={onClear}>
          {clearLabel}
        </Button>
      )}
    </div>
  );
}

interface SearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  maxLength?: number;
  onCommit: (value: string) => void;
}

/** Ô tìm kiếm bo tròn; ghi lên URL sau khi ngừng gõ, đồng bộ lại khi URL đổi từ ngoài (Xóa bộ lọc, Back). */
export function ListSearchField({
  label,
  placeholder,
  value,
  maxLength = 100,
  onCommit,
}: SearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  const timer = useRef<number | undefined>(undefined);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  // URL đổi từ ngoài (Xóa bộ lọc, Back): hủy lần ghi trễ đang chờ để không ghi đè giá trị mới.
  useEffect(() => {
    window.clearTimeout(timer.current);
  }, [value]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const commit = (next: string) => {
    window.clearTimeout(timer.current);
    if (next.trim() !== value) onCommit(next.trim());
  };
  return (
    <form
      role="search"
      className="relative min-w-64 flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        commit(draft);
      }}
    >
      <label className="sr-only" htmlFor={`search-${label}`}>
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-heritage-muted"
        aria-hidden="true"
      />
      <input
        id={`search-${label}`}
        type="search"
        value={draft}
        maxLength={maxLength}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => commit(next), SEARCH_DEBOUNCE_MS);
        }}
        className="min-h-11 w-full rounded-full border border-heritage-border bg-white pl-11 pr-4 text-sm outline-none focus-visible:border-heritage-gold focus-visible:ring-2 focus-visible:ring-heritage-gold/30"
      />
    </form>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  allLabel: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

/** Ô chọn một giá trị; mục đầu là "Mọi …" (không lọc). */
export function ListSelectField({ label, value, allLabel, options, onChange }: SelectFieldProps) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 appearance-none rounded-full border border-heritage-border bg-white pl-4 pr-10 text-sm outline-none focus-visible:border-heritage-gold focus-visible:ring-2 focus-visible:ring-heritage-gold/30"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-heritage-muted"
        aria-hidden="true"
      />
    </label>
  );
}

interface DateFieldProps {
  label: string;
  /** Tên đọc cho trình đọc màn hình khi khác nhãn hiển thị (ví dụ "Đến hết ngày"). */
  ariaLabel?: string;
  /** Giá trị đang sai (ví dụ khoảng ngày ngược): báo cho trình đọc màn hình. */
  invalid?: boolean;
  value: string;
  onChange: (value: string) => void;
}

/** Ô chọn ngày (yyyy-MM-dd) dùng cho khoảng "Từ … Đến …". */
export function ListDateField({ label, ariaLabel, invalid, value, onChange }: DateFieldProps) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-full border border-heritage-border bg-white pl-4 pr-3 text-sm">
      <span className="text-heritage-muted">{label}</span>
      <input
        type="date"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-sm outline-none"
      />
    </label>
  );
}

interface PillProps {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}

/** Nút bật/tắt dạng viên thuốc, ví dụ "Của tôi", "Quá hạn". */
export function ListPill({ pressed, onClick, children, count }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
        pressed
          ? "border-heritage-primary bg-heritage-primary text-white"
          : "border-heritage-border bg-white text-heritage-text hover:bg-heritage-surface"
      }`}
    >
      {children}
      {count !== undefined && <span className="tabular-nums opacity-80">{count}</span>}
    </button>
  );
}

interface SegmentTabsProps {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string; count?: number }>;
  onChange: (value: string) => void;
}

/** Hàng thẻ chọn nhanh một nhóm (trạng thái, vai trò); mỗi thẻ có thể kèm số lượng. */
export function ListSegmentTabs({ label, value, options, onChange }: SegmentTabsProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <ListPill
          key={option.value}
          pressed={value === option.value}
          count={option.count}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </ListPill>
      ))}
    </div>
  );
}

/** Bảng danh sách: khung bo tròn, hàng tiêu đề nền nhạt, các hàng ngăn bằng đường mảnh. */
export function ListTable({
  columns,
  headings,
  children,
}: {
  columns: string;
  headings: string[];
  children: ReactNode;
}) {
  return (
    <div
      role="table"
      className="overflow-hidden rounded-2xl border border-heritage-border bg-heritage-surface shadow-sm"
      style={{ ["--cols" as string]: columns }}
    >
      <div
        role="row"
        className="hidden bg-stone-100 px-5 py-3 text-sm font-semibold text-heritage-muted md:grid md:grid-cols-[var(--cols)] md:gap-4"
      >
        {headings.map((heading) => (
          <span role="columnheader" key={heading}>
            {heading}
          </span>
        ))}
      </div>
      <div className="divide-y divide-heritage-border">{children}</div>
    </div>
  );
}

/** Một hàng của ListTable; trên màn hẹp các ô xếp dọc. */
export function ListTableRow({ children }: { children: ReactNode }) {
  return (
    <div
      role="row"
      className="grid gap-2 px-5 py-4 md:grid-cols-[var(--cols)] md:items-start md:gap-4"
    >
      {children}
    </div>
  );
}
