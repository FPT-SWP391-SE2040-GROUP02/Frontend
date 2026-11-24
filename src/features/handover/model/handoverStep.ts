import type { z } from "zod";
import type { handoverTurnSchema } from "./handover.schema";

type TurnStatus = z.infer<typeof handoverTurnSchema>["status"];

/**
 * Bước hiện tại (1–3) của người nhận: 1 Đồng ý hoặc từ chối (chọn, tải ảnh căn cước, ký), 2 Xét duyệt,
 * 3 Nhập mã nhận. Không có bước "nhận thư mời": nhận lượt chạy ngầm khi bấm nút ở thẻ thư mời.
 * `signed` là true khi người nhận đã ký và gửi biên bản (chỉ có nghĩa ở IDENTITY_IN_PROGRESS).
 * `receivedAll` là true khi người nhận đã bấm "Tôi đã nhận đủ": cả 3 bước xong, trả 4 (không còn bước đang ở đây).
 * Lượt đã kết thúc không thành công (từ chối, hết hạn, hủy) không có bước hiện tại: trả null.
 */
export function currentHandoverStep(
  status: TurnStatus,
  signed = false,
  receivedAll = false,
): number | null {
  switch (status) {
    case "INVITED":
    case "INITIAL_RESPONSE_EXPIRED":
      return 1;
    case "IDENTITY_IN_PROGRESS":
      if (signed) {
        return 2;
      }
      return 1;
    case "READY_TO_ACCEPT":
      return 3;
    case "HANDOVER_COMMITTED":
      if (receivedAll) {
        return 4;
      }
      return 3;
    default:
      return null;
  }
}
