/** Kiểu và cách ghi dùng chung cho các tờ giấy in được. */
export const SECTION = "mt-6";
export const HEADING = "mb-2 font-bold";
export const BODY = "leading-7 text-justify";
export const CELL = "border border-[#333] px-2.5 py-2 align-top";

/** "22 tháng 11 năm 2026" theo giờ Việt Nam; chưa có ngày thì để chỗ trống "… tháng … năm …". */
export function longDate(value: string | null): string {
  if (!value) {
    return "… tháng … năm …";
  }
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(new Date(value));
  let day = "";
  let month = "";
  let year = "";
  for (const part of parts) {
    if (part.type === "day") {
      day = part.value;
    }
    if (part.type === "month") {
      month = part.value;
    }
    if (part.type === "year") {
      year = part.value;
    }
  }
  return `${day} tháng ${month} năm ${year}`;
}

export function orBlank(value: string): string {
  if (value.trim().length === 0) {
    return "…………………………";
  }
  return value;
}
