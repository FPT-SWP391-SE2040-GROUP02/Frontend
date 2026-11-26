import { describe, expect, it } from "vitest";
import { isVietnamesePhone, stripPhoneSeparators } from "../vietnamPhone";

describe("số di động Việt Nam", () => {
  it.each([
    "0912345678",
    "091 234 5678",
    "091.234-5678",
    "(091) 234-5678",
    "+84912345678",
    "0398765432",
  ])("nhận %s", (text) => {
    expect(isVietnamesePhone(text)).toBe(true);
  });

  it.each([
    "",
    "3232",
    "12345",
    "091234567",
    "09123456789",
    "0212345678",
    "0112345678",
    "84912345678",
    "+8401234567",
    "abc0912345678",
    "0912345678x",
  ])("bắt số sai định dạng %s", (text) => {
    expect(isVietnamesePhone(text)).toBe(false);
  });

  it("chỉ bỏ ký tự phân cách", () => {
    expect(stripPhoneSeparators("(028) 3822-1234")).toBe("02838221234");
  });
});
