import { describe, expect, it } from "vitest";
import { contactPhoneSchema, normalizeContactPhone } from "../phone.schema";

describe("Số điện thoại liên hệ: không kiểm định dạng", () => {
  it.each([
    ["0912345678", "0912345678"],
    ["091 234 5678", "0912345678"],
    ["091.234.5678", "0912345678"],
    ["+84912345678", "+84912345678"],
    ["12345", "12345"],
    ["1912345678", "1912345678"],
  ])("nhận %s và chỉ bỏ ký tự phân cách thành %s", (input, expected) => {
    expect(contactPhoneSchema.parse(input)).toBe(expected);
  });

  it.each(["", "   ", "( - )"])("từ chối số trống %j", (input) => {
    expect(contactPhoneSchema.safeParse(input).success).toBe(false);
  });

  it("từ chối số dài quá 20 ký tự", () => {
    expect(contactPhoneSchema.safeParse("1".repeat(21)).success).toBe(false);
  });

  it("normalizeContactPhone chỉ bỏ ký tự phân cách", () => {
    expect(normalizeContactPhone("(028) 3822-1234")).toBe("02838221234");
  });
});
