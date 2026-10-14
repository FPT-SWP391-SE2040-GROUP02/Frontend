import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, otpSchema, linkGoogleSchema } from "../auth.schema";
import { APP_MESSAGES } from "@/shared/constants";

describe("Module 0: Auth Zod Schemas Validation", () => {
  it("should validate a valid login payload", () => {
    const validData = {
      email: "owner@legacyvault.io",
      password: "ValidPassphrase2026!",
      rememberMe: true,
    };
    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject an invalid email for login", () => {
    const invalidData = {
      email: "not-an-email",
      password: "ValidPassphrase2026!",
    };
    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("allows the server to verify an existing password without applying creation policy", () => {
    const invalidData = {
      email: "owner@legacyvault.io",
      password: "123",
    };
    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(true);
    expect(linkGoogleSchema.safeParse({ password: "123" }).success).toBe(true);
  });

  it("requires an existing password for login and Google linking", () => {
    expect(loginSchema.safeParse({ email: "owner@example.test", password: "" }).success).toBe(
      false,
    );
    expect(linkGoogleSchema.safeParse({ password: "" }).success).toBe(false);
  });

  it("does not trim an existing password", () => {
    const password = " old password ";
    expect(loginSchema.parse({ email: "owner@example.test", password }).password).toBe(password);
    expect(linkGoogleSchema.parse({ password }).password).toBe(password);
  });

  it("should validate matching password in register schema", () => {
    const validRegister = {
      fullName: "Alexander Hayes",
      email: "alexander.h@legacyvault.io",
      password: "SecurePassphrase2026!",
      confirmPassword: "SecurePassphrase2026!",
    };
    const result = registerSchema.safeParse(validRegister);
    expect(result.success).toBe(true);
  });

  it("should reject mismatched password in register schema", () => {
    const mismatchRegister = {
      fullName: "Alexander Hayes",
      email: "alexander.h@legacyvault.io",
      password: "SecurePassphrase2026!",
      confirmPassword: "DifferentPassword123!",
    };
    const result = registerSchema.safeParse(mismatchRegister);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["confirmPassword"],
            message: APP_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
          }),
        ]),
      );
  });

  it.each(["abcdefg!", "Abcdefgh", "Abcdef!", "Abcdefg "])(
    "rejects a new weak password on register: %s",
    (password) => {
      expect(
        registerSchema.safeParse({
          fullName: "Test Owner",
          email: "owner@example.test",
          password,
          confirmPassword: password,
        }).success,
      ).toBe(false);
    },
  );

  it("rejects a whitespace-only name and trims a valid display name", () => {
    const payload = {
      fullName: "   ",
      email: "owner@example.test",
      password: "Abcdefg!",
      confirmPassword: "Abcdefg!",
    };
    expect(registerSchema.safeParse(payload).success).toBe(false);
    expect(registerSchema.parse({ ...payload, fullName: " Test Owner " }).fullName).toBe(
      "Test Owner",
    );
  });

  it("should validate 6-digit numeric OTP code", () => {
    const validOtp = { otpCode: "123456" };
    expect(otpSchema.safeParse(validOtp).success).toBe(true);

    const invalidOtpLength = { otpCode: "12345" };
    expect(otpSchema.safeParse(invalidOtpLength).success).toBe(false);

    const invalidOtpAlpha = { otpCode: "12345A" };
    expect(otpSchema.safeParse(invalidOtpAlpha).success).toBe(false);
  });
});
