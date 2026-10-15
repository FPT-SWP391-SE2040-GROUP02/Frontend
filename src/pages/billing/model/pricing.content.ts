/** Catalog theo SRS 3.14.0 §8.1; không phải quote/order hoặc entitlement của tài khoản. */
export const PRICING_CATALOG = [
  {
    name: "Owner Free",
    price: 0,
    duration: "Không hết hạn theo kỳ gói",
    assets: 3,
    storage: 20,
    features: ["Lưu trữ nội dung cá nhân", "Chưa thiết lập kế hoạch bàn giao"],
  },
  {
    name: "Legacy XS",
    price: 199000,
    duration: "365 ngày",
    assets: 20,
    storage: 200,
    features: ["Thiết lập kế hoạch bàn giao", "Điểm danh và quy trình bàn giao"],
  },
  {
    name: "Legacy XS Max",
    price: 399000,
    duration: "365 ngày",
    assets: 50,
    storage: 500,
    features: ["Các tính năng của Legacy XS", "PDF tổng hợp kế hoạch"],
  },
] as const;
