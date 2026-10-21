import type { VaultResponse } from "@/entities/vault/model/vault.types";
import type { BillingPlans } from "./billing.types";

/** Một dòng trong bảng giá hiển thị; Owner lấy từ GET /billing/plans, khách chỉ xem bảng tham khảo. */
export interface ReferencePlanTerm {
  readonly years: 1 | 3 | 5;
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
}

/**
 * Hành động của một thẻ gói với kho hiện tại:
 * - buy: kho Free mua mới;
 * - addon: kho đã trả phí còn hạn, mua thêm suất người nhận (cùng hạng);
 * - upgrade: kho đang XS còn hạn, nâng lên XS Max giữa kỳ (trả phần chênh theo thời gian còn lại, giữ nguyên hạn);
 * - downgrade: đang có kỳ hạng cao hơn, chưa hỗ trợ hạ hạng giữa kỳ;
 * - blocked: chưa mua được (kho đóng, kế hoạch khóa, hết hạn cần gia hạn mà hệ thống chưa hỗ trợ...).
 */
export type PlanPreviewAction = "none" | "buy" | "addon" | "upgrade" | "downgrade" | "blocked";
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
): PlanPreviewAction {
  if (plan.serviceTier === "FREE") return "none";
  if (!canPreviewBilling(vault)) return "blocked";
  if (vault.serviceTier === "FREE" && vault.serviceStatus === "FREE") return "buy";
  if (!isCurrentPaidService(vault, now)) return "blocked";
  if (plan.serviceTier !== vault.serviceTier) {
    if (vault.serviceTier === "XS" && plan.serviceTier === "XS_MAX") return "upgrade";
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
  const catalog: ReferenceServicePlan[] = [free];
  for (const tier of plans.tiers) {
    const termPrices: ReferencePlanTerm[] = [];
    for (const price of tier.prices) {
      termPrices.push({ years: price.years, days: price.serviceDays, price: price.amount });
    }
    catalog.push({
      serviceTier: tier.tier,
      name: names[tier.tier] ?? tier.tier,
      termPrices,
      includedBeneficiarySlots: tier.includedBeneficiarySlots,
      storage: Math.round(tier.storageQuotaBytes / BYTES_PER_MB),
      features: features[tier.tier] ?? [],
    });
  }
  return catalog;
}

export function getRemainingServiceDays(vault: VaultResponse, now: number): number | null {
  const expiry = Date.parse(vault.serviceExpiresAt ?? "");
  if (!Number.isFinite(expiry)) return null;
  return Math.max(0, Math.ceil((expiry - now) / DAY_MS));
}
