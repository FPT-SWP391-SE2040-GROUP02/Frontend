import * as React from "react";
import { Input } from "./input";

/** Đổi "2006-07-30" thành "30/07/2006"; chuỗi không đúng dạng thì trả rỗng. */
export function isoToDisplayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match === null) {
    return "";
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Đổi "30/07/2006" thành "2006-07-30"; null khi chưa đủ hoặc không phải ngày có thật (ví dụ 31/02). */
export function displayToIsoDate(display: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (match === null) {
    return null;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const real =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  if (!real || year < 1000) {
    return null;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/** Giữ lại chữ số (tối đa 8) rồi chèn dấu / khi người dùng gõ tiếp: 3007 → 30/07, 30072006 → 30/07/2006. */
export function formatTypedDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export interface DateInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type" | "defaultValue"
> {
  /** Giá trị dạng yyyy-mm-dd (chuỗi rỗng khi chưa có). */
  value: string;
  /** Gọi mỗi lần gõ: yyyy-mm-dd khi đã đủ một ngày có thật, ngược lại chuỗi rỗng. */
  onChange: (iso: string) => void;
}

/**
 * Ô nhập ngày theo thứ tự ngày/tháng/năm, không phụ thuộc ngôn ngữ trình duyệt (ô type="date" gốc hiện tháng/ngày/năm
 * trên trình duyệt tiếng Anh). Bên ngoài chỉ thấy giá trị yyyy-mm-dd, cùng dạng Backend nhận.
 */
export function DateInput({ value, onChange, placeholder, ...props }: DateInputProps) {
  const [text, setText] = React.useState(() => isoToDisplayDate(value));
  // Giá trị bên ngoài đổi (ví dụ reset form) mà khác chữ đang hiện thì hiện lại theo giá trị đó.
  const shown = displayToIsoDate(text);
  let shownIso = "";
  if (shown !== null) {
    shownIso = shown;
  }
  if (value !== shownIso) {
    setText(isoToDisplayDate(value));
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const next = formatTypedDate(event.target.value);
    setText(next);
    const iso = displayToIsoDate(next);
    if (iso === null) {
      onChange("");
    } else {
      onChange(iso);
    }
  }

  let hint = "dd/mm/yyyy";
  if (placeholder !== undefined) {
    hint = placeholder;
  }
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={10}
      placeholder={hint}
      value={text}
      onChange={handleChange}
    />
  );
}
