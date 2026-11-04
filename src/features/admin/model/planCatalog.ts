/** Quy ước khóa cấu hình gói và kỳ bán do Admin chỉnh (khớp Backend: PlanPriceRules). */

export const PERIODS_KEY = "Plans.Periods";
/** Danh sách gói Admin tạo thêm: mảng JSON [{ code, name, subtitle, order }]. */
export const CATALOG_KEY = "Plans.Catalog";
/** Số năm lớn nhất một kỳ bán; Backend từ chối quá mức này. */
export const MAX_PERIOD_YEARS = 10;

/** Đoạn tên gói trong khóa cấu hình: "Xs", "XsMax" hoặc mã gói Admin tạo (ví dụ "GOLD"). */
export type PaidPlanCode = string;

export interface PaidPlanMeta {
  code: PaidPlanCode;
  /** true với hai gói gốc XS và XS Max; false với gói Admin tạo thêm. */
  custom?: boolean;
  name: string;
  subtitle: string;
  /** Giá mặc định theo cấu hình gốc, chỉ để hiển thị khi chưa có dòng trong DB. */
  priceDefaults: Record<number, string>;
  quotaDefault: string;
  slotsDefault: string;
  /** Mô tả tính năng hiển thị khi Admin chưa viết (trùng mặc định ở trang gói của chủ kho). */
  featureDefaults: readonly string[];
}

export const PAID_PLANS: readonly PaidPlanMeta[] = [
  {
    code: "Xs",
    name: "XS",
    subtitle: "Legacy Căn bản",
    priceDefaults: { 1: "199000", 3: "499000", 5: "799000" },
    quotaDefault: "200",
    slotsDefault: "2",
    featureDefaults: ["Thiết lập kế hoạch bàn giao", "Điểm danh và quy trình bàn giao"],
  },
  {
    code: "XsMax",
    name: "XS Max",
    subtitle: "Legacy Cao cấp",
    priceDefaults: { 1: "399000", 3: "999000", 5: "1599000" },
    quotaDefault: "500",
    slotsDefault: "5",
    featureDefaults: ["Các tính năng của Legacy XS"],
  },
];

/** Một gói Admin tạo thêm trong `Plans.Catalog`. */
export interface CustomPlan {
  code: string;
  name: string;
  subtitle: string;
  order: number;
}

/** Thứ tự của hai gói gốc; gói thêm lấy số lớn hơn để đứng sau. */
const LAST_BUILTIN_ORDER = 20;
const ORDER_STEP = 10;
const RESERVED_CODES = ["FREE", "XS", "XS_MAX", "XSMAX", "CUSTOM"];
export const MAX_PLAN_NAME = 40;
/** Tối đa bốn gói đang hiện trên bảng giá, tính cả gói Free (khớp giới hạn của Backend). */
export const MAX_PLANS_TOTAL = 4;

export interface PlanPeriod {
  years: number;
  on: boolean;
}

export const DEFAULT_PERIODS: readonly PlanPeriod[] = [
  { years: 1, on: true },
  { years: 3, on: true },
  { years: 5, on: true },
];

/** Đọc danh sách gói thêm từ JSON; sai dạng thì coi như chưa có gói nào. */
export function parseCustomPlans(raw: string): CustomPlan[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const plans: CustomPlan[] = [];
    for (const item of value) {
      if (typeof item !== "object" || item === null) return [];
      const code: unknown = Reflect.get(item, "code");
      const name: unknown = Reflect.get(item, "name");
      const subtitle: unknown = Reflect.get(item, "subtitle");
      const order: unknown = Reflect.get(item, "order");
      if (typeof code !== "string" || typeof name !== "string") return [];
      plans.push({
        code,
        name,
        subtitle: typeof subtitle === "string" ? subtitle : "",
        order:
          typeof order === "number" ? order : LAST_BUILTIN_ORDER + ORDER_STEP * (plans.length + 1),
      });
    }
    return plans.sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export function serializeCustomPlans(plans: readonly CustomPlan[]): string {
  return JSON.stringify(
    plans.map((p) => ({ code: p.code, name: p.name, subtitle: p.subtitle, order: p.order })),
  );
}

/** Cột gói để vẽ: gói Admin tạo thêm có mặc định dung lượng 100 MiB, 1 suất và chưa có giá. */
export function customPlanMeta(plan: CustomPlan): PaidPlanMeta {
  return {
    code: plan.code,
    custom: true,
    name: plan.name,
    subtitle: plan.subtitle,
    priceDefaults: {},
    quotaDefault: "100",
    slotsDefault: "1",
    featureDefaults: ["Thiết lập kế hoạch bàn giao", "Điểm danh và quy trình bàn giao"],
  };
}

/**
 * Mã gói tự sinh từ tên: chữ hoa không dấu, số và gạch dưới, bắt đầu bằng chữ cái, tối đa 24 ký tự,
 * không trùng mã gốc hay mã đã có (thêm hậu tố _2, _3…).
 */
export function generatePlanCode(name: string, existing: readonly string[]): string {
  let base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!/^[A-Z]/.test(base)) base = `P_${base}`.replace(/_$/, "");
  base = base.slice(0, 20);
  if (base.length < 2) base = "PLAN";
  let code = base;
  let n = 2;
  while (RESERVED_CODES.includes(code) || existing.includes(code)) {
    code = `${base}_${n}`;
    n += 1;
  }
  return code;
}

/** Thứ tự cho gói mới: sau gói đứng cuối hiện có. */
export function nextPlanOrder(customs: readonly CustomPlan[]): number {
  const last = customs.reduce((max, p) => Math.max(max, p.order), LAST_BUILTIN_ORDER);
  return last + ORDER_STEP;
}

/** Kiểm tra tên gói mới; trả lỗi hoặc chuỗi rỗng nếu hợp lệ. */
export function validateNewPlanName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Nhập tên gói.";
  if (trimmed.length > MAX_PLAN_NAME) return `Tên gói tối đa ${MAX_PLAN_NAME} ký tự.`;
  return "";
}

/** Khóa mô tả tính năng của gói Free và của các gói trả phí. */
export const FREE_FEATURES_KEY = "Plans.Free.Features";
export const featuresKey = (code: PaidPlanCode): string => `Plans.${code}.Features`;
export const FREE_FEATURE_DEFAULTS: readonly string[] = [
  "Lưu trữ nội dung cá nhân",
  "Chưa có kế hoạch bàn giao",
];
/** Tối đa tám dòng mô tả mỗi gói, mỗi dòng tối đa 120 ký tự (khớp Backend). */
export const MAX_FEATURE_LINES = 8;
export const MAX_FEATURE_LENGTH = 120;

/** Đọc mô tả từ JSON thành các dòng (giữ dòng trống để gõ được dòng mới); sai dạng thì trả mặc định. */
export function parseFeatureLines(raw: string, defaults: readonly string[]): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every((line) => typeof line === "string")) {
      return [...defaults];
    }
    return value.length > 0 ? (value as string[]) : [...defaults];
  } catch {
    return [...defaults];
  }
}

/** Nội dung ô nhập (mỗi dòng một tính năng) thành JSON lưu trong cài đặt. */
export function serializeFeatureLines(text: string): string {
  return JSON.stringify(text.split(/\r?\n/));
}

/** Kiểm tra mô tả: trả câu lỗi hoặc chuỗi rỗng nếu hợp lệ. */
export function validateFeatureText(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  if (lines.length > MAX_FEATURE_LINES) return `Tối đa ${MAX_FEATURE_LINES} dòng.`;
  if (lines.some((line) => line.length > MAX_FEATURE_LENGTH)) {
    return `Mỗi dòng tối đa ${MAX_FEATURE_LENGTH} ký tự.`;
  }
  return "";
}

export const priceKey = (code: PaidPlanCode, years: number): string =>
  `Plans.${code}.Price${years}Y`;
export const saleKey = (code: PaidPlanCode): string => `Plans.${code}.On`;
export const hiddenKey = (code: PaidPlanCode): string => `Plans.${code}.Hidden`;

/** Đọc danh sách kỳ từ JSON; sai dạng thì dùng kỳ mặc định 1, 3, 5 năm. Kết quả tăng dần theo số năm. */
export function parsePeriods(raw: string): PlanPeriod[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [...DEFAULT_PERIODS];
    const result: PlanPeriod[] = [];
    for (const item of value) {
      if (typeof item !== "object" || item === null) return [...DEFAULT_PERIODS];
      const years: unknown = Reflect.get(item, "years");
      const on: unknown = Reflect.get(item, "on");
      if (typeof years !== "number" || !Number.isInteger(years)) return [...DEFAULT_PERIODS];
      result.push({ years, on: on !== false });
    }
    if (result.length === 0) return [...DEFAULT_PERIODS];
    return result.sort((a, b) => a.years - b.years);
  } catch {
    return [...DEFAULT_PERIODS];
  }
}

export function serializePeriods(periods: readonly PlanPeriod[]): string {
  const sorted = [...periods].sort((a, b) => a.years - b.years);
  return JSON.stringify(sorted.map((p) => ({ years: p.years, on: p.on })));
}

/** Kiểm tra số năm nhập cho kỳ mới; trả lời lỗi hoặc chuỗi rỗng nếu hợp lệ. */
export function validateNewPeriod(years: number, existing: readonly PlanPeriod[]): string {
  if (!Number.isInteger(years) || years < 1 || years > MAX_PERIOD_YEARS) {
    return `Nhập số năm từ 1 đến ${MAX_PERIOD_YEARS}.`;
  }
  if (existing.some((p) => p.years === years)) return "Kỳ này đã có.";
  return "";
}

/** Giá quy ra mỗi năm và phần trăm rẻ hơn so với mua lẻ từng năm; null khi không có đủ dữ liệu. */
export function perYearHint(
  priceOneYear: number,
  price: number,
  years: number,
): { perYear: number; savePercent: number } | null {
  if (years <= 1 || !(price > 0) || !(priceOneYear > 0)) return null;
  const perYear = Math.round(price / years);
  const savePercent = Math.round((1 - price / years / priceOneYear) * 100);
  return { perYear, savePercent: Math.max(0, savePercent) };
}

/** Tên gói hiển thị cho đoạn khóa: hai gói gốc có tên riêng, gói thêm hiện mã gói. */
function planLabel(segment: string): string {
  if (segment === "Xs") return "XS";
  if (segment === "XsMax") return "XS Max";
  return segment;
}

/** Tên dễ đọc của một khóa Plans.* trong danh sách thay đổi; null nếu không phải khóa gói. */
export function describePlanKey(key: string): string | null {
  if (key === PERIODS_KEY) return "Danh sách kỳ bán";
  if (key === CATALOG_KEY) return "Danh sách gói";
  if (key === FREE_FEATURES_KEY) return "Mô tả tính năng gói Free";
  const match =
    /^Plans\.([A-Za-z][A-Za-z0-9_]*)\.(?:Price(\d+)Y|(On|Hidden|QuotaMb|Slots|Features))$/.exec(
      key,
    );
  if (!match || ["Free", "Addon"].includes(match[1])) return null;
  const name = planLabel(match[1]);
  if (match[2]) return `Giá gói ${name} (${match[2]} năm)`;
  if (match[3] === "On") return `Mở bán gói ${name}`;
  if (match[3] === "Hidden") return `Xóa gói ${name}`;
  if (match[3] === "QuotaMb") return `Dung lượng gói ${name}`;
  if (match[3] === "Features") return `Mô tả tính năng gói ${name}`;
  return `Suất người nhận gói ${name}`;
}

/** Giá trị hiển thị trong bảng so sánh thay đổi (kỳ bán đọc từ JSON, cờ true/false thành chữ). */
export function describePlanValue(key: string, value: string): string {
  if (key === PERIODS_KEY) {
    const periods = parsePeriods(value);
    return periods.map((p) => `${p.years} năm${p.on ? "" : " (tạm ngừng)"}`).join(", ");
  }
  if (key === FREE_FEATURES_KEY || /^Plans\.[A-Za-z][A-Za-z0-9_]*\.Features$/.test(key)) {
    return parseFeatureLines(value, [])
      .filter((line) => line.trim() !== "")
      .join(" · ");
  }
  if (key === CATALOG_KEY) {
    const plans = parseCustomPlans(value);
    return plans.length === 0
      ? "Chưa có gói thêm"
      : plans.map((p) => `${p.name} (${p.code})`).join(", ");
  }
  if (/^Plans\.[A-Za-z][A-Za-z0-9_]*\.(On|Hidden)$/.test(key)) {
    if (key.endsWith(".Hidden")) return value === "true" ? "Đã xóa" : "Đang có";
    return value === "true" ? "Đang bán" : "Tạm ngừng";
  }
  return value;
}
