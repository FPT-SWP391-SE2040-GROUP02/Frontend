import { describe, it, expect } from "vitest";
import { createPaymentOrderSchema, voucherSchema } from "../billing.schema";

describe("createPaymentOrderSchema validation suite", () => {
  it("should validate a valid payment order request", () => {
    const validPayload = {
      planId: "plan-family",
      billingCycle: "yearly",
      voucherCode: "LEGACY2026",
    };

    const result = createPaymentOrderSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("should validate request without voucher code", () => {
    const validPayload = {
      planId: "plan-lifetime",
      billingCycle: "lifetime",
    };

    const result = createPaymentOrderSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("should reject invalid billing cycle", () => {
    const invalidPayload = {
      planId: "plan-family",
      billingCycle: "daily",
    };

    const result = createPaymentOrderSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it("should reject empty planId", () => {
    const invalidPayload = {
      planId: "",
      billingCycle: "monthly",
    };

    const result = createPaymentOrderSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });
});

describe("voucherSchema validation suite", () => {
  it("should validate correct voucher codes", () => {
    expect(voucherSchema.safeParse({ code: "DISCOUNT50" }).success).toBe(true);
    expect(voucherSchema.safeParse({ code: "VIP-2026" }).success).toBe(true);
  });

  it("should reject vouchers with invalid characters or too short", () => {
    expect(voucherSchema.safeParse({ code: "ab" }).success).toBe(false);
    expect(voucherSchema.safeParse({ code: "DISCOUNT 50" }).success).toBe(false);
  });
});
