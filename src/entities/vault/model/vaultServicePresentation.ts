import type { VaultResponse } from "./vault.types";

/** Thông tin hiển thị quyền dịch vụ; không thay thế kiểm tra quyền ở Backend. */
export type VaultServiceData = Pick<
  VaultResponse,
  | "id"
  | "serviceTier"
  | "serviceStatus"
  | "serviceExpiresAt"
  | "storageQuotaBytes"
  | "beneficiarySlots"
>;

export function getVaultServiceName(tier: VaultResponse["serviceTier"]): string {
  const names = { FREE: "Free", XS: "Legacy XS", XS_MAX: "Legacy XS Max" };
  return names[tier];
}

/** Ngày hết hạn chỉ phục vụ nhãn hiển thị; canActivate vẫn do server quyết định. */
export function getVaultServiceStatus(service: VaultServiceData, now = Date.now()) {
  if (service.serviceStatus === "FREE") {
    return { label: "Miễn phí", tone: "neutral" } as const;
  }
  if (service.serviceStatus === "GRACE_READ_ONLY") {
    return { label: "Đang ân hạn · Chỉ đọc", tone: "warning" } as const;
  }
  if (service.serviceStatus === "EXPIRED_REVIEW") {
    return { label: "Hết hạn · Chờ rà soát", tone: "warning" } as const;
  }
  if (service.serviceStatus === "PAID_ACTIVE") {
    const expiresAt = Date.parse(service.serviceExpiresAt ?? "");
    if (!Number.isFinite(expiresAt)) {
      return { label: "Chưa xác định thời hạn", tone: "neutral" } as const;
    }
    if (expiresAt <= now) {
      return { label: "Đã hết hạn dịch vụ", tone: "warning" } as const;
    }
    return { label: "Đang hiệu lực", tone: "positive" } as const;
  }
  return { label: "Chưa xác định trạng thái", tone: "neutral" } as const;
}

export function formatVaultServiceExpiry(value: string | null): string | null {
  if (value === null) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(timestamp);
}
