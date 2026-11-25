import { isAxiosError } from "axios";
import { z } from "zod";
import {
  newRecipientSchema,
  type HandoverRecord,
  type NewRecipient,
} from "./handoverRecord.schema";
import type { SuggestedRecipient } from "./handoverReport.schema";

export const RECIPIENT_FIELDS = ["fullName", "citizenId", "dateOfBirth", "email", "phone"] as const;
export type RecipientField = (typeof RECIPIENT_FIELDS)[number];

/** Người nhận mới luật sư đang nhập, chưa lưu. */
export type RecipientDraft = Record<RecipientField, string> & { key: string; assetIds: string[] };

export type RecipientDraftErrors = Partial<Record<RecipientField | "assetIds", string>>;

let nextKey = 0;

export function emptyRecipientDraft(): RecipientDraft {
  nextKey += 1;
  return {
    key: `draft-${nextKey}`,
    fullName: "",
    citizenId: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    assetIds: [],
  };
}

const normalize = (text: string) => text.trim().toLowerCase();

/**
 * Người nhận được khai trong các hồ sơ báo tin, bỏ người khai lặp: trùng email; người không khai email thì trùng cả họ
 * tên và số điện thoại.
 */
function declaredPeople(record: HandoverRecord): SuggestedRecipient[] {
  const seen = new Set<string>();
  const people: SuggestedRecipient[] = [];
  for (const report of record.reports) {
    for (const person of report.recipients) {
      let key = normalize(person.email);
      if (key === "") key = `${normalize(person.fullName)}|${normalize(person.phone)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      people.push(person);
    }
  }
  return people;
}

/** Người đã có trong kho mang email này. Email là duy nhất giữa các người nhận nên trùng email là cùng một chỗ. */
function findByEmail(record: HandoverRecord, email: string) {
  const wanted = normalize(email);
  if (wanted === "") return undefined;
  return record.availableRecipients.find((person) => normalize(person.email) === wanted);
}

/** Điền sẵn từ hồ sơ báo tin; bỏ người có email đã nằm trong kho. Trùng họ tên mà khác email vẫn điền sẵn. */
export function draftsFromReports(record: HandoverRecord): RecipientDraft[] {
  return declaredPeople(record)
    .filter((person) => !findByEmail(record, person.email))
    .map((person) => ({ ...emptyRecipientDraft(), ...person }));
}

/** Câu cho luật sư biết người nào trong hồ sơ không được điền sẵn vì email đã có trong kho. */
export function skippedDeclarations(record: HandoverRecord): string[] {
  const result: string[] = [];
  for (const person of declaredPeople(record)) {
    const existing = findByEmail(record, person.email);
    if (!existing) continue;
    if (normalize(existing.fullName) === normalize(person.fullName)) {
      result.push(person.fullName);
    } else {
      result.push(`${person.fullName} (trùng email với ${existing.fullName})`);
    }
  }
  return result;
}

/** Nhắc luật sư khi người đang nhập có vẻ đã nằm trong kho; rỗng khi không có gì đáng ngờ. */
export function draftWarning(record: HandoverRecord, draft: RecipientDraft): string {
  const sameEmail = findByEmail(record, draft.email);
  if (sameEmail) {
    return `Email này đã dùng cho ${sameEmail.fullName} trong kho. Nếu là cùng một người, hãy bỏ ô này.`;
  }
  const name = normalize(draft.fullName);
  const sameName = record.availableRecipients.find((person) => normalize(person.fullName) === name);
  if (name !== "" && sameName) {
    return `Trong kho đã có người tên ${sameName.fullName}. Chỉ giữ ô này nếu đây là người khác.`;
  }
  return "";
}

const serverErrorsSchema = z.object({ errors: z.record(z.string(), z.array(z.string())) });

/**
 * Lỗi máy chủ trả theo khóa recipients[chỉ số].trường được gắn về đúng ô của người nhận đang nhập, theo thứ tự đã gửi.
 * Lỗi khác dạng thì trả đối tượng rỗng.
 */
export function serverDraftErrors(
  failure: unknown,
  drafts: RecipientDraft[],
): Record<string, RecipientDraftErrors> {
  const result: Record<string, RecipientDraftErrors> = {};
  if (!isAxiosError(failure)) return result;
  const parsed = serverErrorsSchema.safeParse(failure.response?.data);
  if (!parsed.success) return result;
  for (const [key, messages] of Object.entries(parsed.data.errors)) {
    const match = /^recipients\[(\d+)\]\.(\w+)$/i.exec(key);
    if (!match || messages.length === 0) continue;
    const draft = drafts[Number(match[1])];
    const name = match[2].charAt(0).toLowerCase() + match[2].slice(1);
    const field = RECIPIENT_FIELDS.find((item) => item === name);
    if (!draft || !field) continue;
    result[draft.key] = {
      ...result[draft.key],
      [field]: messages[0].replace(/^Người nhận mới \d+:\s*/, ""),
    };
  }
  return result;
}

export function draftToRecipient(draft: RecipientDraft): NewRecipient {
  return newRecipientSchema.parse({ ...draft, phone: draft.phone || undefined });
}

/** Lỗi của từng người nhận mới theo khóa; đối tượng rỗng khi mọi người hợp lệ. */
export function recipientDraftErrors(
  drafts: RecipientDraft[],
): Record<string, RecipientDraftErrors> {
  const result: Record<string, RecipientDraftErrors> = {};
  const citizenIds = new Set<string>();
  const emails = new Set<string>();
  for (const draft of drafts) {
    const errors: RecipientDraftErrors = {};
    const parsed = newRecipientSchema.safeParse({ ...draft, phone: draft.phone || undefined });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as RecipientField;
        if (!errors[field]) errors[field] = issue.message;
      }
    }
    const citizenId = draft.citizenId.trim();
    const email = draft.email.trim().toLowerCase();
    if (!errors.citizenId && citizenIds.has(citizenId)) errors.citizenId = "Số căn cước bị trùng.";
    if (!errors.email && emails.has(email)) errors.email = "Email bị trùng.";
    citizenIds.add(citizenId);
    emails.add(email);
    if (draft.assetIds.length === 0) errors.assetIds = "Chọn ít nhất một tài sản.";
    if (Object.keys(errors).length > 0) result[draft.key] = errors;
  }
  return result;
}
