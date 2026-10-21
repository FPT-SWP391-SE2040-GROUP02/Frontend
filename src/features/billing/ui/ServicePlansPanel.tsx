import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, ShieldCheck } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import {
  formatVaultServiceExpiry,
  getVaultServiceName,
  getVaultServiceStatus,
} from "@/entities/vault/model/vaultServicePresentation";
import { ROUTES } from "@/shared/config/routes.config";
import { Button, buttonVariants } from "@/shared/ui/button";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import {
  getReferencePlanAction,
  getRemainingServiceDays,
  isCurrentPaidService,
  referenceMoney,
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
}: ServicePlansPanelProps) {
  const [years, setYears] = useState<ReferencePlanTerm["years"]>(1);
  const [selectedTier, setSelectedTier] = useState<VaultResponse["serviceTier"] | null>(null);
  const [now, setNow] = useState(Date.now);
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
  if (
    !vault ||
    access !== "owner" ||
    (selectedPlan &&
      !["buy", "addon", "upgrade"].includes(getReferencePlanAction(selectedPlan, vault, now)))
  )
    selectedPlan = undefined;
  let selectedMode: "PURCHASE" | "ADDON" | "UPGRADE" = "PURCHASE";
  if (selectedPlan && vault) {
    const selectedAction = getReferencePlanAction(selectedPlan, vault, now);
    if (selectedAction === "addon") {
      selectedMode = "ADDON";
    }
    if (selectedAction === "upgrade") {
      selectedMode = "UPGRADE";
    }
  }
  const currentPaid = vault && isCurrentPaidService(vault, now);
  const status = vault && getVaultServiceStatus(vault, now);
  const remainingDays = vault && getRemainingServiceDays(vault, now);

  return (
    <div className="service-plans">
      <p className="service-plan-intro">
        Giá là tổng cho cả kỳ, đã gồm thuế nếu có. Thanh toán một lần bằng chuyển khoản, không tự
        động trừ tiền.
      </p>
      {vault && status && (
        <section className="service-plan-current" aria-label="Gói hiện tại của kho">
          <span className="service-plan-shield">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div className="service-plan-current-title">
            <span>Gói hiện tại</span>
            <strong>
              {getVaultServiceName(vault.serviceTier)}
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
        </section>
      )}
      <div className="service-plan-catalog-heading">
        <div>
          <h2>Chọn kỳ hạn</h2>
          <p>Kỳ càng dài, giá mỗi năm càng thấp.</p>
        </div>
        <ServiceTermPicker years={years} onChange={setYears} />
      </div>
      <section aria-label="Các gói dịch vụ" className="service-plan-grid">
        {catalog.map((plan) => {
          const isFree = plan.serviceTier === "FREE";
          const current = vault?.serviceTier === plan.serviceTier;
          const term = plan.termPrices.find((value) => value.years === years);
          const action = vault ? getReferencePlanAction(plan, vault, now) : "blocked";
          let label = `Mua gói ${plan.serviceTier === "XS" ? "XS" : "XS Max"}`;
          if (action === "upgrade") label = `Nâng lên ${plan.name.replace("Legacy ", "")}`;
          if (action === "downgrade") label = "Chưa hỗ trợ hạ hạng";
          if (action === "blocked" && access === "owner") label = "Chưa thể chọn mua gói";
          if (access === "unavailable") label = unavailableLabel;
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
                  plan.serviceTier === "XS_MAX" && (
                    <span className="service-plan-badge service-plan-badge-muted">
                      Nhiều người nhận
                    </span>
                  )
                )}
              </div>
              <p className="service-plan-price">{referenceMoney.format(term?.price ?? 0)}</p>
              <p className="service-plan-price-caption">
                {isFree
                  ? "Không có kỳ hạn"
                  : `${years} năm · tương đương ${referenceMoney.format(Math.round((term?.price ?? 0) / years))}/năm`}
              </p>
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
                {!isFree && (
                  <li>
                    <Check aria-hidden="true" />
                    <span>Mua thêm suất người nhận, 49.000 đ/suất/năm</span>
                  </li>
                )}
              </ul>
              <div className="service-plan-card-actions">
                {isFree ? (
                  <p className="service-plan-fineprint">
                    Gói nền mặc định. Chuyển về Free cần đáp ứng điều kiện; không tự động chuyển khi
                    hết hạn.
                  </p>
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
                      >{`Mua gói ${plan.serviceTier === "XS" ? "XS" : "XS Max"}`}</Link>
                    ) : (
                      action !== "addon" &&
                      action !== "upgrade" && (
                        <Button
                          variant="outline"
                          className={`service-plan-button${!current && action === "buy" ? " service-plan-primary" : ""}`}
                          disabled={access !== "owner" || action !== "buy"}
                          onClick={(event) => {
                            opener.current = event.currentTarget;
                            setSelectedTier(plan.serviceTier);
                          }}
                        >
                          {label}
                        </Button>
                      )
                    )}
                    {action === "upgrade" && (
                      <p className="service-plan-fineprint">
                        Chỉ trả phần chênh theo thời gian còn lại của kỳ hiện tại. Hạn dịch vụ giữ
                        nguyên, dung lượng và số suất tăng ngay.
                      </p>
                    )}
                    {action === "downgrade" && (
                      <p className="service-plan-fineprint">
                        Bạn đang có kỳ {getVaultServiceName(vault!.serviceTier)} còn hạn. Hệ thống
                        chưa hỗ trợ hạ hạng giữa kỳ.
                      </p>
                    )}
                    {action === "blocked" && access === "owner" && (
                      <p className="service-plan-fineprint">
                        Cần kiểm tra trạng thái kho, thời hạn dịch vụ và hạn mức trước khi chọn gói.
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
          onTermChange={setYears}
          onClose={() => {
            setSelectedTier(null);
            opener.current?.focus();
          }}
        />
      )}
      <footer className="service-plan-policies">
        <section>
          <h3>1 năm = 365 ngày</h3>
          <p>
            Mua mới tính từ lúc thanh toán thành công. Gia hạn sớm nối tiếp hạn cũ. Thanh toán không
            thay cho điểm danh.
          </p>
        </section>
        <section aria-labelledby={policyId}>
          <h3 id={policyId}>Mua thêm suất người nhận</h3>
          <p>
            49.000đ/suất/năm. Tối đa 20 suất mỗi đơn, hết hạn cùng ngày với gói. Mua giữa kỳ tính
            theo thời gian còn lại, làm tròn lên đến đồng.
          </p>
        </section>
        <section>
          <h3>Dung lượng</h3>
          <p>
            Không giới hạn số tài sản theo hạng. Tổng dung lượng phải nằm trong hạn mức của gói và
            tuân thủ giới hạn kỹ thuật khi tải lên.
          </p>
        </section>
        <section>
          <h3>Không hoàn tiền giữa kỳ</h3>
          <p>
            Người nhận di sản không phải trả phí. Một người ở nhiều gói tài sản chỉ tính một suất.
          </p>
        </section>
      </footer>
      <p className="service-plan-fineprint">
        Giá chính thức do hệ thống báo khi bạn chọn mua. Mua gói mới cần Chủ kho đã xác minh eKYC.
        Chưa hỗ trợ gia hạn gói đã hết hạn.
      </p>
    </div>
  );
}
