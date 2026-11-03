import { useState, type ReactNode } from "react";
import { cn } from "cn";
import { Initial } from "@/shared/ui/heritageKit";
import type { MemberPickerItem } from "../model/groupMembers";

export interface MemberPickerProps {
  title: string;
  items: MemberPickerItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  searchPlaceholder: string;
  emptyText: string;
  /** Hiện nút "Chọn tất cả" (chỉ chọn các mục không bị khóa và đang hiện theo ô tìm). */
  allowSelectAll?: boolean;
  withInitial?: boolean;
  /** Dòng chú thích nằm giữa ô tìm và danh sách. */
  hint?: ReactNode;
  /** Nội dung cuối khung, ví dụ "+ Thêm người nhận mới". */
  footer?: ReactNode;
  disabled?: boolean;
}

/** Một cột chọn nhiều có ô tìm, dùng trong dialog tạo gói và dialog bổ sung thành viên cho gói. */
export function MemberPicker(props: MemberPickerProps) {
  const [search, setSearch] = useState("");
  const keyword = search.trim().toLocaleLowerCase("vi-VN");

  const shown: MemberPickerItem[] = [];
  for (const item of props.items) {
    if (keyword === "" || item.label.toLocaleLowerCase("vi-VN").includes(keyword)) {
      shown.push(item);
    }
  }

  const selectable: string[] = [];
  for (const item of shown) {
    if (!item.disabled) {
      selectable.push(item.id);
    }
  }
  let allSelected = selectable.length > 0;
  for (const id of selectable) {
    if (!props.selectedIds.includes(id)) {
      allSelected = false;
    }
  }

  function toggle(id: string): void {
    if (props.selectedIds.includes(id)) {
      const next: string[] = [];
      for (const selectedId of props.selectedIds) {
        if (selectedId !== id) {
          next.push(selectedId);
        }
      }
      props.onChange(next);
    } else {
      props.onChange([...props.selectedIds, id]);
    }
  }

  function toggleAll(): void {
    const next: string[] = [];
    if (allSelected) {
      for (const id of props.selectedIds) {
        if (!selectable.includes(id)) {
          next.push(id);
        }
      }
    } else {
      for (const id of props.selectedIds) {
        next.push(id);
      }
      for (const id of selectable) {
        if (!next.includes(id)) {
          next.push(id);
        }
      }
    }
    props.onChange(next);
  }

  let selectAllLabel = "Chọn tất cả";
  if (allSelected) {
    selectAllLabel = "Bỏ chọn tất cả";
  }

  const rows: ReactNode[] = [];
  for (const item of shown) {
    const checked = props.selectedIds.includes(item.id);
    rows.push(
      <li key={item.id}>
        <label
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
            checked && "bg-[#DDEFE6]",
            !checked && !item.disabled && "cursor-pointer hover:bg-[#F4F1E6]",
            item.disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={props.disabled || item.disabled}
            onChange={() => toggle(item.id)}
            className="size-4 shrink-0 accent-[#0A281E]"
          />
          {props.withInitial && <Initial name={item.label} className="size-8 text-sm" />}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[#0A281E]">
              {item.label}
            </span>
            {item.detail && (
              <span className="block truncate text-xs text-heritage-muted">{item.detail}</span>
            )}
          </span>
        </label>
      </li>,
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#0A281E]">
          {props.title}
          <span className="font-normal text-heritage-muted">
            {" "}
            · đã chọn {props.selectedIds.length}
          </span>
        </p>
        {props.allowSelectAll && selectable.length > 0 && (
          <button
            type="button"
            disabled={props.disabled}
            onClick={toggleAll}
            className="text-xs font-semibold text-[#0A281E] underline underline-offset-4 disabled:opacity-50"
          >
            {selectAllLabel}
          </button>
        )}
      </div>
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-heritage-border bg-white">
        {props.items.length === 0 && (
          <p className="p-4 text-xs text-heritage-muted">{props.emptyText}</p>
        )}
        {props.items.length > 0 && (
          <>
            <div className="p-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={props.searchPlaceholder}
                aria-label={props.searchPlaceholder}
                disabled={props.disabled}
                className="h-10 w-full rounded-lg border border-heritage-border bg-white px-3 text-sm outline-none focus:border-heritage-gold"
              />
            </div>
            {props.hint && (
              <div className="border-y border-heritage-border bg-[#F4F1E6] px-3 py-1.5 text-xs font-medium text-[#7A5B25]">
                {props.hint}
              </div>
            )}
            <ul className="max-h-64 space-y-0.5 overflow-y-auto p-1.5">{rows}</ul>
            {shown.length === 0 && (
              <p className="px-4 pb-3 text-xs text-heritage-muted">Không tìm thấy mục phù hợp.</p>
            )}
          </>
        )}
        {props.footer && (
          <div className="mt-auto border-t border-heritage-border px-4 py-3 text-sm font-semibold">
            {props.footer}
          </div>
        )}
      </div>
    </div>
  );
}
