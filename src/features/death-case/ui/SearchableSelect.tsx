import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface SearchableOption {
  code: string;
  name: string;
}

const TRIGGER_CLASS =
  "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-[#D5D0C3] bg-[var(--surface)] px-3 py-1.5 text-left text-sm text-[var(--text-main)] outline-none focus-visible:border-[var(--gold)] focus-visible:ring-3 focus-visible:ring-[var(--gold)]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[#D9534F] aria-invalid:bg-[#FFF9F9]";

/** Bỏ dấu và chữ hoa để lọc "ben thanh" ra "Phường Bến Thành". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi-VN");
}

/**
 * Ô chọn có ô gõ để lọc nằm ngay trong danh sách thả xuống (danh sách phường/xã dài hơn 100 mục).
 * Bàn phím: mũi tên lên/xuống chọn dòng, Enter chọn, Escape đóng; bấm ra ngoài cũng đóng.
 * Giá trị là mã (code); tên chỉ để hiển thị và lọc.
 */
export function SearchableSelect({
  id,
  value,
  options,
  placeholder,
  searchLabel,
  emptyText = "Không có mục nào khớp.",
  disabled,
  invalid,
  describedBy,
  onChange,
}: {
  id: string;
  value: string;
  options: SearchableOption[];
  /** Chữ hiện ở ô khi chưa chọn gì (hoặc khi bị khóa). */
  placeholder: string;
  searchLabel: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (code: string) => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    if (needle.length === 0) return options;
    return options.filter((item) => normalize(item.name).includes(needle));
  }, [options, query]);
  const selected = options.find((item) => item.code === value);

  // Đóng khi bấm ra ngoài.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Mở ra thì đưa con trỏ vào ô gõ và cuộn tới dòng đang chọn.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const row = rootRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    // jsdom không có scrollIntoView.
    row?.scrollIntoView?.({ block: "nearest" });
  }, [open, active]);

  const openList = () => {
    setQuery("");
    const index = options.findIndex((item) => item.code === value);
    setActive(index >= 0 ? index : 0);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const choose = (item: SearchableOption) => {
    setOpen(false);
    triggerRef.current?.focus();
    if (item.code !== value) onChange(item.code);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        className={TRIGGER_CLASS}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openList();
          }
        }}
      >
        <span className={`truncate ${selected ? "" : "text-[#8E9F96]"}`}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-heritage-muted" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-[#D5D0C3] bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#E7E3D6] px-3 py-2">
            <Search className="size-4 shrink-0 text-heritage-muted" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              aria-label={searchLabel}
              aria-controls={listId}
              aria-activedescendant={visible.length > 0 ? `${listId}-${active}` : undefined}
              placeholder="Gõ tên để lọc"
              value={query}
              className="h-8 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#8E9F96]"
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  close();
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((current) => Math.min(current + 1, visible.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((current) => Math.max(current - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const item = visible[active];
                  if (item) choose(item);
                }
              }}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label={searchLabel}
            className="max-h-64 overflow-y-auto py-1"
          >
            {visible.map((item, index) => (
              <li
                key={item.code}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={item.code === value}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                  index === active ? "bg-[#F1E6CC]" : "hover:bg-[#F7F3E6]"
                }`}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item)}
              >
                <span>{item.name}</span>
                {item.code === value && <Check className="size-4 shrink-0" aria-hidden="true" />}
              </li>
            ))}
            {visible.length === 0 && (
              <li role="presentation" className="px-3 py-2 text-sm text-heritage-muted">
                {emptyText}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
