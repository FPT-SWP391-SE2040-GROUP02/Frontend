import { describe, expect, it } from "vitest";
import { suggestedRecipientSchema } from "../handoverRecord.schema";
import { declaredIdentity } from "../declaredIdentity";

describe("căn cước và ngày sinh do người nộp khai", () => {
  it("hiện cả hai, ngày đổi sang dd/MM/yyyy", () => {
    const person = suggestedRecipientSchema.parse({
      fullName: "Trần Con",
      citizenId: "001099000222",
      dateOfBirth: "1990-02-28",
      email: "",
      phone: "",
    });
    expect(declaredIdentity(person)).toBe("Căn cước 001099000222 · Sinh 28/02/1990");
  });

  it("chỉ hiện phần đã khai; không khai gì thì rỗng", () => {
    const base = { fullName: "Trần Con", email: "a@x.vn", phone: "" };
    expect(
      declaredIdentity(suggestedRecipientSchema.parse({ ...base, citizenId: "001099000222" })),
    ).toBe("Căn cước 001099000222");
    expect(
      declaredIdentity(suggestedRecipientSchema.parse({ ...base, dateOfBirth: "1990-02-28" })),
    ).toBe("Sinh 28/02/1990");
    expect(declaredIdentity(suggestedRecipientSchema.parse(base))).toBe("");
  });
});
