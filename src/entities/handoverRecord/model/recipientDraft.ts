import {
  newRecipientSchema,
  type HandoverRecord,
  type NewRecipient,
} from "./handoverRecord.schema";

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

/** Điền sẵn từ hồ sơ báo tin; bỏ người đã có trong kho và người khai trùng (theo họ tên và email). */
export function draftsFromReports(record: HandoverRecord): RecipientDraft[] {
  const normalize = (text: string) => text.trim().toLowerCase();
  const known = new Set(record.availableRecipients.map((person) => normalize(person.fullName)));
  const seen = new Set<string>();
  const drafts: RecipientDraft[] = [];
  for (const report of record.reports) {
    for (const person of report.recipients) {
      const key = `${normalize(person.fullName)}|${normalize(person.email)}`;
      if (known.has(normalize(person.fullName)) || seen.has(key)) continue;
      seen.add(key);
      drafts.push({ ...emptyRecipientDraft(), ...person });
    }
  }
  return drafts;
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
