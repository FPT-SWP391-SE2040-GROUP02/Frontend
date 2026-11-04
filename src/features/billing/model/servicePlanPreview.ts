import type { VaultResponse } from "@/entities/vault/model/vault.types";
import type { BillingPlans } from "./billing.types";

/** Một dòng trong bảng giá hiển thị; Owner lấy từ GET /billing/plans, khách chỉ xem bảng tham khảo. */
export interface ReferencePlanTerm {
  readonly years: number;
  readonly days: number;
  readonly price: number;
}

export interface ReferenceServicePlan {
  readonly serviceTier: VaultResponse["serviceTier"];
  readonly name: string;
  readonly termPrices: readonly ReferencePlanTerm[];
  readonly includedBeneficiarySlots: number;
  readonly storage: number;
  readonly features: readonly string[];
  /** false = Admin đã tạm ngừng mở bán hạng này (GET /billing/plans); thiếu thì coi là đang bán. */
  readonly onSale?: boolean;
  /** Thứ tự gói tăng dần (gói đứng sau cao hơn khi nâng hạng); thiếu thì suy từ mã gói gốc. */
  readonly order?: number;
  /** true = Admin đã xóa gói: không vẽ thẻ, chỉ giữ để biết thứ tự của gói kho đang dùng. */
  readonly hidden?: boolean;
  readonly subtitle?: string;
}

/** Thứ tự mặc định của các gói gốc khi bảng giá không gửi `order` (bảng tham khảo cho khách, Backend cũ). */
const DEFAULT_ORDER: Readonly<Record<string, number>> = { FREE: 0, XS: 10, XS_MAX: 20 };

/** Thứ tự của một mã gói trong danh mục; không biết thì coi là thấp nhất để không tự cho là nâng hạng. */
export function planOrder(code: string, catalog: readonly ReferenceServicePlan[] = []): number {
  const found = catalog.find((plan) => plan.serviceTier === code);
  return found?.order ?? DEFAULT_ORDER[code] ?? 0;
}

/**
 * Hành động của một thẻ gói với kho hiện tại:
 * - buy: kho Free mua mới;
 * - addon: kho đã trả phí còn hạn, mua thêm suất người nhận (cùng hạng);
 * - upgrade: kho đang dùng gói còn hạn, nâng lên gói đứng sau giữa kỳ (trả phần chênh theo thời gian còn lại, giữ nguyên hạn);
 * - downgrade: đang có kỳ hạng cao hơn; muốn hạ hạng thì chọn ở bước gia hạn;
 * - renew: kho đã hết hạn, đang ân hạn hoặc chờ rà soát: gia hạn (chọn hạng cho kỳ mới);
 * - blocked: chưa mua được (kho đóng, kế hoạch khóa, hết hạn cần gia hạn mà hệ thống chưa hỗ trợ...);
 * - offSale: Admin đã tạm ngừng mở bán hạng này, không tạo đơn mới (mua mới, nâng hạng, gia hạn, mua thêm suất), kể cả người đang dùng.
 */
export type PlanPreviewAction =
  "none" | "buy" | "addon" | "upgrade" | "downgrade" | "renew" | "blocked" | "offSale";
const DAY_MS = 86_400_000;
const BYTES_PER_MB = 1_048_576;

export const referenceMoney = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** Phép tính thời gian chỉ để hiển thị, không xác nhận quyền mua hoặc thời điểm cấp dịch vụ. */
export function isCurrentPaidService(vault: VaultResponse, now: number): boolean {
  return (
    vault.serviceTier !== "FREE" &&
    vault.serviceStatus === "PAID_ACTIVE" &&
    Date.parse(vault.serviceExpiresAt ?? "") > now
  );
}

export function canPreviewBilling(vault: VaultResponse): boolean {
  return (
    vault.status !== "CLOSED" &&
    !["DEATH_CASE_OPEN", "HANDOVER_IN_PROGRESS", "BLOCKED", "CLOSED"].includes(vault.planStatus)
  );
}

/** Quyết định nút trên thẻ; Backend vẫn là nơi kiểm tra cuối cùng khi báo giá và tạo đơn. */
export function getReferencePlanAction(
  plan: ReferenceServicePlan,
  vault: VaultResponse,
  now: number,
  catalog: readonly ReferenceServicePlan[] = [],
): PlanPreviewAction {
  if (plan.serviceTier === "FREE") return "none";
  if (!canPreviewBilling(vault)) return "blocked";
  const action = getPurchaseAction(plan, vault, now, catalog);
  const sells =
    action === "buy" || action === "addon" || action === "upgrade" || action === "renew";
  if (sells && plan.onSale === false) return "offSale";
  return action;
}

function getPurchaseAction(
  plan: ReferenceServicePlan,
  vault: VaultResponse,
  now: number,
  catalog: readonly ReferenceServicePlan[],
): PlanPreviewAction {
  if (vault.serviceTier === "FREE" && vault.serviceStatus === "FREE") return "buy";
  // Hết hạn, ân hạn, chờ rà soát (kể cả đã quá hạn khi chưa có job đổi trạng thái): chỉ còn gia hạn.
  if (!isCurrentPaidService(vault, now)) return "renew";
  if (plan.serviceTier !== vault.serviceTier) {
    // Gói đứng sau gói đang dùng (theo thứ tự) là nâng hạng; gói đứng trước là hạ hạng ở bước gia hạn.
    if (planOrder(plan.serviceTier, catalog) > planOrder(vault.serviceTier, catalog))
      return "upgrade";
    return "downgrade";
  }
  return "addon";
}

/** Gói Free cố định (không bán) ghép với các hạng trả phí lấy từ Backend. */
export function buildPlanCatalog(
  plans: BillingPlans,
  features: Record<string, readonly string[]>,
  names: Record<string, string>,
  free: ReferenceServicePlan,
): ReferenceServicePlan[] {
  const freeLines = (plans.freeFeatures ?? []).filter((line) => line.trim() !== "");
  const freePlan: ReferenceServicePlan = {
    ...free,
    ...(freeLines.length > 0 ? { features: freeLines } : {}),
    // Dung lượng và số suất của Free do Admin cấu hình; chưa có thì giữ số mặc định.
    ...(plans.free
      ? {
          storage: Math.round(plans.free.storageQuotaBytes / BYTES_PER_MB),
          includedBeneficiarySlots: plans.free.includedBeneficiarySlots,
        }
      : {}),
  };
  const catalog: ReferenceServicePlan[] = [freePlan];
  for (const tier of plans.tiers) {
    const termPrices: ReferencePlanTerm[] = [];
    for (const price of tier.prices) {
      termPrices.push({ years: price.years, days: price.serviceDays, price: price.amount });
    }
    catalog.push({
      serviceTier: tier.tier,
      name: tier.name ?? names[tier.tier] ?? tier.tier,
      subtitle: tier.subtitle,
      order: tier.order,
      hidden: tier.hidden === true,
      termPrices,
      includedBeneficiarySlots: tier.includedBeneficiarySlots,
      storage: Math.round(tier.storageQuotaBytes / BYTES_PER_MB),
      // Admin viết mô tả thì dùng, chưa viết thì dùng mô tả mặc định của FE.
      features:
        tier.features && tier.features.length > 0 ? tier.features : (features[tier.tier] ?? []),
      onSale: tier.onSale !== false,
    });
  }
  return catalog;
}

/** Các kỳ (số năm) đang có giá ở ít nhất một hạng, tăng dần; dùng để vẽ nút chọn kỳ. */
export function collectTermYears(catalog: readonly ReferenceServicePlan[]): number[] {
  const years: number[] = [];
  for (const plan of catalog) {
    for (const term of plan.termPrices) {
      if (!years.includes(term.years)) years.push(term.years);
    }
  }
  return years.sort((a, b) => a - b);
}

/**
 * Thời gian còn lại của gói tính tới hạn dịch vụ, để giải thích giá mua thêm suất (49.000đ mỗi suất mỗi năm).
 * Chỉ dùng để hiển thị; số tiền do Backend tính. Trả null khi thiếu mốc thời gian hoặc đã hết hạn.
 */
export function remainingTerm(
  expiresAt: string | null,
  serverTime: string,
): { days: number; years: number } | null {
  const end = Date.parse(expiresAt ?? "");
  const now = Date.parse(serverTime);
  if (!Number.isFinite(end) || !Number.isFinite(now) || end <= now) return null;
  const days = Math.ceil((end - now) / DAY_MS);
  return { days, years: Math.round((days / 365) * 100) / 100 };
}

export function getRemainingServiceDays(vault: VaultResponse, now: number): number | null {
  const expiry = Date.parse(vault.serviceExpiresAt ?? "");
  if (!Number.isFinite(expiry)) return null;
  return Math.max(0, Math.ceil((expiry - now) / DAY_MS));
}
