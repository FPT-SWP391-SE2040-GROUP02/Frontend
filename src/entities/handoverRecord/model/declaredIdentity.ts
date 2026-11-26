import type { SuggestedRecipient } from "./handoverReport.schema";

/** Dòng "Căn cước … · Sinh dd/MM/yyyy" của người nhận do người nộp khai; rỗng khi không khai cả hai. */
export function declaredIdentity(person: SuggestedRecipient): string {
  const parts: string[] = [];
  if (person.citizenId !== "") {
    parts.push(`Căn cước ${person.citizenId}`);
  }
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(person.dateOfBirth);
  if (date !== null) {
    parts.push(`Sinh ${date[3]}/${date[2]}/${date[1]}`);
  }
  return parts.join(" · ");
}
