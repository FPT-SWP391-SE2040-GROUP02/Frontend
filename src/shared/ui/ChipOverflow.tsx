import { useState, type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { ChevronDown, ChevronUp, XIcon } from "lucide-react";
import { cn } from "cn";
import { Initial } from "./heritageKit";

export interface ChipOverflowItem {
  id: string;
  label: string;
  /** Dòng phụ trong popup, ví dụ "CCCD ****1234" hoặc loại tài sản. */
  detail?: string;
}

export interface ChipOverflowProps {
  items: ChipOverflowItem[];
  /** Tiêu đề popup, ví dụ "5 người nhận của gói". */
  popupTitle: string;
  /** Hiện chữ cái đầu trước tên (dùng cho người nhận). */
  withInitial?: boolean;
  /** Số chip hiện trực tiếp; phần còn lại gom vào nút "+N". */
  visibleCount?: number;
  /** Chữ gợi ý cho ô tìm trong popup. */
  searchPlaceholder?: string;
  /** Nội dung cuối popup, ví dụ link "Quản lý người nhận". */
  footer?: ReactNode;
}

/** Từ số mục này trở lên thì popup có ô tìm. */
const SEARCH_THRESHOLD = 8;

function ItemChip({ item, withInitial }: { item: ChipOverflowItem; withInitial: boolean }) {
  return (
    <span className="inline-flex max-w-[12rem] min-w-0 shrink items-center gap-1.5 rounded-full bg-[#ECE8DB] py-1 pr-3 pl-1.5 text-xs font-medium text-[#0A281E]">
      {withInitial && <Initial name={item.label} className="size-5 text-[10px]" />}
      {!withInitial && <span className="w-1" aria-hidden="true" />}
      <span className="truncate">{item.label}</span>
    </span>
  );
}

/**
 * Hàng chip một dòng: hiện vài chip đầu rồi gom phần còn lại vào nút "+N".
 * Bấm "+N" mở popup liệt kê đủ, nên hàng chip không bao giờ xuống dòng. Dùng chung cho người nhận và tài sản.
 */
export function ChipOverflow({
  items,
  popupTitle,
  withInitial = false,
  visibleCount = 2,
  searchPlaceholder = "Tìm…",
  footer,
}: ChipOverflowProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const visible: ChipOverflowItem[] = [];
  for (let index = 0; index < items.length && index < visibleCount; index += 1) {
    visible.push(items[index]);
  }
  const hiddenCount = items.length - visible.length;

  const keyword = search.trim().toLocaleLowerCase("vi-VN");
  const filtered: ChipOverflowItem[] = [];
  for (const item of items) {
    if (keyword === "" || item.label.toLocaleLowerCase("vi-VN").includes(keyword)) {
      filtered.push(item);
    }
  }

  const rows: ReactNode[] = [];
  for (const item of filtered) {
    rows.push(
      <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
        {withInitial && <Initial name={item.label} className="size-7 text-xs" />}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#0A281E]">{item.label}</p>
          {item.detail && <p className="text-xs text-heritage-muted">{item.detail}</p>}
        </div>
      </li>,
    );
  }

  function changeOpen(next: boolean): void {
    setOpen(next);
    if (!next) {
      setSearch("");
    }
  }

  let toggleIcon = <ChevronDown className="size-3.5" aria-hidden="true" />;
  if (open) {
    toggleIcon = <ChevronUp className="size-3.5" aria-hidden="true" />;
  }

  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-hidden">
      {visible.map((item) => (
        <ItemChip key={item.id} item={item} withInitial={withInitial} />
      ))}
      {hiddenCount > 0 && (
        <Popover.Root open={open} onOpenChange={changeOpen}>
          <Popover.Trigger
            aria-label={`Xem thêm ${hiddenCount} mục: ${popupTitle}`}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold",
              open && "border-[#0A281E] bg-[#0A281E] text-white",
              !open && "border-[#BDB8A6] bg-white text-[#0A281E] hover:bg-[#F4F1E6]",
            )}
          >
            +{hiddenCount}
            {toggleIcon}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
              <Popover.Popup className="w-72 overflow-hidden rounded-xl border border-heritage-border bg-[#FBFAF5] shadow-lg outline-none">
                <div className="flex items-center justify-between gap-2 border-b border-heritage-border px-4 py-3">
                  <Popover.Title className="text-sm font-semibold text-[#0A281E]">
                    {popupTitle}
                  </Popover.Title>
                  <Popover.Close
                    aria-label="Đóng"
                    className="flex size-6 items-center justify-center rounded-full bg-[#ECE8DB] text-[#0A281E] hover:bg-[#E0DCCD]"
                  >
                    <XIcon className="size-3.5" aria-hidden="true" />
                  </Popover.Close>
                </div>
                {items.length >= SEARCH_THRESHOLD && (
                  <div className="px-3 pt-3">
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={searchPlaceholder}
                      aria-label={searchPlaceholder}
                      className="h-9 w-full rounded-lg border border-heritage-border bg-white px-3 text-sm outline-none focus:border-heritage-gold"
                    />
                  </div>
                )}
                <ul className="max-h-60 overflow-y-auto py-1">{rows}</ul>
                {rows.length === 0 && (
                  <p className="px-4 pb-3 text-xs text-heritage-muted">
                    Không tìm thấy mục phù hợp.
                  </p>
                )}
                {footer && (
                  <div className="border-t border-heritage-border px-4 py-2.5 text-xs font-semibold">
                    {footer}
                  </div>
                )}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>
  );
}
