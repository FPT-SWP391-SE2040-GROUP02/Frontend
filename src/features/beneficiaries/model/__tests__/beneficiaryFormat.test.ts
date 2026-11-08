import { describe, expect, it } from "vitest";
import { isValidCitizenIdFormat } from "../beneficiaryFormat";

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
