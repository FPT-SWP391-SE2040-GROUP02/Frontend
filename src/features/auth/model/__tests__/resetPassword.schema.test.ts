import { describe, expect, it } from "vitest";
import { resetPasswordSchema } from "../resetPassword.schema";

describe("Reset password form validation", () => {
  it("accepts matching passwords at the existing minimum length", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "12345678", confirmPassword: "12345678" }).success,
    ).toBe(true);
  });
  it("rejects a matching password below the minimum", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "1234567", confirmPassword: "1234567" }).success,
    ).toBe(false);
  });
  it("attaches mismatch feedback to the confirmation field", () => {
    const result = resetPasswordSchema.safeParse({
      password: "example-password",
      confirmPassword: "different-password",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(true);
  });
});
