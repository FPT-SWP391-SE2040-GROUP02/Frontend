import type { SplitDifference } from "./handoverRecord.schema";

/** Câu xác nhận luật sư phải tick khi biên bản khác cách chia ban đầu của Chủ tài sản. */
export const SPLIT_DEVIATION_LABEL =
  "Biên bản này khác cách chia ban đầu của Chủ tài sản (danh sách trên). Tôi xác nhận việc thay đổi là theo di chúc hoặc quy định pháp luật và chịu trách nhiệm về căn cứ này. LegacyVault chỉ giao tài sản theo biên bản luật sư đã lập.";

function namesText(names: string[]): string {
  if (names.length === 0) {
    return "không ai";
  }
  return names.join(", ");
}

/** Một chỗ khác biệt bằng tiếng Việt thường, dùng cho cả màn luật sư và bản in. */
export function splitDifferenceText(difference: SplitDifference): string {
  if (difference.kind === "RECIPIENT_ADDED") {
    return `Thêm người nhận: ${difference.recipientName}`;
  }
  if (difference.kind === "RECIPIENT_REMOVED") {
    return `Bỏ người nhận: ${difference.recipientName}`;
  }
  return `${difference.assetName}: Chủ tài sản chia cho ${namesText(difference.ownerRecipientNames)} → biên bản ghi ${namesText(difference.recordRecipientNames)}`;
}
