import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, otpSchema } from "../auth.schema";

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

  it("should reject password shorter than 8 chars", () => {
    const invalidData = {
      email: "owner@legacyvault.io",
      password: "123",
    };
    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
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
