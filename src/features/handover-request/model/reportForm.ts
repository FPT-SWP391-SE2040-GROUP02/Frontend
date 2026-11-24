import { z } from "zod";
import type { SuggestedRecipient } from "@/entities/handoverRecord";
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
  const emails = new Set<string>();
  for (const person of filledRecipients(draft.recipients)) {
    if (person.fullName === "") {
      errors.recipients = "Mỗi người nhận cần có họ tên.";
    } else if (person.email === "" && person.phone === "") {
      errors.recipients = "Mỗi người nhận cần có email hoặc số điện thoại.";
    } else if (person.email !== "" && !z.string().email().safeParse(person.email).success) {
      errors.recipients = `Email của ${person.fullName} không hợp lệ.`;
    } else if (person.email !== "" && emails.has(person.email.toLowerCase())) {
      errors.recipients = `Email của ${person.fullName} bị trùng.`;
    } else if (person.phone !== "" && !/^\+?\d{9,15}$/.test(person.phone.replace(/[\s.-]/g, ""))) {
      errors.recipients = `Số điện thoại của ${person.fullName} không hợp lệ (9 đến 15 chữ số).`;
    }
    if (person.email !== "") emails.add(person.email.toLowerCase());
  }
  return errors;
}
