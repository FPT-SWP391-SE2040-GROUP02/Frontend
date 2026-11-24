import type { PaymentOrderSummary } from "./billing.types";

/** Mô tả ngắn nội dung đơn từ dữ liệu của Backend; không tự tính tiền. */
export function describeOrder(order: PaymentOrderSummary): string {
  let tierName = "XS Max";
  if (order.tier === "XS") {
    tierName = "XS";
  }
  if (order.kind === "UPGRADE") {
    return `Nâng lên ${tierName}`;
  }
  let verb = "Mua gói";
  if (order.kind === "RENEWAL") {
    verb = "Gia hạn gói";
  }
  return `${verb} ${tierName} · ${order.years} năm`;
}
