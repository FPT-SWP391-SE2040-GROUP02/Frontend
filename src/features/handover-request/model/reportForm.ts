import { z } from "zod";
import { newRecipientSchema, type SuggestedRecipient } from "@/entities/handoverRecord";
import { isVietnamesePhone, VIETNAM_PHONE_MESSAGE } from "@/shared/lib/vietnamPhone";
import { filesError } from "./handoverRequest.schema";

/** Giống Backend: khai tối đa 20 người nhận. */
export const MAX_REPORT_RECIPIENTS = 20;

export interface ReportDraft {
  deceasedFullName: string;
  deceasedCitizenId: string;
  attested: boolean;
  recipients: SuggestedRecipient[];
  deathCertificates: File[];
  wills: File[];
  others: File[];
}

export interface ReportErrors {
  deceasedFullName?: string;
  deceasedCitizenId?: string;
  attested?: string;
  deathCertificates?: string;
  wills?: string;
  files?: string;
  recipients?: string;
}

/** Lỗi từng ô của một người nhận; ô không có lỗi thì vắng mặt. */
export type RecipientFieldErrors = Partial<
  Record<"fullName" | "citizenId" | "dateOfBirth" | "email" | "phone", string>
>;

/** Bỏ khoảng trắng như Backend; không bỏ ký tự khác để ô sai vẫn báo sai. */
function compactCitizenId(text: string): string {
  return text.replace(/\s/g, "");
}

export function isBlankRecipient(person: SuggestedRecipient): boolean {
  return [person.fullName, person.citizenId, person.dateOfBirth, person.email, person.phone].every(
    (text) => text.trim() === "",
  );
}

/** Các dòng người nhận đã điền; dòng để trống hoàn toàn thì bỏ. */
export function filledRecipients(recipients: SuggestedRecipient[]): SuggestedRecipient[] {
  return recipients
    .filter((person) => !isBlankRecipient(person))
    .map((person) => ({
      fullName: person.fullName.trim(),
      citizenId: compactCitizenId(person.citizenId),
      dateOfBirth: person.dateOfBirth.trim(),
      email: person.email.trim(),
      phone: person.phone.trim(),
    }));
}

/** Lời báo đầu tiên của newRecipientSchema cho một ô, hoặc rỗng khi ô hợp lệ. */
function firstIssue(schema: z.ZodTypeAny, value: string): string {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return "";
  }
  return parsed.error.issues[0].message;
}

/**
 * Lỗi từng ô của từng dòng người nhận, cùng thứ tự với `recipients`; dòng trống hoàn toàn hoặc hợp lệ cho đối tượng
 * rỗng. Căn cước và ngày sinh không bắt buộc nhưng đã điền thì phải đúng (cùng luật với form của luật sư); cần ít nhất
 * email hoặc số điện thoại.
 */
export function recipientRowErrors(recipients: SuggestedRecipient[]): RecipientFieldErrors[] {
  const emails = new Set<string>();
  const citizenIds = new Set<string>();
  return recipients.map((person) => {
    const errors: RecipientFieldErrors = {};
    if (isBlankRecipient(person)) {
      return errors;
    }
    const email = person.email.trim();
    const phone = person.phone.trim();
    const citizenId = compactCitizenId(person.citizenId);
    const dateOfBirth = person.dateOfBirth.trim();
    if (person.fullName.trim() === "") {
      errors.fullName = "Vui lòng nhập họ tên.";
    }
    if (citizenId !== "") {
      const citizenIssue = firstIssue(newRecipientSchema.shape.citizenId, citizenId);
      if (citizenIssue !== "") {
        errors.citizenId = citizenIssue;
      } else if (citizenIds.has(citizenId)) {
        errors.citizenId = "Số căn cước này đã khai cho người khác.";
      }
      citizenIds.add(citizenId);
    }
    if (dateOfBirth !== "") {
      const birthIssue = firstIssue(newRecipientSchema.shape.dateOfBirth, dateOfBirth);
      if (birthIssue !== "") {
        errors.dateOfBirth = birthIssue;
      }
    }
    if (email === "" && phone === "") {
      errors.email = "Cần có email hoặc số điện thoại.";
    } else if (email !== "" && !z.string().email().safeParse(email).success) {
      errors.email = "Email không hợp lệ.";
    } else if (email !== "" && emails.has(email.toLowerCase())) {
      errors.email = "Email này đã khai cho người khác.";
    }
    if (phone !== "" && !isVietnamesePhone(phone)) {
      errors.phone = VIETNAM_PHONE_MESSAGE;
    }
    if (email !== "") {
      emails.add(email.toLowerCase());
    }
    return errors;
  });
}

/** Lỗi của biểu mẫu; đối tượng rỗng khi hợp lệ. */
export function reportErrors(draft: ReportDraft): ReportErrors {
  const errors: ReportErrors = {};
  if (draft.deceasedFullName.trim() === "") {
    errors.deceasedFullName = "Vui lòng nhập họ tên người mất.";
  }
  if (!/^\d{12}$/.test(draft.deceasedCitizenId.trim())) {
    errors.deceasedCitizenId = "Số căn cước gồm 12 chữ số.";
  }
  if (!draft.attested) {
    errors.attested = "Vui lòng cam đoan giấy tờ là thật.";
  }
  if (draft.deathCertificates.length === 0) {
    errors.deathCertificates = "Vui lòng đính kèm giấy chứng tử.";
  }
  if (draft.wills.length === 0) {
    errors.wills = "Vui lòng đính kèm di chúc.";
  }
  if (!errors.deathCertificates && !errors.wills) {
    const fileError = filesError([...draft.deathCertificates, ...draft.wills, ...draft.others]);
    if (fileError !== "") errors.files = fileError;
  }
  // Lỗi chi tiết hiện ngay dưới từng ô; ở đây chỉ báo chung để người dùng biết còn chỗ phải sửa ở mục này.
  for (const rowErrors of recipientRowErrors(draft.recipients)) {
    if (Object.keys(rowErrors).length > 0) {
      errors.recipients = "Kiểm tra lại thông tin người nhận ở các ô báo đỏ.";
    }
  }
  return errors;
}
