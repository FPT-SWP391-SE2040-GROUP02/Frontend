import { describe, expect, it } from "vitest";
import {
  DEFAULT_PERIODS,
  describePlanKey,
  describePlanValue,
  generatePlanCode,
  nextPlanOrder,
  parseCustomPlans,
  parsePeriods,
  perYearHint,
  serializePeriods,
  validateNewPeriod,
} from "../planCatalog";

describe("danh sách kỳ bán", () => {
  it("đọc JSON, sắp tăng dần và coi thiếu cờ on là đang bán", () => {
    expect(parsePeriods('[{"years":5,"on":false},{"years":1},{"years":3,"on":true}]')).toEqual([
      { years: 1, on: true },
      { years: 3, on: true },
      { years: 5, on: false },
    ]);
  });

  it("sai dạng hoặc rỗng thì về kỳ mặc định 1, 3, 5 năm", () => {
    expect(parsePeriods("không phải json")).toEqual(DEFAULT_PERIODS);
    expect(parsePeriods("[]")).toEqual(DEFAULT_PERIODS);
    expect(parsePeriods('[{"years":"1"}]')).toEqual(DEFAULT_PERIODS);
  });

  it("ghi lại theo thứ tự tăng dần", () => {
    expect(
      serializePeriods([
        { years: 7, on: true },
        { years: 1, on: false },
      ]),
    ).toBe('[{"years":1,"on":false},{"years":7,"on":true}]');
  });

  it("kỳ mới phải từ 1 đến 10 năm và không trùng", () => {
    const existing = [{ years: 1, on: true }];
    expect(validateNewPeriod(0, existing)).not.toBe("");
    expect(validateNewPeriod(11, existing)).not.toBe("");
    expect(validateNewPeriod(1.5, existing)).not.toBe("");
    expect(validateNewPeriod(1, existing)).toBe("Kỳ này đã có.");
    expect(validateNewPeriod(2, existing)).toBe("");
  });
});

describe("gợi ý giá theo năm", () => {
  it("tính giá mỗi năm và phần trăm rẻ hơn mua lẻ", () => {
    expect(perYearHint(199000, 499000, 3)).toEqual({ perYear: 166333, savePercent: 16 });
  });

  it("không gợi ý cho kỳ 1 năm hoặc khi thiếu giá", () => {
    expect(perYearHint(199000, 199000, 1)).toBeNull();
    expect(perYearHint(0, 499000, 3)).toBeNull();
    expect(perYearHint(199000, 0, 3)).toBeNull();
  });
});

describe("mô tả thay đổi cấu hình gói", () => {
  it("đặt tên cho khóa giá, mở bán, xóa gói và kỳ bán", () => {
    expect(describePlanKey("Plans.Xs.Price7Y")).toBe("Giá gói XS (7 năm)");
    expect(describePlanKey("Plans.XsMax.On")).toBe("Mở bán gói XS Max");
    expect(describePlanKey("Plans.Xs.Hidden")).toBe("Xóa gói XS");
    expect(describePlanKey("Plans.Periods")).toBe("Danh sách kỳ bán");
    expect(describePlanKey("Security.MaxPinAttempts")).toBeNull();
  });

  it("đọc giá trị kỳ bán và cờ thành chữ dễ hiểu", () => {
    expect(
      describePlanValue("Plans.Periods", '[{"years":1,"on":true},{"years":5,"on":false}]'),
    ).toBe("1 năm, 5 năm (tạm ngừng)");
    expect(describePlanValue("Plans.Xs.On", "false")).toBe("Tạm ngừng");
    expect(describePlanValue("Plans.Xs.Hidden", "true")).toBe("Đã xóa");
    expect(describePlanValue("Plans.Xs.Price1Y", "199000")).toBe("199000");
  });
});

describe("gói Admin tạo thêm", () => {
  it("sinh mã gói từ tên: bỏ dấu, chữ hoa, gạch dưới, không trùng mã gốc hay mã đã có", () => {
    expect(generatePlanCode("Gói Vàng", [])).toBe("GOI_VANG");
    expect(generatePlanCode("Đặc biệt!", [])).toBe("DAC_BIET");
    expect(generatePlanCode("Gold", ["GOLD"])).toBe("GOLD_2");
    expect(generatePlanCode("xs max", [])).not.toBe("XS_MAX");
    expect(generatePlanCode("free", [])).toBe("FREE_2");
  });

  it("tên bắt đầu bằng số hoặc quá ngắn vẫn ra mã hợp lệ", () => {
    expect(generatePlanCode("2026 Plus", [])).toMatch(/^[A-Z][A-Z0-9_]{1,23}$/);
    expect(generatePlanCode("?", [])).toBe("PLAN");
  });

  it("đọc danh sách gói thêm, sắp theo thứ tự; sai dạng thì rỗng", () => {
    expect(
      parseCustomPlans(
        '[{"code":"B","name":"Bê","subtitle":"","order":40},{"code":"A","name":"A","order":30}]',
      ).map((p) => p.code),
    ).toEqual(["A", "B"]);
    expect(parseCustomPlans("không phải json")).toEqual([]);
    expect(parseCustomPlans('[{"code":1}]')).toEqual([]);
  });

  it("gói mới đứng sau gói cuối cùng", () => {
    expect(nextPlanOrder([])).toBe(30);
    expect(nextPlanOrder([{ code: "A", name: "A", subtitle: "", order: 50 }])).toBe(60);
  });

  it("đặt tên cho khóa của gói thêm và danh sách gói", () => {
    expect(describePlanKey("Plans.GOLD.Price7Y")).toBe("Giá gói GOLD (7 năm)");
    expect(describePlanKey("Plans.GOLD.On")).toBe("Mở bán gói GOLD");
    expect(describePlanKey("Plans.GOLD.QuotaMb")).toBe("Dung lượng gói GOLD");
    expect(describePlanKey("Plans.Catalog")).toBe("Danh sách gói");
    expect(describePlanKey("Plans.Addon.SlotPricePerYear")).toBeNull();
    expect(describePlanValue("Plans.GOLD.Hidden", "true")).toBe("Đã xóa");
    expect(describePlanValue("Plans.Catalog", '[{"code":"GOLD","name":"Gold","order":30}]')).toBe(
      "Gold (GOLD)",
    );
  });
});
