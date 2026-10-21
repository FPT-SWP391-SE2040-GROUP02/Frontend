import type { PaymentOrderSummary } from "./billing.types";

/** Mô tả ngắn nội dung đơn từ dữ liệu của Backend; không tự tính tiền. */
export function describeOrder(order: PaymentOrderSummary): string {
  let tierName = "XS Max";
  if (order.tier === "XS") {
    tierName = "XS";
  }
  let text = `Mua thêm ${order.extraSlots} suất người nhận`;
  if (order.kind === "UPGRADE") {
    text = `Nâng lên ${tierName}`;
  }
  if (order.kind === "PURCHASE" || order.kind === "RENEWAL") {
    let verb = "Mua gói";
    if (order.kind === "RENEWAL") {
      verb = "Gia hạn gói";
    }
    text = `${verb} ${tierName} · ${order.years} năm`;
    if (order.extraSlots > 0) {
      text = `${text} + ${order.extraSlots} suất`;
    }
  }
  return text;
}
