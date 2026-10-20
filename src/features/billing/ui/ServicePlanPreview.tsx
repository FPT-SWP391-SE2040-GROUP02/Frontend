import { useId, useState } from "react";
import { X } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { formatVaultServiceExpiry } from "@/entities/vault/model/vaultServicePresentation";
import { Button } from "@/shared/ui/button";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import {
  getReferenceRenewal,
  referenceMoney,
  type ReferenceServicePlan,
  type ReferencePlanTerm,
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

/** Khung nội bộ chỉ xem trước; không gọi billingService hoặc ghi dữ liệu thanh toán. */
export function ServicePlanPreview({
  plan,
  term,
  vault,
  now,
  onTermChange,
  onClose,
}: {
  plan: ReferenceServicePlan;
  term: ReferencePlanTerm;
  vault: VaultResponse;
  now: number;
  onTermChange: (years: ReferencePlanTerm["years"]) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [unavailable, setUnavailable] = useState(false);
  const renewal = getReferenceRenewal(plan, term, vault, now);
  const isRenewal = vault.serviceTier === plan.serviceTier;
  const title = `${isRenewal ? "Gia hạn" : "Mua"} ${plan.name}`;
  // Focus ở nút đóng khi mở khung; đây là section nội tuyến, không khóa focus như modal.
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
          aria-label="Đóng xem trước"
          onClick={onClose}
          autoFocus
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <div className="service-plan-renewal-period">
        <div>
          <h3>Kỳ {isRenewal ? "gia hạn" : "dịch vụ"}</h3>
          <p>
            {renewal.startsAt
              ? `Kỳ mới nối tiếp hạn cũ (${formatVaultServiceExpiry(renewal.startsAt)}), không mất ngày còn lại.`
              : "Kỳ mới bắt đầu từ lúc thanh toán thành công; hệ thống xác nhận khi tạo đơn."}
          </p>
        </div>
        <ServiceTermPicker years={term.years} onChange={onTermChange} showDays={false} />
      </div>
      <dl className="service-plan-summary">
        <div>
          <dt>
            {plan.name} · {term.years} năm
          </dt>
          <dd>{referenceMoney.format(term.price)}</dd>
        </div>
        <div>
          <dt>Suất mua thêm đang có</dt>
          <dd>
            {renewal.extraSlots} suất{isRenewal ? ", giữ nguyên" : " bổ sung"}
          </dd>
        </div>
        {renewal.extraSlots > 0 && (
          <div>
            <dt>Giá tham khảo suất bổ sung · {term.years} năm</dt>
            <dd>{referenceMoney.format(renewal.extraPrice)}</dd>
          </div>
        )}
        <div>
          <dt>Kỳ mới bắt đầu</dt>
          <dd>{formatVaultServiceExpiry(renewal.startsAt) ?? "Từ lúc thanh toán thành công"}</dd>
        </div>
        <div>
          <dt>Kỳ mới kết thúc</dt>
          <dd>{formatVaultServiceExpiry(renewal.endsAt) ?? "Hệ thống xác nhận khi tạo đơn"}</dd>
        </div>
        <div>
          <dt>Hạng</dt>
          <dd>
            {isRenewal ? "Giữ " : "Chọn "}
            {plan.name}
          </dd>
        </div>
        <div>
          <dt>Dung lượng · Người nhận</dt>
          <dd>
            {formatStorageMegabytes(plan.storage * 1_048_576)} ·{" "}
            {plan.includedBeneficiarySlots + renewal.extraSlots} người
          </dd>
        </div>
      </dl>
      <div className="service-plan-total">
        <span>Tổng thanh toán tham khảo</span>
        <strong>{referenceMoney.format(renewal.total)}</strong>
      </div>
      <p className="service-plan-fineprint">
        Giá và thời hạn chỉ để xem trước, chưa phải báo giá chính thức. Thanh toán không tự kích
        hoạt bàn giao.
      </p>
      <Button
        className="service-plan-button service-plan-primary"
        onClick={() => {
          // Chưa có contract tạo đơn: thông báo rõ, không giả lập QR, đơn hàng hoặc thanh toán thành công.
          setUnavailable(true);
        }}
      >
        Tạo đơn và thanh toán
      </Button>
      {unavailable && (
        <p role="status" className="service-plan-notice">
          Thanh toán chưa khả dụng. Chưa có đơn hàng nào được tạo và quyền của kho không thay đổi.
        </p>
      )}
    </section>
  );
}
