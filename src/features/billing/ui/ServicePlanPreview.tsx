import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { formatVaultServiceExpiry } from "@/entities/vault/model/vaultServicePresentation";
import { privateActionError, usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { StatusBanner } from "@/shared/ui/status-banner";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import { billingService } from "../api/billingService";
import type { BillingKind, BillingSelection } from "../model/billing.types";
import { billingKeys, useBillingQuote } from "../model/useBilling";
import {
  referenceMoney,
  type ReferencePlanTerm,
  type ReferenceServicePlan,
} from "../model/servicePlanPreview";

export function ServiceTermPicker({
  years,
  onChange,
  showDays = true,
}: {
  years: ReferencePlanTerm["years"];
  onChange: (years: ReferencePlanTerm["years"]) => void;
  showDays?: boolean;
}) {
  return (
    <div className="service-plan-terms" role="group" aria-label="Chọn kỳ dịch vụ">
      {([1, 3, 5] as const).map((value) => (
        <Button
          key={value}
          variant="ghost"
          aria-label={`${value} năm`}
          aria-pressed={value === years}
          onClick={() => onChange(value)}
        >
          <span>{value} năm</span>
          {showDays && <small>{new Intl.NumberFormat("vi-VN").format(value * 365)} ngày</small>}
        </Button>
      ))}
    </div>
  );
}

/**
 * Bước chọn mua một hạng (PURCHASE) hoặc mua thêm suất người nhận (ADDON).
 * Giá, dung lượng và thời hạn lấy từ báo giá của Backend; client chỉ gửi lựa chọn và không tự tính tiền.
 */
export function PurchasePanel({
  plan,
  mode,
  years,
  maxExtraSlots,
  catalog = [],
  defaultExtraSlots = 0,
  onTermChange,
  onClose,
}: {
  plan: ReferenceServicePlan;
  mode: BillingKind;
  years: ReferencePlanTerm["years"];
  maxExtraSlots: number;
  /** Các hạng trả phí để chọn hạng cho kỳ mới khi gia hạn. */
  catalog?: readonly ReferenceServicePlan[];
  /** Số suất thêm đang có của kho, điền sẵn khi gia hạn (người dùng đổi được). */
  defaultExtraSlots?: number;
  onTermChange: (years: ReferencePlanTerm["years"]) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const navigate = useNavigate();
  const client = useQueryClient();
  const action = usePrivateAction();
  const isAddon = mode === "ADDON";
  const isUpgrade = mode === "UPGRADE";
  const isRenewal = mode === "RENEWAL";
  let minExtraSlots = 0;
  let initialSlots = 0;
  if (isAddon) {
    minExtraSlots = 1;
    initialSlots = 1;
  }
  if (isRenewal) {
    initialSlots = Math.min(maxExtraSlots, Math.max(0, defaultExtraSlots));
  }
  const [extraSlots, setExtraSlots] = useState(initialSlots);
  // Gia hạn được chọn hạng cho kỳ mới (cùng hạng hoặc đổi hạng).
  const [renewTier, setRenewTier] = useState(plan.serviceTier);
  let activePlan = plan;
  if (isRenewal) {
    for (const item of catalog) {
      if (item.serviceTier === renewTier) {
        activePlan = item;
      }
    }
  }

  // Mua thêm suất: Backend bỏ qua hạng và số năm, chỉ cần số suất.
  let selection: BillingSelection = {
    tier: plan.serviceTier as "XS" | "XS_MAX",
    years,
    extraSlots,
  };
  if (isAddon) {
    selection = { extraSlots };
  }
  if (isUpgrade) {
    // Nâng hạng: chỉ chọn XS_MAX, không kèm suất; số tiền do Backend tính theo thời gian còn lại.
    selection = { tier: "XS_MAX", extraSlots: 0 };
  }
  if (isRenewal) {
    // Gia hạn: gửi cờ renew để Backend hiểu là gia hạn dù kho còn hạn; số suất là suất thêm của kỳ mới.
    selection = {
      tier: activePlan.serviceTier as "XS" | "XS_MAX",
      years,
      extraSlots,
      renew: true,
    };
  }
  const quote = useBillingQuote(selection, true);

  let slotsLabel = "Suất người nhận mua thêm";
  if (isRenewal) {
    slotsLabel = "Suất người nhận mua thêm cho kỳ mới";
  }
  let createLabel = "Tạo đơn và thanh toán";
  if (action.pending) {
    createLabel = "Đang tạo đơn…";
  }
  let title = `Mua ${plan.name}`;
  let periodHeading = "Kỳ dịch vụ";
  let periodHint = "Kỳ mới bắt đầu từ lúc thanh toán thành công.";
  if (isAddon) {
    title = "Mua thêm suất";
    periodHeading = "Số suất mua thêm";
    periodHint = "Suất mới hết hạn cùng ngày với gói; giá tính theo thời gian còn lại.";
  }
  if (isRenewal) {
    title = `Gia hạn ${activePlan.name}`;
    periodHeading = "Kỳ gia hạn";
    periodHint =
      "Còn hạn thì kỳ mới nối tiếp hạn hiện tại, không mất ngày còn lại. Đã hết hạn thì tính từ lúc thanh toán.";
    createLabel = "Tạo đơn gia hạn";
    if (action.pending) {
      createLabel = "Đang tạo đơn…";
    }
  }
  if (isUpgrade) {
    title = `Nâng lên ${plan.name}`;
    periodHeading = "Nâng hạng giữa kỳ";
    periodHint =
      "Chỉ trả phần chênh theo thời gian còn lại của kỳ hiện tại. Hạn dịch vụ giữ nguyên; dung lượng và số suất tăng ngay.";
    createLabel = "Tạo đơn nâng hạng";
    if (action.pending) {
      createLabel = "Đang tạo đơn…";
    }
  }

  function changeSlots(value: number): void {
    if (!Number.isFinite(value)) return;
    setExtraSlots(Math.min(maxExtraSlots, Math.max(minExtraSlots, Math.trunc(value))));
  }

  function createOrder(): void {
    void action.execute(
      () => billingService.createOrder(selection),
      (order) => {
        client.setQueryData(billingKeys.order(order.id), order);
        void client.invalidateQueries({ queryKey: billingKeys.currentOrder() });
        navigate(`${ROUTES.BILLING.CHECKOUT}?order=${order.id}`);
      },
    );
  }

  let body = <p role="status">Đang báo giá…</p>;
  if (quote.isError) {
    body = (
      <StatusBanner tone="error">
        <p>{privateActionError(quote.error)}</p>
      </StatusBanner>
    );
  } else if (quote.data) {
    const data = quote.data;
    let periodLabel = "Từ lúc thanh toán thành công";
    if (data.kind === "RENEWAL" && data.serviceStartsAt === "AFTER_CURRENT_TERM") {
      periodLabel = "Nối tiếp hạn hiện tại";
      const currentExpiry = formatVaultServiceExpiry(data.serviceExpiresAt);
      if (currentExpiry) {
        periodLabel = `Nối tiếp hạn hiện tại (${currentExpiry})`;
      }
    }
    if (data.kind === "ADDON" || data.kind === "UPGRADE") {
      periodLabel = "Giữ nguyên hạn hiện tại";
      const expiry = formatVaultServiceExpiry(data.serviceExpiresAt);
      if (expiry) {
        periodLabel = `Đến hết ${expiry}`;
      }
    }
    body = (
      <>
        <dl className="service-plan-summary">
          {(data.kind === "PURCHASE" || data.kind === "RENEWAL") && (
            <div>
              <dt>
                {activePlan.name} · {data.years} năm
              </dt>
              <dd>{referenceMoney.format(data.tierAmount)}</dd>
            </div>
          )}
          {data.kind === "UPGRADE" && (
            <div>
              <dt>Phần chênh nâng lên {plan.name}</dt>
              <dd>{referenceMoney.format(data.tierAmount)}</dd>
            </div>
          )}
          {data.kind !== "UPGRADE" && (
            <div>
              <dt>Suất người nhận mua thêm · {data.extraSlots} suất</dt>
              <dd>{referenceMoney.format(data.slotAmount)}</dd>
            </div>
          )}
          <div>
            <dt>Thời hạn dịch vụ</dt>
            <dd>{periodLabel}</dd>
          </div>
          <div>
            <dt>Dung lượng · Người nhận</dt>
            <dd>
              {formatStorageMegabytes(data.storageQuotaBytes)} · {data.beneficiarySlots} người
            </dd>
          </div>
        </dl>
        <div className="service-plan-total">
          <span>Tổng thanh toán</span>
          <strong>{referenceMoney.format(data.totalAmount)}</strong>
        </div>
        <p className="service-plan-fineprint">{data.notice}</p>
      </>
    );
  }

  return (
    <section
      className="service-plan-preview"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="service-plan-preview-heading">
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="outline"
          size="icon"
          aria-label="Đóng khung mua"
          onClick={onClose}
          autoFocus
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <div className="service-plan-renewal-period">
        <div>
          <h3>{periodHeading}</h3>
          <p>{periodHint}</p>
        </div>
        {!isAddon && !isUpgrade && (
          <ServiceTermPicker years={years} onChange={onTermChange} showDays={false} />
        )}
      </div>
      {isRenewal && catalog.length > 0 && (
        <div className="service-plan-terms" role="group" aria-label="Chọn hạng cho kỳ mới">
          {catalog.map((item) => (
            <Button
              key={item.serviceTier}
              variant="ghost"
              aria-pressed={item.serviceTier === renewTier}
              onClick={() => setRenewTier(item.serviceTier)}
            >
              <span>{item.name}</span>
            </Button>
          ))}
        </div>
      )}
      {!isUpgrade && (
        <label className="service-plan-slots">
          <span>
            {slotsLabel} (tối đa {maxExtraSlots})
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={minExtraSlots}
            max={maxExtraSlots}
            value={extraSlots}
            onChange={(event) => changeSlots(event.target.valueAsNumber)}
          />
        </label>
      )}
      {body}
      {action.error && (
        <StatusBanner tone="error" className="mt-4">
          <p>{action.error}</p>
        </StatusBanner>
      )}
      <Button
        className="service-plan-button service-plan-primary"
        disabled={!quote.data || action.pending}
        onClick={createOrder}
      >
        {createLabel}
      </Button>
    </section>
  );
}
