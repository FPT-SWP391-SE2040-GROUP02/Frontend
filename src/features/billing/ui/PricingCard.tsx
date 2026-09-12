import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import type { PricingPlan } from "../model/billing.types";
import { Button } from "@/shared/ui/button";

/**
 * @description Thuộc tính cấu hình cho PricingCard component.
 */
export interface PricingCardProps {
  /** Thông tin gói dịch vụ */
  plan: PricingPlan;
  /** Chu kỳ đang chọn */
  billingCycle: "monthly" | "yearly" | "lifetime";
  /** Callback khi người dùng chọn mua gói này */
  onSelectPlan: (plan: PricingPlan) => void;
  /** Đang là gói hiện tại của người dùng */
  isCurrentPlan?: boolean;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Thẻ hiển thị gói dịch vụ Két Di Sản chuẩn Master UI Kit (Heritage Forest & Champagne Gold).
 *
 * @param {PricingCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Card bảng giá
 *
 * @example
 * ```tsx
 * <PricingCard plan={familyPlan} billingCycle="yearly" onSelectPlan={handleSelect} />
 * ```
 */
export function PricingCard({
  plan,
  billingCycle,
  onSelectPlan,
  isCurrentPlan = false,
  className = "",
}: PricingCardProps) {
  const formatPrice = (price: number) => {
    if (price === 0) return "Miễn Phí";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const getCycleLabel = () => {
    if (plan.price === 0) return "/ vĩnh viễn";
    switch (billingCycle) {
      case "monthly":
        return "/ tháng";
      case "yearly":
        return "/ năm";
      case "lifetime":
        return "/ trọn đời";
    }
  };

  return (
    <div
      className={`relative rounded-[16px] bg-[var(--surface,#FAF9F5)] p-6 flex flex-col justify-between transition-all duration-200 border ${
        plan.isPopular
          ? "border-[var(--gold,#B88E4C)] shadow-[0_6px_20px_rgba(184,142,76,0.15)] ring-2 ring-[var(--gold,#B88E4C)]/30"
          : "border-[#DDD8CB] dark:border-[#1E432F] shadow-[var(--shadow-raised)]"
      } ${className}`}
    >
      {/* Badge Gói Khuyên Dùng */}
      {plan.isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--gold,#B88E4C)] text-white text-[10.5px] font-bold px-3 py-1 rounded-[20px] shadow-sm flex items-center gap-1 uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>Gói Khuyên Dùng</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Tên & Mô Tả */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              {plan.name}
            </h3>
            {isCurrentPlan && (
              <span className="tag-pill tag-new text-[10px]">Gói hiện tại</span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted,#66786E)] line-clamp-2">
            {plan.description}
          </p>
        </div>

        {/* Giá tiền */}
        <div className="py-2 border-y border-[#EBE7DD] dark:border-[#1A3D2A]">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              {formatPrice(plan.price)}
            </span>
            <span className="text-xs text-[var(--text-muted,#66786E)] font-medium">
              {getCycleLabel()}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-subtle,#8E9F96)] mt-1 flex items-center gap-2">
            <span>Dung lượng: <strong>{plan.storageLimitGb} GB</strong></span>
            <span>·</span>
            <span>Thừa kế: <strong>{plan.maxHeirs === 999 ? "Không giới hạn" : `${plan.maxHeirs} người`}</strong></span>
          </div>
        </div>

        {/* Danh sách quyền lợi */}
        <div className="space-y-2.5 pt-1">
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted,#66786E)] font-bold">
            Quyền lợi bao gồm:
          </div>
          <ul className="space-y-2">
            {plan.features.map((feat, idx) => (
              <li key={idx} className="text-xs text-[var(--text-main,#14241C)] dark:text-[#E5EDE8] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="pt-6">
        <Button
          type="button"
          onClick={() => onSelectPlan(plan)}
          disabled={isCurrentPlan}
          className={`w-full h-10 rounded-[20px] font-[550] text-xs flex items-center justify-center gap-1.5 shadow-xs ${
            plan.isPopular
              ? "bg-[var(--gold,#B88E4C)] hover:bg-[var(--gold-hover,#A07839)] text-white shadow-[0_3px_10px_rgba(184,142,76,0.3)]"
              : "bg-[var(--primary,#0B291E)] hover:bg-[var(--primary-hover,#133E2F)] text-white"
          }`}
        >
          {isCurrentPlan ? (
            <span>Đang Sử Dụng</span>
          ) : plan.price === 0 ? (
            <span>Bắt Đầu Miễn Phí</span>
          ) : (
            <>
              <span>Nâng Cấp Gói Này</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
