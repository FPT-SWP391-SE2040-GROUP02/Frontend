/**
 * Ngày giờ in trong biên bản phân chia, luôn theo giờ Việt Nam để Chủ tài sản, Người thực thi và bản in cùng đọc ra một giờ.
 * Giá trị thiếu hoặc sai dạng trả null để nơi gọi tự chọn câu thay thế.
 */
const ZONE = "Asia/Ho_Chi_Minh";

const partsFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: ZONE,
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

interface DateParts {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
}

function readParts(value: string | null | undefined): DateParts | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const parts: DateParts = { day: "", month: "", year: "", hour: "", minute: "" };
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type === "day") {
      parts.day = part.value;
    }
    if (part.type === "month") {
      parts.month = part.value;
    }
    if (part.type === "year") {
      parts.year = part.value;
    }
    if (part.type === "hour") {
      parts.hour = part.value;
    }
    if (part.type === "minute") {
      parts.minute = part.value;
    }
  }
  return parts;
}

function twoDigits(value: string): string {
  return value.padStart(2, "0");
}

/** "15 tháng 11 năm 2026" (không kèm chữ "ngày"). */
export function formatLongDate(value: string | null | undefined): string | null {
  const parts = readParts(value);
  if (parts === null) {
    return null;
  }
  return `${parts.day} tháng ${parts.month} năm ${parts.year}`;
}

/** "09:42 ngày 15/11/2026". */
export function formatTimeOnDate(value: string | null | undefined): string | null {
  const parts = readParts(value);
  if (parts === null) {
    return null;
  }
  return `${parts.hour}:${parts.minute} ngày ${twoDigits(parts.day)}/${twoDigits(parts.month)}/${parts.year}`;
}

/** Ngày dạng "yyyy-MM-dd" (như Backend trả cho ngày sinh) đổi sang "dd/mm/yyyy"; sai dạng trả null. */
export function formatIsoDate(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match === null) {
    return null;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}
