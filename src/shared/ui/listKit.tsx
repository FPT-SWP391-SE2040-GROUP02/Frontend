import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";

const SEARCH_DEBOUNCE_MS = 400;

/** Khung ô nhập chung theo prototype: cao 42px, bo 12px, viền mảnh, nền trắng. */
const FIELD_BASE =
  "rounded-xl border border-heritage-border bg-white text-sm outline-none focus-visible:border-heritage-gold focus-visible:ring-2 focus-visible:ring-heritage-gold/30";

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
    <div role="group" aria-label="Bộ lọc" className="flex flex-wrap items-center gap-2">
      {children}
      {onClear && (
        <Button variant="ghost" className="min-h-10" onClick={onClear}>
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

/** Ô tìm kiếm; ghi lên URL sau khi ngừng gõ, đồng bộ lại khi URL đổi từ ngoài (Xóa bộ lọc, Back). */
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
      className="relative min-w-56 flex-[1_1_220px]"
      onSubmit={(event) => {
        event.preventDefault();
        commit(draft);
      }}
    >
      <label className="sr-only" htmlFor={`search-${label}`}>
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-heritage-muted"
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
        className={`h-[42px] w-full pl-9 pr-3 ${FIELD_BASE}`}
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
        className={`h-10 min-w-44 appearance-none pl-3.5 pr-9 font-medium ${FIELD_BASE}`}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-[15px] -translate-y-1/2 text-heritage-muted"
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
    <label
      className={`inline-flex h-10 items-center gap-2 pl-3 pr-1 text-[13px] font-medium text-heritage-muted ${FIELD_BASE}`}
    >
      <span>{label}</span>
      <input
        type="date"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[38px] bg-transparent px-1.5 text-[13px] text-heritage-text outline-none"
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

/** Nút bật/tắt dạng viên thuốc, ví dụ "Của tôi", "Quá hạn"; có thể kèm số đếm trong ô nhỏ. */
export function ListPill({ pressed, onClick, children, count }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] font-semibold transition-colors ${
        pressed
          ? "border-heritage-primary bg-heritage-primary text-white"
          : "border-heritage-border bg-white text-heritage-text hover:bg-[#e5ede8]"
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`min-w-5 rounded-full px-1.5 py-px text-center text-xs tabular-nums ${
            pressed ? "bg-white/20" : "bg-[#e8e5dd]"
          }`}
        >
          {count}
        </span>
      )}
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

/** Màu viền trái của một hàng theo trạng thái (prototype: data-c). */
export type RowTone = "bad" | "warn" | "info" | "ok" | "none";

const ROW_TONE_BAR: Record<RowTone, string> = {
  bad: "shadow-[inset_4px_0_0_#a32119] bg-[#a32119]/5 hover:bg-[#a32119]/10",
  warn: "shadow-[inset_4px_0_0_#8a5a0b] bg-[#8a5a0b]/5 hover:bg-[#8a5a0b]/10",
  info: "shadow-[inset_4px_0_0_#2f5d7c] bg-[#2f5d7c]/5 hover:bg-[#2f5d7c]/10",
  ok: "shadow-[inset_4px_0_0_#1f7a55] bg-[#1f7a55]/5 hover:bg-[#1f7a55]/10",
  none: "shadow-[inset_4px_0_0_#dcd9d0] hover:bg-heritage-gold/10",
};

/** Bảng danh sách: khung bo 16px, hàng tiêu đề cao 44px nền nhạt, các hàng ngăn bằng đường mảnh. */
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
      className="overflow-hidden rounded-2xl border border-heritage-border bg-heritage-surface shadow-[0_1px_2px_rgba(11,41,30,.06),0_6px_18px_rgba(11,41,30,.05)]"
      style={{ ["--cols" as string]: columns }}
    >
      <div
        role="row"
        className="hidden h-11 items-center gap-4 border-b border-heritage-border bg-[#e8e5dd] px-[18px] text-xs font-semibold tracking-[0.02em] text-heritage-muted md:grid md:grid-cols-[var(--cols)]"
      >
        {headings.map((heading) => (
          <span role="columnheader" key={heading}>
            {heading}
          </span>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}

/** Một hàng của ListTable; trên màn hẹp các ô xếp dọc. `tone` vẽ viền trái màu theo trạng thái. */
export function ListTableRow({ children, tone }: { children: ReactNode; tone?: RowTone }) {
  return (
    <div
      role="row"
      className={`grid gap-2 border-t border-[#e8e5dd] px-[18px] py-4 transition-colors first:border-t-0 md:grid-cols-[var(--cols)] md:items-start md:gap-4 ${
        tone ? ROW_TONE_BAR[tone] : "hover:bg-heritage-gold/10"
      }`}
    >
      {children}
    </div>
  );
}
