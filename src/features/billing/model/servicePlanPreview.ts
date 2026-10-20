import type { VaultResponse } from "@/entities/vault/model/vault.types";

/** Chỉ mô tả bảng tham khảo; không phải DTO báo giá hoặc tạo đơn của Backend. */
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

export type PlanPreviewAction = "none" | "buy" | "renew" | "change-later" | "blocked";
export const EXTRA_SLOT_ANNUAL_PRICE = 49000;
const DAY_MS = 86_400_000;

export const referenceMoney = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** Phép tính thời gian chỉ để xem trước, không xác nhận quyền mua hoặc thời điểm cấp dịch vụ. */
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

export function getReferencePlanAction(
  plan: ReferenceServicePlan,
  vault: VaultResponse,
  now: number,
): PlanPreviewAction {
  if (plan.serviceTier === "FREE") return "none";
  if (!canPreviewBilling(vault)) return "blocked";
  if (vault.serviceTier === "FREE" && vault.serviceStatus === "FREE") return "buy";
  if (!["PAID_ACTIVE", "GRACE_READ_ONLY", "EXPIRED_REVIEW"].includes(vault.serviceStatus))
    return "blocked";
  const expiry = Date.parse(vault.serviceExpiresAt ?? "");
  if (!Number.isFinite(expiry)) return "blocked";
  if (isCurrentPaidService(vault, now) && plan.serviceTier !== vault.serviceTier)
    return "change-later";
  const extraSlots = plan.serviceTier === vault.serviceTier ? vault.extraBeneficiarySlots : 0;
  if (
    vault.storageUsedBytes > plan.storage * 1_048_576 ||
    vault.usedBeneficiarySlots > plan.includedBeneficiarySlots + extraSlots
  )
    return "blocked";
  return plan.serviceTier === vault.serviceTier ? "renew" : "buy";
}

export function getReferenceRenewal(
  plan: ReferenceServicePlan,
  term: ReferencePlanTerm,
  vault: VaultResponse,
  now: number,
) {
  const extraSlots = plan.serviceTier === vault.serviceTier ? vault.extraBeneficiarySlots : 0;
  const extraPrice = extraSlots * EXTRA_SLOT_ANNUAL_PRICE * term.years;
  let startsAt: string | null = null;
  let endsAt: string | null = null;
  if (plan.serviceTier === vault.serviceTier && isCurrentPaidService(vault, now)) {
    const expiry = Date.parse(vault.serviceExpiresAt!);
    startsAt = new Date(expiry).toISOString();
    // Một năm dịch vụ = 365 ngày, không cộng năm lịch vì có năm nhuận.
    const endTimestamp = expiry + term.days * DAY_MS;
    if (Number.isFinite(new Date(endTimestamp).getTime()))
      endsAt = new Date(endTimestamp).toISOString();
  }
  return { extraSlots, extraPrice, total: term.price + extraPrice, startsAt, endsAt };
}

export function getRemainingServiceDays(vault: VaultResponse, now: number): number | null {
  const expiry = Date.parse(vault.serviceExpiresAt ?? "");
  if (!Number.isFinite(expiry)) return null;
  return Math.max(0, Math.ceil((expiry - now) / DAY_MS));
}
