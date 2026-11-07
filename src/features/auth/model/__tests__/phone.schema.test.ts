import { describe, expect, it } from "vitest";
import { normalizeVietnamPhone, vietnamPhoneSchema } from "../phone.schema";

describe("Số di động Việt Nam", () => {
  it.each([
    ["0912345678", "0912345678"],
    ["091 234 5678", "0912345678"],
    ["091.234.5678", "0912345678"],
    ["+84912345678", "0912345678"],
    ["84912345678", "0912345678"],
    ["0312345678", "0312345678"],
  ])("nhận %s và chuẩn hóa thành %s", (input, expected) => {
    expect(vietnamPhoneSchema.parse(input)).toBe(expected);
  });

  it.each(["", "091234567", "09123456789", "0212345678", "0612345678", "+1 415 555 0100"])(
    "từ chối %s",
    (input) => {
      expect(vietnamPhoneSchema.safeParse(input).success).toBe(false);
    },
  );

  it("không đổi đầu số khi số bắt đầu bằng 84 nhưng không đủ độ dài", () => {
    expect(normalizeVietnamPhone("8412")).toBe("8412");
  });
});
