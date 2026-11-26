import { z } from "zod";
import {
  latestAdultBirthDate,
  todayText,
  type SuggestedRecipient,
} from "@/entities/handoverRecord";
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

/** Số điện thoại hợp lệ: 9 đến 15 chữ số, có thể bắt đầu bằng +; bỏ khoảng trắng, dấu chấm, gạch ngang trước khi kiểm. */
export function isValidPhone(phone: string): boolean {
  return /^\+?\d{9,15}$/.test(phone.replace(/[\s.-]/g, ""));
}

export function isBlankRecipient(person: SuggestedRecipient): boolean {
  return [person.fullName, person.email, person.phone, person.citizenId, person.dateOfBirth].every(
    (text) => text.trim() === "",
  );
}

/** Các dòng người nhận đã điền; dòng để trống hoàn toàn thì bỏ. */
export function filledRecipients(recipients: SuggestedRecipient[]): SuggestedRecipient[] {
  return recipients
    .filter((person) => !isBlankRecipient(person))
    .map((person) => ({
      fullName: person.fullName.trim(),
      email: person.email.trim(),
      phone: person.phone.trim(),
      citizenId: person.citizenId.replace(/\s/g, ""),
      dateOfBirth: person.dateOfBirth.trim(),
    }));
}

/** Ô của một dòng người nhận; "contact" là lỗi chung khi chưa có cả email lẫn số điện thoại. */
export type RecipientField = "fullName" | "email" | "phone" | "citizenId" | "dateOfBirth";
export type RecipientFieldErrors = Partial<Record<RecipientField | "contact", string>>;

/**
 * Lỗi từng ô của một người nhận, dùng cho cả báo lỗi ngay dưới ô lẫn kiểm lúc nộp. Căn cước và ngày sinh không bắt
 * buộc nhưng đã nhập thì phải đúng. `others` là các dòng khác để bắt trùng email, căn cước.
 */
export function recipientFieldErrors(
  person: SuggestedRecipient,
  others: SuggestedRecipient[] = [],
): RecipientFieldErrors {
  const errors: RecipientFieldErrors = {};
  const name = person.fullName.trim();
  const email = person.email.trim();
  const phone = person.phone.trim();
  const citizenId = person.citizenId.replace(/\s/g, "");
  const dateOfBirth = person.dateOfBirth.trim();
  if (name === "") errors.fullName = "Vui lòng nhập họ tên.";
  if (email !== "" && !z.string().email().safeParse(email).success) {
    errors.email = "Email không hợp lệ.";
  } else if (
    email !== "" &&
    others.some((other) => other.email.trim().toLowerCase() === email.toLowerCase())
  ) {
    errors.email = "Email này đã khai cho người nhận khác.";
  }
  if (phone !== "" && !isValidPhone(phone)) {
    errors.phone = "Số điện thoại gồm 9 đến 15 chữ số, ví dụ 0912345678.";
  }
  if (email === "" && phone === "") errors.contact = "Cần có email hoặc số điện thoại.";
  if (citizenId !== "" && !/^\d{12}$/.test(citizenId)) {
    errors.citizenId = "Số căn cước gồm đúng 12 chữ số.";
  } else if (
    citizenId !== "" &&
    others.some((other) => other.citizenId.replace(/\s/g, "") === citizenId)
  ) {
    errors.citizenId = "Số căn cước này đã khai cho người nhận khác.";
  }
  if (dateOfBirth !== "") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      errors.dateOfBirth = "Ngày sinh chưa đúng, nhập ngày/tháng/năm.";
    } else if (dateOfBirth > todayText()) {
      errors.dateOfBirth = "Ngày sinh không được ở tương lai.";
    } else if (dateOfBirth > latestAdultBirthDate()) {
      errors.dateOfBirth = "Người nhận phải đủ 18 tuổi.";
    }
  }
  return errors;
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
  const people = filledRecipients(draft.recipients);
  for (const [index, person] of people.entries()) {
    const fieldErrors = recipientFieldErrors(
      person,
      people.filter((_, other) => other < index),
    );
    const first =
      fieldErrors.fullName ??
      fieldErrors.contact ??
      fieldErrors.email ??
      fieldErrors.phone ??
      fieldErrors.citizenId ??
      fieldErrors.dateOfBirth;
    if (first !== undefined) {
      errors.recipients = `Người nhận ${index + 1}: ${first}`;
      break;
    }
  }
  return errors;
}
