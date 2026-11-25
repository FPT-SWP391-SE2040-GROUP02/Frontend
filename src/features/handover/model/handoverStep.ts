import type { z } from "zod";
import type { handoverTurnSchema } from "./handover.schema";

type TurnStatus = z.infer<typeof handoverTurnSchema>["status"];

/**
 * Bước hiện tại của một lượt bàn giao, đánh số theo sáu bước chung của người nhận (RECEIVE_STEP_TITLES). Lượt chỉ có
 * sau khi luật sư chốt biên bản nên bắt đầu từ bước 3: 3 Nộp ảnh căn cước, 4 Luật sư xác nhận danh tính, 5 Ký biên
 * bản, 6 Nhập mã và tải về.
 * `identitySubmitted` là true khi đã nộp ảnh căn cước và đang chờ luật sư (chỉ có nghĩa ở IDENTITY_IN_PROGRESS).
 * `receivedAll` là true khi người nhận đã bấm "Tôi đã nhận đủ": xong cả sáu bước, trả 7.
 * Lượt đã kết thúc không thành công (từ chối, hết hạn, hủy) không có bước hiện tại: trả null.
 */
export function currentHandoverStep(
  status: TurnStatus,
  identitySubmitted = false,
  receivedAll = false,
): number | null {
  switch (status) {
    case "INVITED":
    case "INITIAL_RESPONSE_EXPIRED":
      return 3;
    case "IDENTITY_IN_PROGRESS":
      if (identitySubmitted) {
        return 4;
      }
      return 3;
    case "READY_TO_ACCEPT":
      return 5;
    case "HANDOVER_COMMITTED":
      if (receivedAll) {
        return 7;
      }
      return 6;
    default:
      return null;
  }
}
