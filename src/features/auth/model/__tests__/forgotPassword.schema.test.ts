import { describe, expect, it } from "vitest";
import { forgotPasswordSchema } from "../forgotPassword.schema";

describe("forgotPasswordSchema", () => {
  it("từ chối email rỗng", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });

    expect(result.success).toBe(false);
  });

  it("từ chối email sai định dạng", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "invalid-email",
    });

    expect(result.success).toBe(false);
  });

  it("chấp nhận email hợp lệ", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "owner@example.com",
    });

    expect(result.success).toBe(true);
  });
});
