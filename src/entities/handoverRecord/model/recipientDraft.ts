import { isoToDisplayDate } from "@/shared/ui/date-input";
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

/** Dòng chi tiết của người nhận do người nộp khai: email, số điện thoại, căn cước, ngày sinh; chỗ không khai thì bỏ. */
export function suggestedDetailLine(person: SuggestedRecipient): string {
  const parts = [person.email, person.phone];
  if (person.citizenId !== "") parts.push(`CCCD ${person.citizenId}`);
  if (person.dateOfBirth !== "") parts.push(`Sinh ${isoToDisplayDate(person.dateOfBirth)}`);
  return parts.filter((text) => text !== "").join(" · ");
}

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

type RecordPerson = HandoverRecord["availableRecipients"][number];

/** Điền sẵn ô sửa từ người đã lưu. */
export function draftFromPerson(person: RecordPerson): RecipientDraft {
  let dateOfBirth = "";
  if (person.dateOfBirth) dateOfBirth = person.dateOfBirth;
  return {
    ...emptyRecipientDraft(),
    fullName: person.fullName,
    citizenId: person.citizenId,
    dateOfBirth,
    email: person.email,
    phone: person.phone,
  };
}

/**
 * Nhắc luật sư khi người đang nhập có vẻ đã nằm trong kho; rỗng khi không có gì đáng ngờ. Khi sửa thì bỏ qua chính người
 * đang sửa (exceptId).
 */
export function draftWarning(record: HandoverRecord, draft: RecipientDraft, exceptId = ""): string {
  const others = record.availableRecipients.filter((person) => person.beneficiaryId !== exceptId);
  const email = normalize(draft.email);
  const sameEmail = others.find((person) => email !== "" && normalize(person.email) === email);
  if (sameEmail) {
    return `Email này đã dùng cho ${sameEmail.fullName} trong danh sách. Nếu là cùng một người, không cần thêm.`;
  }
  const name = normalize(draft.fullName);
  const sameName = others.find((person) => normalize(person.fullName) === name);
  if (name !== "" && sameName) {
    return `Trong danh sách đã có người tên ${sameName.fullName}. Chỉ thêm nếu đây là người khác.`;
  }
  return "";
}

export function draftToRecipient(draft: RecipientDraft): NewRecipient {
  return newRecipientSchema.parse({ ...draft, phone: draft.phone || undefined });
}

/** Lỗi kiểm tại chỗ của một người nhận; trùng căn cước hoặc email với người khác do máy chủ kiểm khi lưu. */
export function recipientDraftError(
  draft: RecipientDraft,
  requireAssets: boolean,
): RecipientDraftErrors {
  const errors: RecipientDraftErrors = {};
  const parsed = newRecipientSchema.safeParse({ ...draft, phone: draft.phone || undefined });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as RecipientField;
      if (!errors[field]) errors[field] = issue.message;
    }
  }
  if (requireAssets && draft.assetIds.length === 0) errors.assetIds = "Chọn ít nhất một tài sản.";
  return errors;
}
