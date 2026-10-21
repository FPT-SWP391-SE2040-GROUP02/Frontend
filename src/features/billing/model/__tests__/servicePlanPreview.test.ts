import { describe, expect, it } from "vitest";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import {
  buildPlanCatalog,
  getReferencePlanAction,
  type ReferenceServicePlan,
} from "../servicePlanPreview";
import type { BillingPlans } from "../billing.types";

const now = Date.parse("2026-10-20T00:00:00Z");
const free: ReferenceServicePlan = {
  serviceTier: "FREE",
  name: "Owner Free",
  storage: 20,
  includedBeneficiarySlots: 0,
  termPrices: [],
  features: [],
};
const xs: ReferenceServicePlan = {
  serviceTier: "XS",
  name: "Legacy XS",
  storage: 200,
  includedBeneficiarySlots: 2,
  termPrices: [{ years: 1, days: 365, price: 199000 }],
  features: [],
};
const xsMax: ReferenceServicePlan = { ...xs, serviceTier: "XS_MAX", name: "Legacy XS Max" };
const paidVault = {
  ...vaultFixture,
  serviceTier: "XS" as const,
  serviceStatus: "PAID_ACTIVE",
  serviceExpiresAt: "2027-04-18T00:00:00Z",
};

describe("hành động trên thẻ gói", () => {
  it("kho Free mua mới một hạng trả phí, gói Free thì không có hành động", () => {
    expect(getReferencePlanAction(xs, vaultFixture, now)).toBe("buy");
    expect(getReferencePlanAction(free, vaultFixture, now)).toBe("none");
  });

  it("kho XS còn hạn: cùng hạng mua thêm suất, lên XS Max là nâng hạng giữa kỳ", () => {
    expect(getReferencePlanAction(xs, paidVault, now)).toBe("addon");
    expect(getReferencePlanAction(xsMax, paidVault, now)).toBe("upgrade");
  });

  it("kho XS Max còn hạn: mua thêm suất ở XS Max, hạ về XS chọn ở bước gia hạn", () => {
    const maxVault = { ...paidVault, serviceTier: "XS_MAX" as const };
    expect(getReferencePlanAction(xsMax, maxVault, now)).toBe("addon");
    expect(getReferencePlanAction(xs, maxVault, now)).toBe("downgrade");
  });

  it("hết hạn hoặc ân hạn thì không nâng hạng, chỉ còn gia hạn", () => {
    const grace = { ...paidVault, serviceStatus: "GRACE_READ_ONLY" };
    expect(getReferencePlanAction(xsMax, grace, now)).toBe("renew");
  });

  it("hết hạn, ân hạn hoặc chờ rà soát thì mọi hạng đều là gia hạn", () => {
    const expired = { ...paidVault, serviceStatus: "GRACE_READ_ONLY" };
    expect(getReferencePlanAction(xs, expired, now)).toBe("renew");
    const review = { ...paidVault, serviceStatus: "EXPIRED_REVIEW" };
    expect(getReferencePlanAction(xsMax, review, now)).toBe("renew");
    const past = { ...paidVault, serviceExpiresAt: "2020-01-01T00:00:00Z" };
    expect(getReferencePlanAction(xs, past, now)).toBe("renew");
  });

  it.each([null, "invalid"])(
    "hạn dịch vụ là %s thì không mua thêm được, chỉ gia hạn",
    (serviceExpiresAt) => {
      expect(getReferencePlanAction(xs, { ...paidVault, serviceExpiresAt }, now)).toBe("renew");
    },
  );

  it.each(["DEATH_CASE_OPEN", "HANDOVER_IN_PROGRESS", "BLOCKED", "CLOSED"])(
    "kế hoạch %s thì chặn mua",
    (planStatus) => {
      expect(getReferencePlanAction(xs, { ...vaultFixture, planStatus }, now)).toBe("blocked");
    },
  );

  it("kho đã đóng thì chặn mua", () => {
    expect(getReferencePlanAction(xs, { ...vaultFixture, status: "CLOSED" }, now)).toBe("blocked");
  });
});

describe("bảng giá lấy từ Backend", () => {
  const plans: BillingPlans = {
    policyVersion: "2026-10",
    currency: "VND",
    tiers: [
      {
        tier: "XS",
        storageQuotaBytes: 209715200,
        includedBeneficiarySlots: 2,
        prices: [
          { years: 1, amount: 199000, serviceDays: 365 },
          { years: 3, amount: 499000, serviceDays: 1095 },
        ],
      },
    ],
    extraSlot: { pricePerYear: 49000, maxPerOrder: 20 },
    notice: "Thanh toán không tự kích hoạt bàn giao.",
  };

  it("ghép gói Free cố định với các hạng trả phí, đổi byte sang MB", () => {
    const catalog = buildPlanCatalog(plans, { XS: ["Tính năng A"] }, { XS: "Legacy XS" }, free);
    expect(catalog.map((plan) => plan.serviceTier)).toEqual(["FREE", "XS"]);
    expect(catalog[1].storage).toBe(200);
    expect(catalog[1].termPrices).toEqual([
      { years: 1, days: 365, price: 199000 },
      { years: 3, days: 1095, price: 499000 },
    ]);
    expect(catalog[1].features).toEqual(["Tính năng A"]);
  });
});
