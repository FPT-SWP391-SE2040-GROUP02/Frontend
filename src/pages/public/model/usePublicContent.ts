import { useMemo } from "react";
import { useBillingPlans } from "@/features/billing/model/useBilling";
import type { BillingPlans } from "@/features/billing/model/billing.types";
import { fillTokens } from "@/shared/settings/fillTokens";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";
import { LANDING_CONTENT } from "./landing.content";
import { FAQ_CONTENT, TERMS_CONTENT } from "./publicInfo.content";

const money = new Intl.NumberFormat("vi-VN");
const BYTES_PER_MIB = 1_048_576;

interface PricingCard {
  name: string;
  price: string;
  features: readonly string[];
}

interface PricingContent {
  eyebrow: string;
  title: string;
  description: string;
  featuredPlan: string;
  action: string;
  plans: readonly PricingCard[];
}

/** Nội dung trang giới thiệu; riêng phần gói được nới kiểu vì giá và dung lượng lấy từ Backend. */
type LandingContent = Omit<typeof LANDING_CONTENT, "pricing"> & { pricing: PricingContent };

function mib(bytes: number): number {
  return Math.round(bytes / BYTES_PER_MIB);
}

/** Các gói đang hiện: không tính gói đã xóa; đúng thứ tự Admin đặt. */
function visibleTiers(plans: BillingPlans | undefined) {
  if (!plans) return [];
  return plans.tiers
    .filter((tier) => tier.hidden !== true)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Câu tóm tắt các gói cho mục hỏi đáp; chưa tải được giá thì dùng câu mô tả không có số. */
function plansSummary(plans: BillingPlans | undefined, freeQuotaMb: number): string {
  const tiers = visibleTiers(plans);
  if (tiers.length === 0) {
    return "Mỗi gói có dung lượng, quyền lợi và giá riêng, xem tại trang gói dịch vụ.";
  }
  const parts = [
    `Free: 0đ, ${freeQuotaMb} MiB, lưu nội dung cá nhân, chưa thiết lập kế hoạch bàn giao.`,
  ];
  for (const tier of tiers) {
    const first = tier.prices[0];
    const price = first
      ? `${money.format(first.amount)}đ / ${first.serviceDays} ngày`
      : "chưa mở bán";
    parts.push(
      `${tier.name ?? tier.tier}: ${price}, ${mib(tier.storageQuotaBytes)} MiB, ${tier.includedBeneficiarySlots} người nhận kèm gói.`,
    );
  }
  return parts.join(" ");
}

/** Thẻ gói trên trang giới thiệu: lấy giá, dung lượng, mô tả từ Backend; chưa có thì giữ bản tĩnh. */
function pricingFromPlans(base: PricingContent, plans: BillingPlans | undefined): PricingContent {
  const tiers = visibleTiers(plans);
  if (!plans || tiers.length === 0) return base;
  const freeFeatures =
    plans.freeFeatures && plans.freeFeatures.length > 0
      ? plans.freeFeatures
      : (base.plans[0]?.features.slice(1) ?? []);
  const cards: PricingCard[] = [
    {
      name: "Free",
      price: "0đ",
      features: [`Dung lượng ${mib(plans.free?.storageQuotaBytes ?? 0)} MiB`, ...freeFeatures],
    },
  ];
  const staticByName = new Map(base.plans.map((plan) => [plan.name, plan]));
  for (const tier of tiers) {
    const label = (tier.name ?? tier.tier).replace(/^Legacy\s+/i, "");
    const first = tier.prices[0];
    const written = tier.features && tier.features.length > 0 ? tier.features : null;
    cards.push({
      name: label,
      price: first ? `${money.format(first.amount)}đ / ${first.serviceDays} ngày` : "Tạm ngừng bán",
      features: [
        `Dung lượng ${mib(tier.storageQuotaBytes)} MiB`,
        ...(written ??
          (staticByName.get(label)?.features ?? []).filter(
            (line) => !line.startsWith("Dung lượng"),
          )),
      ],
    });
  }
  const periodDays = tiers[0]?.prices[0]?.serviceDays;
  return {
    ...base,
    description: periodDays
      ? `Giá theo biểu phí hiện hành. Các gói trả phí tính theo chu kỳ ${periodDays} ngày.`
      : base.description,
    featuredPlan:
      cards.length > 1 ? (cards[cards.length - 1]?.name ?? base.featuredPlan) : base.featuredPlan,
    plans: cards,
  };
}

/** Bảng số điền vào nội dung công khai: mốc thời gian do Admin cấu hình và tóm tắt gói. */
function usePublicTokens() {
  const windows = usePolicyWindows();
  const plans = useBillingPlans(true).data;
  const summary = plansSummary(plans, windows.freeQuotaMb);
  return { windows, plans, summary };
}

export function useLandingContent(): LandingContent {
  const { windows, plans, summary } = usePublicTokens();
  return useMemo(() => {
    const filled = fillTokens(LANDING_CONTENT, { ...windows, plansSummary: summary });
    return { ...filled, pricing: pricingFromPlans(filled.pricing, plans) };
  }, [windows, plans, summary]);
}

export function useFaqContent(): typeof FAQ_CONTENT {
  const { windows, summary } = usePublicTokens();
  return useMemo(
    () => fillTokens(FAQ_CONTENT, { ...windows, plansSummary: summary }),
    [windows, summary],
  );
}

export function useTermsContent(): typeof TERMS_CONTENT {
  const { windows, summary } = usePublicTokens();
  return useMemo(
    () => fillTokens(TERMS_CONTENT, { ...windows, plansSummary: summary }),
    [windows, summary],
  );
}
