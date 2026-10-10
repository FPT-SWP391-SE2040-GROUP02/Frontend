import { describe, expect, it } from "vitest";
import { resetPasswordSchema } from "../resetPassword.schema";

describe("Reset password form validation", () => {
  it("accepts matching passwords satisfying the new password policy", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "Abcdefg!", confirmPassword: "Abcdefg!" }).success,
    ).toBe(true);
  });
  it("rejects a matching password below the minimum", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "Abcdef!", confirmPassword: "Abcdef!" }).success,
    ).toBe(false);
  });
  it("attaches mismatch feedback to the confirmation field", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Abcdefg!",
      confirmPassword: "Different!",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(true);
  });

  it.each(["abcdefgh!", "Abcdefgh", "Abcdefg "])("rejects matching but weak passwords: %s", (password) => {
    expect(resetPasswordSchema.safeParse({ password, confirmPassword: password }).success).toBe(false);
  });

  it("requires password confirmation", () => {
    const result = resetPasswordSchema.safeParse({ password: "Abcdefg!", confirmPassword: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(true);
  });
});
