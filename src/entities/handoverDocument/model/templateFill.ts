import { formatDocumentDate, vietnamDayOf } from "./handoverDocument.format";
import type { HandoverDocument } from "./handoverDocument.schema";

const DOTS = "..............................";

/** Giá trị của từng trường {…} trong mẫu; null là phần người nhận chưa khai. */
export type TemplateValues = Record<string, string | null>;

/** Một mẩu của đoạn chữ sau khi tách theo trường: chữ thường hoặc tên trường (không có ngoặc). */
export type TemplatePart = { kind: "text"; value: string } | { kind: "token"; name: string };

/** Tách chữ của một đoạn thành chữ thường và các trường {TÊN}. */
export function splitTemplateText(text: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  const pattern = /\{([A-Za-z_]+)\}/g;
  let last = 0;
  let match = pattern.exec(text);
  while (match !== null) {
    if (match.index > last) parts.push({ kind: "text", value: text.slice(last, match.index) });
    parts.push({ kind: "token", name: match[1] });
    last = match.index + match[0].length;
    match = pattern.exec(text);
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}

/**
 * Giá trị các trường của mẫu từ dữ liệu biên bản. Khớp bộ điền của Backend (QuestPdfDeclinePaperRenderer.BuildValues):
 * Phần 1 chép từ hồ sơ chứng tử đã duyệt, Phần 2 do người nhận khai (chưa khai thì null).
 */
export function buildTemplateValues(document: HandoverDocument): TemplateValues {
  const { owner, recipient } = document;
  const day = vietnamDayOf(recipient.signedAt ?? document.createdAt);
  const death = formatDocumentDate(owner.dateOfDeath);
  const issued = formatDocumentDate(owner.certificateIssuedOn);
  const place = owner.deathRegistrationPlace || "UBND …………………";
  let inheritance = DOTS;
  if (document.containerName) {
    inheritance = `${document.containerName} (gồm ${document.itemCount} mục)`;
  }
  let birthYear: string | null = null;
  if (recipient.birthYear !== null) {
    birthYear = String(recipient.birthYear);
  }
  return {
    NGAY: day.day,
    THANG: day.month,
    NAM: day.year,
    HO_TEN_NGUOI_NHAN: recipient.fullName || null,
    NAM_SINH: birthYear,
    SO_CCCD: recipient.citizenId || recipient.citizenIdLast4 || null,
    HO_TEN_CHU_KHO: owner.fullName || DOTS,
    NGAY_MAT: death,
    NGAY_DANG_KY: issued,
    NOI_DANG_KY: place,
    DI_SAN: inheritance,
    CAU_NGUOI_MAT: `chết ngày ${death} theo giấy chứng tử do ${place} đăng ký khai tử ngày ${issued}.`,
    CAU_BAO_TU_CHOI: document.declineNotice ?? "",
  };
}
