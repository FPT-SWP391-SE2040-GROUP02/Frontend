import type { ReferenceServicePlan } from "@/features/billing/model/servicePlanPreview";

/** Bảng tham khảo SRS 3.15.0 §8.1; không dùng để tính đơn hàng hoặc cấp quyền cho tài khoản. */
export const PRICING_CATALOG = [
  {
    serviceTier: "FREE",
    name: "Owner Free",
    termPrices: [],
    includedBeneficiarySlots: 0,
    storage: 20,
    features: [
      "Lưu trữ nội dung cá nhân",
      "Chưa thiết lập kế hoạch bàn giao",
      "Không có người nhận",
    ],
  },
  {
    serviceTier: "XS",
    name: "Legacy XS",
    termPrices: [
      { years: 1, days: 365, price: 199000 },
      { years: 3, days: 1095, price: 499000 },
      { years: 5, days: 1825, price: 799000 },
    ],
    includedBeneficiarySlots: 2,
    storage: 200,
    features: ["Thiết lập kế hoạch bàn giao", "Điểm danh và quy trình bàn giao"],
  },
  {
    serviceTier: "XS_MAX",
    name: "Legacy XS Max",
    termPrices: [
      { years: 1, days: 365, price: 399000 },
      { years: 3, days: 1095, price: 999000 },
      { years: 5, days: 1825, price: 1599000 },
    ],
    includedBeneficiarySlots: 5,
    storage: 500,
    features: ["Các tính năng của Legacy XS", "PDF tổng hợp kế hoạch"],
  },
] as const satisfies readonly ReferenceServicePlan[];
