import type { z } from "zod";
import type { handoverTurnSchema } from "./handover.schema";

type TurnStatus = z.infer<typeof handoverTurnSchema>["status"];

/**
 * Bước hiện tại (1–6) của một lượt bàn giao. Lượt chỉ tồn tại khi hồ sơ đã được duyệt nên ba bước đầu luôn xong.
 * Lượt đã kết thúc không thành công (từ chối, hết hạn, hủy) không có bước hiện tại: trả null.
 */
export function currentHandoverStep(status: TurnStatus): number | null {
  switch (status) {
    case "INVITED":
    case "INITIAL_RESPONSE_EXPIRED":
    case "IDENTITY_IN_PROGRESS":
      return 4;
    case "READY_TO_ACCEPT":
      return 5;
    case "HANDOVER_COMMITTED":
      return 6;
    default:
      return null;
  }
}
