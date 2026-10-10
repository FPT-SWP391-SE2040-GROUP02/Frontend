import { describe, expect, it } from "vitest";
import { APP_MESSAGES } from "@/shared/constants";
import { newPasswordSchema } from "../password.schema";

describe("New password policy", () => {
  it.each(["Abcdefg!", "ABCDEFG!", "Đabcdef!", "Abcdefg€"])(
    "accepts %s without requiring extra rules",
    (password) => {
      expect(newPasswordSchema.safeParse(password).success).toBe(true);
    },
  );

  it.each([
    ["", APP_MESSAGES.VALIDATION.REQUIRED("Mật khẩu")],
    ["Abcdef!", APP_MESSAGES.VALIDATION.MIN_LENGTH("Mật khẩu", 8)],
    ["abcdefg!", APP_MESSAGES.VALIDATION.PASSWORD_UPPERCASE],
    ["Abcdefgh", APP_MESSAGES.VALIDATION.PASSWORD_SPECIAL_CHARACTER],
    ["Abcdefg ", APP_MESSAGES.VALIDATION.PASSWORD_SPECIAL_CHARACTER],
    ["Abcdefgé", APP_MESSAGES.VALIDATION.PASSWORD_SPECIAL_CHARACTER],
  ])("rejects %s with the relevant reason", (password, message) => {
    const result = newPasswordSchema.safeParse(password);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.message)).toContain(message);
  });

  it("preserves leading and trailing characters", () => {
    const password = " Abcdefg! ";
    expect(newPasswordSchema.parse(password)).toBe(password);
  });
});
