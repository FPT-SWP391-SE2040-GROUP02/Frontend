import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newRecipientSchema } from "../handoverRecord.schema";

const base = { fullName: "Nguyễn Văn An", citizenId: "079090001234", email: "an@example.com" };

describe("newRecipientSchema: ngày sinh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 22, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("nhận người đúng 18 tuổi hôm nay và người lớn hơn", () => {
    expect(newRecipientSchema.safeParse({ ...base, dateOfBirth: "2008-11-22" }).success).toBe(true);
    expect(newRecipientSchema.safeParse({ ...base, dateOfBirth: "1990-05-20" }).success).toBe(true);
  });

  it("chặn người chưa đủ 18 tuổi", () => {
    const result = newRecipientSchema.safeParse({ ...base, dateOfBirth: "2008-11-23" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Người nhận phải đủ 18 tuổi.");
  });

  it("chặn ngày sinh ở tương lai", () => {
    const result = newRecipientSchema.safeParse({ ...base, dateOfBirth: "2027-01-01" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Ngày sinh không được ở tương lai.");
  });
});

describe("newRecipientSchema: số điện thoại", () => {
  const person = { ...base, dateOfBirth: "1990-05-20" };

  it("không nhập số vẫn được; nhập đúng số di động Việt Nam thì nhận", () => {
    expect(newRecipientSchema.safeParse(person).success).toBe(true);
    expect(newRecipientSchema.safeParse({ ...person, phone: "" }).success).toBe(true);
    expect(newRecipientSchema.safeParse({ ...person, phone: "090 123-45.67" }).success).toBe(true);
    expect(newRecipientSchema.safeParse({ ...person, phone: "+84901234567" }).success).toBe(true);
  });

  it.each(["3232", "12345", "0212345678", "091234567"])("chặn số sai định dạng %s", (phone) => {
    const result = newRecipientSchema.safeParse({ ...person, phone });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/^Số điện thoại không đúng định dạng/);
    expect(result.error?.issues[0].path[0]).toBe("phone");
  });
});
