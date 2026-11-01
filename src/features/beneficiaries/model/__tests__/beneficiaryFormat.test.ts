import { describe, expect, it } from "vitest";
import { isValidCitizenIdFormat, isVietnamPhone } from "../beneficiaryFormat";

describe("định dạng CCCD", () => {
  it.each(["001090000001", "079200012345", "083206000699", "096399999999"])("nhận %s", (id) => {
    expect(isValidCitizenIdFormat(id)).toBe(true);
  });

  it.each([
    ["179206021795", "mã tỉnh không tồn tại"],
    ["000000001015", "mã tỉnh 000"],
    ["003200012345", "mã tỉnh bị bỏ trống trong danh sách"],
    ["079400012345", "số thứ 4 lớn hơn 3"],
    ["07920001234", "thiếu một chữ số"],
    ["07920001234a", "có chữ cái"],
  ])("chặn %s (%s)", (id) => {
    expect(isValidCitizenIdFormat(id)).toBe(false);
  });
});

describe("định dạng số điện thoại Việt Nam", () => {
  it.each(["0912345678", "0912 345.678", "+84912345678", "0351234567", "02412345678"])(
    "nhận %s",
    (phone) => {
      expect(isVietnamPhone(phone)).toBe(true);
    },
  );

  it.each([
    ["1787712815", "không bắt đầu bằng 0"],
    ["0112345678", "đầu số 01 không còn dùng"],
    ["091234567", "thiếu một chữ số"],
    ["09123456789", "thừa một chữ số"],
    ["+1 202 555 0100", "số nước ngoài"],
  ])("chặn %s (%s)", (phone) => {
    expect(isVietnamPhone(phone)).toBe(false);
  });
});
