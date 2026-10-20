import { describe, expect, it } from "vitest";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import {
  getReferencePlanAction,
  getReferenceRenewal,
  type ReferenceServicePlan,
} from "../servicePlanPreview";

const now = Date.parse("2026-10-20T00:00:00Z");
const xs: ReferenceServicePlan = {
  serviceTier: "XS",
  name: "Legacy XS",
  storage: 200,
  includedBeneficiarySlots: 2,
  termPrices: [
    { years: 1, days: 365, price: 199000 },
    { years: 3, days: 1095, price: 499000 },
  ],
  features: [],
};
const paidVault = {
  ...vaultFixture,
  serviceTier: "XS" as const,
  serviceStatus: "PAID_ACTIVE",
  serviceExpiresAt: "2027-04-18T00:00:00Z",
  extraBeneficiarySlots: 1,
};

describe("reference service preview", () => {
  it("extends by exactly 365 days across a leap year", () => {
    const result = getReferenceRenewal(xs, xs.termPrices[0], paidVault, now);
    expect(result.startsAt).toBe("2027-04-18T00:00:00.000Z");
    expect(result.endsAt).toBe("2028-04-17T00:00:00.000Z");
  });

  it("retains current add-on slots and includes their full renewal term", () => {
    const result = getReferenceRenewal(xs, xs.termPrices[1], paidVault, now);
    expect(result.extraSlots).toBe(1);
    expect(result.extraPrice).toBe(147000);
    expect(result.total).toBe(646000);
  });

  it("does not fabricate start or end dates for late renewals", () => {
    const result = getReferenceRenewal(
      xs,
      xs.termPrices[0],
      { ...paidVault, serviceExpiresAt: "2020-01-01T00:00:00Z", serviceStatus: "GRACE_READ_ONLY" },
      now,
    );
    expect(result.startsAt).toBeNull();
    expect(result.endsAt).toBeNull();
  });

  it.each([null, "invalid"])("blocks a paid preview when expiry is %s", (serviceExpiresAt) => {
    expect(getReferencePlanAction(xs, { ...paidVault, serviceExpiresAt }, now)).toBe("blocked");
  });

  it("blocks buying a smaller late-renewal plan that cannot contain current usage", () => {
    const vault = {
      ...paidVault,
      serviceTier: "XS_MAX" as const,
      serviceStatus: "EXPIRED_REVIEW",
      serviceExpiresAt: "2020-01-01T00:00:00Z",
      usedBeneficiarySlots: 3,
    };
    expect(getReferencePlanAction(xs, vault, now)).toBe("blocked");
  });
});
