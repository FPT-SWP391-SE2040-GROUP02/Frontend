import { z } from "zod";
import type { SuggestedRecipient } from "@/entities/handoverRecord";
import { filesError } from "./handoverRequest.schema";

/** Giống Backend: khai tối đa 20 người nhận. */
export const MAX_REPORT_RECIPIENTS = 20;

export interface ReportDraft {
  deceasedFullName: string;
  deceasedCitizenId: string;
  recipients: SuggestedRecipient[];
  deathCertificates: File[];
  wills: File[];
  others: File[];
}

export interface ReportErrors {
  deceasedFullName?: string;
  deceasedCitizenId?: string;
  deathCertificates?: string;
  files?: string;
  recipients?: string;
}

export function isBlankRecipient(person: SuggestedRecipient): boolean {
  return [person.fullName, person.email, person.phone].every((text) => text.trim() === "");
}

/** Các dòng người nhận đã điền; dòng để trống hoàn toàn thì bỏ. */
export function filledRecipients(recipients: SuggestedRecipient[]): SuggestedRecipient[] {
  return recipients
    .filter((person) => !isBlankRecipient(person))
    .map((person) => ({
      fullName: person.fullName.trim(),
      email: person.email.trim(),
      phone: person.phone.trim(),
    }));
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
  if (draft.deathCertificates.length === 0) {
    errors.deathCertificates = "Vui lòng đính kèm giấy chứng tử.";
  } else {
    const fileError = filesError([...draft.deathCertificates, ...draft.wills, ...draft.others]);
    if (fileError !== "") errors.files = fileError;
  }
  for (const person of filledRecipients(draft.recipients)) {
    if (person.fullName === "") {
      errors.recipients = "Mỗi người nhận cần có họ tên.";
    } else if (person.email === "" && person.phone === "") {
      errors.recipients = "Mỗi người nhận cần có email hoặc số điện thoại.";
    } else if (person.email !== "" && !z.string().email().safeParse(person.email).success) {
      errors.recipients = `Email của ${person.fullName} không hợp lệ.`;
    }
  }
  return errors;
}
