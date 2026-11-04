import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Minus, ShieldCheck } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import {
  formatVaultServiceExpiry,
  getDisplayedServiceTier,
  getVaultServiceName,
  getVaultServiceStatus,
} from "@/entities/vault/model/vaultServicePresentation";
import { ROUTES } from "@/shared/config/routes.config";
import { Button, buttonVariants } from "@/shared/ui/button";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import {
  canPreviewBilling,
  collectTermYears,
  getReferencePlanAction,
  getRemainingServiceDays,
  isCurrentPaidService,
  referenceMoney,
  type PlanPreviewAction,
  type ReferenceServicePlan,
  type ReferencePlanTerm,
} from "../model/servicePlanPreview";
import { PurchasePanel, ServiceTermPicker } from "./ServicePlanPreview";
import { useCurrentOrder } from "../model/useBilling";
import "./service-plans.css";

interface ServicePlansPanelProps {
  catalog: readonly ReferenceServicePlan[];
  vault?: VaultResponse;
  access: "guest" | "owner" | "unavailable";
  unavailableLabel?: string;
  /** Số suất tối đa mỗi đơn do Backend công bố (GET /billing/plans). */
  maxExtraSlots?: number;
  /** Giá một suất người nhận thêm cho một năm do Backend công bố. */
  slotPricePerYear?: number;
}

/** Dữ liệu kho đổi thì đóng bản xem trước cũ và lấy lại mốc giờ, không đổi cache hay quyền. */
export function ServicePlansPanel(props: ServicePlansPanelProps) {
  const vault = props.vault;
  return (
    <ServicePlansContent
      key={`${props.access}:${vault?.id}:${vault?.etag}:${vault?.serviceStatus}:${vault?.serviceExpiresAt}`}
      {...props}
    />
  );
}

function ServicePlansContent({
  catalog,
  vault,
  access,
  unavailableLabel = "Chưa thể chọn mua gói",
  maxExtraSlots = 20,
  slotPricePerYear,
}: ServicePlansPanelProps) {
  const [pickedYears, setYears] = useState<ReferencePlanTerm["years"]>(1);
  // Kỳ do Admin cấu hình: kỳ đang chọn không còn bán thì lấy kỳ ngắn nhất còn bán.
  const termOptions = collectTermYears(catalog);
  const years = termOptions.includes(pickedYears) ? pickedYears : (termOptions[0] ?? pickedYears);
  const [selectedTier, setSelectedTier] = useState<VaultResponse["serviceTier"] | null>(null);
  const [now, setNow] = useState(Date.now);
  // true = người dùng mở bước gia hạn từ nút ở phần Gói hiện tại (hạng mặc định là hạng hiện tại).
  const [renewing, setRenewing] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const pendingOrder = useCurrentOrder(access === "owner");
  const policyId = useId();
  const expiry = Date.parse(vault?.serviceExpiresAt ?? "");
  useEffect(() => {
    // Theo dõi hạn khi giữ trang mở, không tự chuyển trạng thái quyền dịch vụ ở server.
    let delay = 60_000;
    if (Number.isFinite(expiry) && expiry > now)
      delay = Math.min(delay, Math.max(1, expiry - now + 1));
    const timeout = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timeout);
  }, [expiry, now]);

  let selectedPlan = catalog.find((plan) => plan.serviceTier === selectedTier);
  let selectedAction: PlanPreviewAction = "none";
  if (selectedPlan && vault && access === "owner") {
    selectedAction = getReferencePlanAction(selectedPlan, vault, now, catalog);
    if (renewing && vault.serviceTier !== "FREE" && canPreviewBilling(vault)) {
      selectedAction = "renew";
    }
  }
  if (
    !vault ||
    access !== "owner" ||
    !["buy", "addon", "upgrade", "renew"].includes(selectedAction)
  ) {
    selectedPlan = undefined;
  }
  let selectedMode: "PURCHASE" | "ADDON" | "UPGRADE" | "RENEWAL" = "PURCHASE";
  if (selectedAction === "addon") {
    selectedMode = "ADDON";
  }
  if (selectedAction === "upgrade") {
    selectedMode = "UPGRADE";
  }
  if (selectedAction === "renew") {
    selectedMode = "RENEWAL";
  }
  // Hạng Admin đã tạm ngừng bán không còn để chọn khi gia hạn, kể cả hạng kho đang dùng.
  const planNames = Object.fromEntries(catalog.map((plan) => [plan.serviceTier, plan.name]));
  const paidCatalog = catalog.filter(
    (plan) => plan.serviceTier !== "FREE" && plan.onSale !== false,
  );
  // Hạng kho đang dùng đã bị xóa (không còn trong bảng giá) hoặc đang tạm ngừng thì không gia hạn được.
  const currentPlan = catalog.find((plan) => plan.serviceTier === vault?.serviceTier);
  const currentTierOffSale =
    vault !== undefined &&
    vault.serviceTier !== "FREE" &&
    (currentPlan === undefined || currentPlan.onSale === false);
  const currentPaid = vault && isCurrentPaidService(vault, now);
  const status = vault && getVaultServiceStatus(vault, now);
  const remainingDays = vault && getRemainingServiceDays(vault, now);

  return (
    <div className="service-plans">
      {vault && status && (
        <section className="service-plan-current" aria-label="Gói hiện tại của kho">
          <span className="service-plan-shield">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div className="service-plan-current-title">
            <span>Gói hiện tại</span>
            <strong>
              {getVaultServiceName(getDisplayedServiceTier(vault, now), planNames)}
              {currentPaid && remainingDays !== null ? ` · còn ${remainingDays} ngày` : ""}
            </strong>
            {!currentPaid && <small>{status.label}</small>}
          </div>
          <dl className="service-plan-current-facts">
            <div>
              <dt>Hết hạn</dt>
              <dd>
                {vault.serviceTier === "FREE"
                  ? "Không có kỳ hạn"
                  : (formatVaultServiceExpiry(vault.serviceExpiresAt) ?? "Chưa xác định")}
              </dd>
            </div>
            <div>
              <dt>Dung lượng</dt>
              <dd>
                {formatStorageMegabytes(vault.storageUsedBytes)} /{" "}
                {formatStorageMegabytes(vault.storageQuotaBytes)}
              </dd>
            </div>
            <div>
              <dt>Suất người nhận</dt>
              <dd>
                {vault.usedBeneficiarySlots} / {vault.beneficiarySlots} đã dùng
              </dd>
            </div>
          </dl>
          {access === "owner" &&
            vault.serviceTier !== "FREE" &&
            canPreviewBilling(vault) &&
            !currentTierOffSale && (
              <Button
                className="service-plan-button service-plan-primary"
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setRenewing(true);
                  setSelectedTier(vault.serviceTier);
                }}
              >
                Gia hạn gói
              </Button>
            )}
        </section>
      )}
      <div className="service-plan-catalog-heading">
        <h2>Chọn kỳ hạn</h2>
        <ServiceTermPicker
          years={years}
          onChange={setYears}
          options={termOptions}
          showDays={false}
        />
      </div>
      <section aria-label="Các gói dịch vụ" className="service-plan-grid">
        {catalog
          .filter((plan) => plan.hidden !== true)
          .map((plan) => {
            const isFree = plan.serviceTier === "FREE";
            const current = vault?.serviceTier === plan.serviceTier;
            const term = plan.termPrices.find((value) => value.years === years);
            const action = vault ? getReferencePlanAction(plan, vault, now, catalog) : "blocked";
            let label = `Mua gói ${shortName(plan)}`;
            if (action === "upgrade") label = `Nâng lên ${plan.name.replace("Legacy ", "")}`;
            if (action === "downgrade") label = "Hạ hạng khi gia hạn";
            if (action === "renew") label = `Gia hạn ${plan.name}`;
            if (action === "blocked" && access === "owner") label = "Chưa thể chọn mua gói";
            if (action === "offSale" && access === "owner") label = "Tạm ngừng mở bán";
            if (access === "unavailable") label = unavailableLabel;
            let caption = "Không có kỳ hạn";
            if (!isFree) {
              caption = `cho ${years} năm`;
              if (years > 1) {
                const perYear = referenceMoney.format(Math.round((term?.price ?? 0) / years));
                caption = `${caption} · ${perYear}/năm`;
              }
            }
            return (
              <article
                key={plan.serviceTier}
                className={`service-plan-card${current ? " service-plan-card-current" : ""}`}
              >
                <div className="service-plan-card-heading">
                  <h2>{plan.name}</h2>
                  {current ? (
                    <span className="service-plan-badge">Gói hiện tại</span>
                  ) : (
                    plan.order !== undefined &&
                    plan.order > 10 &&
                    plan.serviceTier !== "FREE" && (
                      <span className="service-plan-badge service-plan-badge-muted">
                        Nhiều người nhận
                      </span>
                    )
                  )}
                </div>
                <p className="service-plan-price">{referenceMoney.format(term?.price ?? 0)}</p>
                <p className="service-plan-price-caption">{caption}</p>
                <dl className="service-plan-quota">
                  <div>
                    <dt>Dung lượng</dt>
                    <dd>{formatStorageMegabytes(plan.storage * 1_048_576)}</dd>
                  </div>
                  <div>
                    <dt>{isFree ? "Người nhận" : "Người nhận kèm gói"}</dt>
                    <dd>{plan.includedBeneficiarySlots} người</dd>
                  </div>
                </dl>
                <ul className="service-plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={feature} className={isFree && index > 0 ? "service-plan-muted" : ""}>
                      {isFree && index > 0 ? (
                        <Minus aria-hidden="true" />
                      ) : (
                        <Check aria-hidden="true" />
                      )}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="service-plan-card-actions">
                  {isFree ? (
                    <p className="service-plan-fineprint">Gói mặc định, không cần mua.</p>
                  ) : (
                    <>
                      {action === "addon" && access === "owner" && (
                        <Button
                          className="service-plan-button service-plan-primary"
                          onClick={(event) => {
                            opener.current = event.currentTarget;
                            setSelectedTier(plan.serviceTier);
                          }}
                        >
                          Mua thêm suất người nhận
                        </Button>
                      )}
                      {action === "upgrade" && access === "owner" && (
                        <Button
                          className="service-plan-button service-plan-primary"
                          onClick={(event) => {
                            opener.current = event.currentTarget;
                            setSelectedTier(plan.serviceTier);
                          }}
                        >
                          {label}
                        </Button>
                      )}
                      {access === "guest" ? (
                        <Link
                          className={`${buttonVariants({ variant: "outline" })} service-plan-button service-plan-primary`}
                          to={ROUTES.AUTH.LOGIN}
                        >{`Mua gói ${shortName(plan)}`}</Link>
                      ) : (
                        action !== "addon" &&
                        action !== "upgrade" && (
                          <Button
                            variant="outline"
                            className={`service-plan-button${(!current && action === "buy") || (current && action === "renew") ? " service-plan-primary" : ""}`}
                            disabled={
                              access !== "owner" || (action !== "buy" && action !== "renew")
                            }
                            onClick={(event) => {
                              opener.current = event.currentTarget;
                              setRenewing(false);
                              setSelectedTier(plan.serviceTier);
                            }}
                          >
                            {label}
                          </Button>
                        )
                      )}
                      {action === "upgrade" && (
                        <p className="service-plan-fineprint">
                          Chỉ trả phần chênh theo thời gian còn lại của kỳ hiện tại.
                        </p>
                      )}
                      {action === "downgrade" && (
                        <p className="service-plan-fineprint">
                          Muốn hạ hạng, chọn ở bước Gia hạn gói.
                        </p>
                      )}
                      {action === "renew" && (
                        <p className="service-plan-fineprint">
                          Gói đã hết hạn; kỳ mới tính từ lúc thanh toán.
                        </p>
                      )}
                      {action === "offSale" && access === "owner" && (
                        <p role="status" className="service-plan-fineprint">
                          Gói này đang tạm ngừng mở bán nên chưa thể mua, gia hạn hay mua thêm suất.
                          Dịch vụ đã trả vẫn dùng đến hết kỳ.
                        </p>
                      )}
                      {action === "blocked" && access === "owner" && (
                        <p className="service-plan-fineprint">
                          Kiểm tra trạng thái kho và hạn dịch vụ trước.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
      </section>
      {pendingOrder.data && access === "owner" && (
        <p role="status" className="service-plan-notice">
          Bạn đang có một đơn chờ thanh toán.{" "}
          <Link
            className="underline"
            to={`${ROUTES.BILLING.CHECKOUT}?order=${pendingOrder.data.id}`}
          >
            Tiếp tục thanh toán
          </Link>
        </p>
      )}
      {selectedPlan && vault && (
        <PurchasePanel
          key={`${vault.id}:${selectedPlan.serviceTier}:${selectedMode}`}
          plan={selectedPlan}
          mode={selectedMode}
          years={years}
          maxExtraSlots={maxExtraSlots}
          slotPricePerYear={slotPricePerYear}
          catalog={paidCatalog}
          defaultExtraSlots={vault.extraBeneficiarySlots}
          lockTier={Boolean(currentPaid)}
          onTermChange={setYears}
          onClose={() => {
            setRenewing(false);
            setSelectedTier(null);
            opener.current?.focus();
          }}
        />
      )}
      <p className="service-plan-intro">
        Giá là tổng cho cả kỳ, đã gồm thuế nếu có. Thanh toán một lần bằng chuyển khoản, không tự
        động trừ tiền. Không hoàn tiền giữa kỳ.
      </p>
      <details className="service-plan-policies">
        <summary>
          Chính sách chi tiết
          <ChevronDown aria-hidden="true" className="size-4" />
        </summary>
        <div className="service-plan-policy-list">
          <section aria-labelledby={policyId}>
            <h3 id={policyId}>Mua thêm suất người nhận</h3>
            <p>
              {(slotPricePerYear ?? 49000).toLocaleString("vi-VN")}đ/suất/năm. Tối đa{" "}
              {maxExtraSlots} suất mỗi đơn, hết hạn cùng ngày với gói. Mua giữa kỳ tính theo thời
              gian còn lại, làm tròn lên đến đồng.
            </p>
          </section>
          <section>
            <h3>Gói Free</h3>
            <p>
              Gói nền mặc định. Chuyển về Free cần đáp ứng điều kiện; không tự động chuyển khi hết
              hạn.
            </p>
          </section>
        </div>
      </details>
    </div>
  );
}

/** Tên ngắn trên nút mua: bỏ tiền tố "Legacy " của hai gói gốc ("Legacy XS Max" thành "XS Max"). */
function shortName(plan: { name: string }): string {
  return plan.name.replace(/^Legacy /, "");
}
