import { describe, expect, it } from "vitest";
import { emailMatchesMask } from "../invitedEmail";

describe("emailMatchesMask", () => {
  it("khớp email đúng dạng che bớt, không phân biệt hoa thường và khoảng trắng", () => {
    expect(emailMatchesMask("minhxuanh@example.com", "m•••••••h@example.com")).toBe(true);
    expect(emailMatchesMask("  MinhXuanH@Example.com ", "m•••••••h@example.com")).toBe(true);
  });

  it("không khớp khi khác tên miền, độ dài, ký tự đầu hoặc cuối", () => {
    expect(emailMatchesMask("minhxuanh@other.com", "m•••••••h@example.com")).toBe(false);
    expect(emailMatchesMask("minhxuan@example.com", "m•••••••h@example.com")).toBe(false);
    expect(emailMatchesMask("ainhxuanh@example.com", "m•••••••h@example.com")).toBe(false);
    expect(emailMatchesMask("minhxuanx@example.com", "m•••••••h@example.com")).toBe(false);
  });

  it("phần tên 1–2 ký tự: chỉ còn ký tự đầu và ba dấu che", () => {
    expect(emailMatchesMask("ab@example.com", "a•••@example.com")).toBe(true);
    expect(emailMatchesMask("a@example.com", "a•••@example.com")).toBe(true);
    expect(emailMatchesMask("bb@example.com", "a•••@example.com")).toBe(false);
  });

  it("không khớp khi thiếu @", () => {
    expect(emailMatchesMask("khong-co-a", "m•••h@example.com")).toBe(false);
  });
});
