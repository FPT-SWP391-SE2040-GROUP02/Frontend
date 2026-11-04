import { describe, expect, it } from "vitest";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import {
  buildPlanCatalog,
  collectTermYears,
  getReferencePlanAction,
  remainingTerm,
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

  it("hạng Admin đã tạm ngừng bán: không mua mới, không mua thêm suất, không nâng lên", () => {
    const xsOff = { ...xs, onSale: false };
    const xsMaxOff = { ...xsMax, onSale: false };
    expect(getReferencePlanAction(xsOff, vaultFixture, now)).toBe("offSale");
    expect(getReferencePlanAction(xsOff, paidVault, now)).toBe("offSale");
    expect(getReferencePlanAction(xsMaxOff, paidVault, now)).toBe("offSale");
  });

  it("hạng đã tắt bán thì không gia hạn được, hạng còn bán không bị ảnh hưởng", () => {
    const expired = { ...paidVault, serviceStatus: "EXPIRED" as const };
    expect(getReferencePlanAction({ ...xs, onSale: false }, expired, now)).toBe("offSale");
    expect(getReferencePlanAction({ ...xs, onSale: true }, expired, now)).toBe("renew");
    expect(getReferencePlanAction({ ...xs, onSale: true }, vaultFixture, now)).toBe("buy");
  });
});

describe("gói Admin tạo thêm trên thẻ gói", () => {
  const gold: ReferenceServicePlan = { ...xsMax, serviceTier: "GOLD", name: "Gold", order: 30 };
  const catalog = [{ ...xs, order: 10 }, { ...xsMax, order: 20 }, gold];

  it("gói đứng sau gói đang dùng (theo thứ tự) là nâng hạng, kể cả gói do Admin tạo", () => {
    expect(getReferencePlanAction(gold, paidVault, now, catalog)).toBe("upgrade");
    const goldVault = { ...paidVault, serviceTier: "GOLD" };
    expect(getReferencePlanAction(xsMax, goldVault, now, catalog)).toBe("downgrade");
    expect(getReferencePlanAction(gold, goldVault, now, catalog)).toBe("addon");
  });

  it("kho Free mua được gói mới; gói mới đang tạm ngừng thì không", () => {
    expect(getReferencePlanAction(gold, vaultFixture, now, catalog)).toBe("buy");
    expect(getReferencePlanAction({ ...gold, onSale: false }, vaultFixture, now, catalog)).toBe(
      "offSale",
    );
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

  it("kỳ bán do Admin cấu hình: gom số năm của mọi hạng, tăng dần, không trùng", () => {
    const withSeven: BillingPlans = {
      ...plans,
      tiers: [
        {
          ...plans.tiers[0],
          prices: [
            { years: 7, amount: 1099000, serviceDays: 2555 },
            { years: 1, amount: 199000, serviceDays: 365 },
          ],
        },
      ],
    };
    expect(collectTermYears(buildPlanCatalog(withSeven, {}, {}, free))).toEqual([1, 7]);
  });

  it("lấy tên, phụ đề, thứ tự và cờ xóa của gói từ Backend", () => {
    const withGold: BillingPlans = {
      ...plans,
      tiers: [
        ...plans.tiers,
        {
          ...plans.tiers[0],
          tier: "GOLD",
          name: "Gold",
          subtitle: "Cao nhất",
          order: 30,
          hidden: true,
        },
      ],
    };
    const gold = buildPlanCatalog(withGold, {}, {}, free)[2];
    expect(gold).toMatchObject({
      serviceTier: "GOLD",
      name: "Gold",
      subtitle: "Cao nhất",
      order: 30,
      hidden: true,
    });
  });

  it("dùng mô tả tính năng do Admin viết, chưa viết thì dùng mô tả mặc định", () => {
    const written: BillingPlans = {
      ...plans,
      freeFeatures: ["Dùng thử"],
      tiers: [{ ...plans.tiers[0], features: ["Dòng của admin"] }],
    };
    const custom = buildPlanCatalog(written, { XS: ["Mặc định"] }, {}, free);
    expect(custom[0].features).toEqual(["Dùng thử"]);
    expect(custom[1].features).toEqual(["Dòng của admin"]);
    const fallback = buildPlanCatalog(plans, { XS: ["Mặc định"] }, {}, free);
    expect(fallback[0].features).toEqual(free.features);
    expect(fallback[1].features).toEqual(["Mặc định"]);
  });

  it("lấy cờ mở bán từ Backend; thiếu cờ thì coi là đang bán", () => {
    const off: BillingPlans = {
      ...plans,
      tiers: [{ ...plans.tiers[0], onSale: false }],
    };
    expect(buildPlanCatalog(off, {}, {}, free)[1].onSale).toBe(false);
    expect(buildPlanCatalog(plans, {}, {}, free)[1].onSale).toBe(true);
  });
});

describe("thời gian còn lại để giải thích giá mua thêm suất", () => {
  it("đổi hạn dịch vụ thành số ngày và số năm", () => {
    expect(remainingTerm("2028-11-02T00:00:00Z", "2026-11-04T00:00:00Z")).toEqual({
      days: 729,
      years: 2,
    });
    expect(remainingTerm("2027-11-04T00:00:00Z", "2026-11-04T00:00:00Z")).toEqual({
      days: 365,
      years: 1,
    });
  });

  it("thiếu mốc thời gian hoặc đã hết hạn thì không hiện", () => {
    expect(remainingTerm(null, "2026-11-04T00:00:00Z")).toBeNull();
    expect(remainingTerm("2026-11-03T00:00:00Z", "2026-11-04T00:00:00Z")).toBeNull();
  });
});
