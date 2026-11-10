const vietnamParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Ngày, tháng, năm của một mốc giờ theo múi giờ Việt Nam. */
export function vietnamDayOf(instant: string): { day: string; month: string; year: string } {
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) return { day: "…", month: "…", year: "……" };
  const parts = vietnamParts.formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { day: pick("day"), month: pick("month"), year: pick("year") };
}

/** Hôm nay theo giờ Việt Nam dạng yyyy-MM-dd, để chặn ngày ở tương lai. */
export function todayInVietnam(now: Date = new Date()): string {
  const { day, month, year } = vietnamDayOf(now.toISOString());
  return `${year}-${month}-${day}`;
}

/** yyyy-MM-dd thành dd/MM/yyyy bằng cách tách chuỗi để không lệch múi giờ; thiếu hoặc sai thì trả dòng chấm. */
export function formatDocumentDate(value: string | null | undefined): string {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "…/…/……";
}
