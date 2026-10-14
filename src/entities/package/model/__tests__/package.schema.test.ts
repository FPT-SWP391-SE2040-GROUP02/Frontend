import { describe, expect, it } from "vitest";
import { createPackageSchema } from "../package.schema";
import { PACKAGE_LIMITS } from "../package.types";

describe("createPackageSchema", () => {
  it.each(["", "   "])("từ chối tên rỗng hoặc khoảng trắng: %j", (name) => {
    expect(createPackageSchema.safeParse({ name }).success).toBe(false);
  });

  it("chấp nhận tên tại giới hạn độ dài", () => {
    const result = createPackageSchema.safeParse({
      name: "a".repeat(PACKAGE_LIMITS.NAME_MAX_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("từ chối tên vượt giới hạn", () => {
    const result = createPackageSchema.safeParse({
      name: "a".repeat(PACKAGE_LIMITS.NAME_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it.each([undefined, null, ""])("chấp nhận mô tả không có nội dung: %j", (description) => {
    const result = createPackageSchema.safeParse({
      name: "Tài liệu gia đình",
      description,
    });

    expect(result.success).toBe(true);
  });

  it("chấp nhận mô tả tại giới hạn độ dài", () => {
    const result = createPackageSchema.safeParse({
      name: "Tài liệu gia đình",
      description: "a".repeat(PACKAGE_LIMITS.DESCRIPTION_MAX_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("từ chối mô tả vượt giới hạn", () => {
    const result = createPackageSchema.safeParse({
      name: "Tài liệu gia đình",
      description: "a".repeat(PACKAGE_LIMITS.DESCRIPTION_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});
