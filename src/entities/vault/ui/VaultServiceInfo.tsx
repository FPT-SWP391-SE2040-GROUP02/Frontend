import { useEffect, useState } from "react";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import type { VaultResponse } from "../model/vault.types";
import {
  formatVaultServiceExpiry,
  getDisplayedServiceTier,
  getVaultServiceName,
  getVaultServiceStatus,
  type VaultServiceData,
} from "../model/vaultServicePresentation";

export function VaultServiceBadge({
  tier,
  sidebar = false,
}: {
  tier: VaultResponse["serviceTier"];
  sidebar?: boolean;
}) {
  let colors = "border-heritage-gold/40 bg-heritage-gold/20 text-heritage-primary";
  if (sidebar) colors = "border-heritage-gold/60 bg-heritage-gold text-[#0b291e]";
  if (tier === "FREE") {
    colors = "border-heritage-border bg-heritage-canvas text-heritage-muted";
    if (sidebar) colors = "border-white/35 bg-transparent text-white/80";
  }
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-5 ${colors}`}
    >
      {getVaultServiceName(tier)}
    </span>
  );
}

interface VaultServiceInfoProps {
  service: VaultServiceData;
  showQuota?: boolean;
}

/** Cùng một bản trình bày cho Dashboard, trang gói dịch vụ và phần thiết lập kế hoạch. */
export function VaultServiceInfo(props: VaultServiceInfoProps) {
  const { service } = props;
  // Lấy mốc giờ mới ngay khi dữ liệu kỳ dịch vụ thay đổi sau refetch.
  return (
    <VaultServiceDetails
      key={`${service.id}:${service.serviceTier}:${service.serviceStatus}:${service.serviceExpiresAt}`}
      {...props}
    />
  );
}

function VaultServiceDetails({ service, showQuota = false }: VaultServiceInfoProps) {
  const [now, setNow] = useState(Date.now);
  const expiryTimestamp = Date.parse(service.serviceExpiresAt ?? "");
  // Cập nhật nhãn khi đến hạn, kể cả khi người dùng giữ trang mở; không tự thay đổi quyền.
  useEffect(() => {
    if (!Number.isFinite(expiryTimestamp) || expiryTimestamp <= now) return;
    const delay = Math.max(0, Math.min(expiryTimestamp - Date.now() + 1, 2_147_483_647));
    const timeout = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timeout);
  }, [expiryTimestamp, now]);

  const status = getVaultServiceStatus(service, now);
  const expiry = formatVaultServiceExpiry(service.serviceExpiresAt);
  const statusColors = {
    positive: "text-green-800",
    warning: "text-amber-800",
    neutral: "text-heritage-muted",
  };
  return (
    <div className="space-y-4" aria-label="Thông tin gói dịch vụ của kho">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <VaultServiceBadge tier={getDisplayedServiceTier(service, now)} />
        <span className={`inline-flex items-center gap-2 text-sm ${statusColors[status.tone]}`}>
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-current" />
          {status.label}
        </span>
        {service.serviceTier === "FREE" ? (
          <span className="text-sm text-heritage-muted">Không có kỳ hết hạn</span>
        ) : (
          expiry && <span className="text-sm text-heritage-muted">Hết hạn {expiry}</span>
        )}
      </div>
      {showQuota && (
        <dl className="grid gap-4 border-t border-heritage-border pt-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-heritage-muted">Dung lượng</dt>
            <dd className="mt-1 text-xl font-semibold text-heritage-primary">
              {formatStorageMegabytes(service.storageQuotaBytes)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-heritage-muted">Suất người nhận</dt>
            <dd className="mt-1 text-xl font-semibold text-heritage-primary">
              {service.beneficiarySlots}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
