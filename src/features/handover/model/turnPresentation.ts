import type { z } from "zod";
import type { Tone } from "@/shared/ui/heritageKit";
import type { handoverTurnSchema, Submission } from "./handover.schema";
import { currentHandoverStep } from "./handoverStep";

type Turn = z.infer<typeof handoverTurnSchema>;

/** Nhóm trên trang Việc cần làm: cần bạn làm ngay, đang chờ người khác, đã xong, đã kết thúc không thành. */
export type TurnGroup = "urgent" | "waiting" | "done" | "ended";

/** Màu chấm trạng thái ở danh sách bên cột trái. */
export type TurnDot = "warn" | "ok" | "bad" | "info" | "none";

/** Cách hiển thị một lượt bàn giao cho người nhận: nhãn, màu, nhóm, câu gợi ý và tên nút việc tiếp theo. */
export interface TurnView {
  chip: string;
  tone: Tone;
  dot: TurnDot;
  group: TurnGroup;
  /** Bước hiện tại trong sáu bước; null khi lượt đã kết thúc không thành công. */
  step: number | null;
  actionLabel: string;
  nextHint: string;
}

/** Nhãn trạng thái của một lượt, dùng cả ở danh sách và đầu trang chi tiết. */
export const TURN_STATUS_LABELS: Record<Turn["status"], string> = {
  INVITED: "Được mời",
  INITIAL_RESPONSE_EXPIRED: "Đã qua hạn phản hồi ban đầu",
  IDENTITY_IN_PROGRESS: "Đang xác minh danh tính",
  READY_TO_ACCEPT: "Danh tính đã xong, chờ ký biên bản",
  HANDOVER_COMMITTED: "Đã tiếp nhận",
  DECLINED: "Đã từ chối",
  DECISION_EXPIRED: "Đã hết hạn quyết định",
  CANCELLED: "Đã hủy",
  LAPSED: "Đã kết thúc",
};

/** Câu giải thích cho lượt đã kết thúc không thành công. */
export const TURN_ENDED_HINTS: Partial<Record<Turn["status"], string>> = {
  DECISION_EXPIRED: "Hạn quyết định đã kết thúc nên lượt này không còn nhận được nữa.",
  DECLINED: "Bạn đã từ chối lượt bàn giao này.",
  CANCELLED:
    "Lượt này đã bị hủy vì luật sư đã sửa biên bản bàn giao và bạn không còn tên trong đó.",
  LAPSED: "Lượt bàn giao này đã kết thúc.",
};

/** Số mục chưa tải của một lượt. */
export function itemsLeft(turn: Turn): number {
  return turn.items.filter((item) => !item.downloaded).length;
}

/**
 * Trạng thái hiển thị của một lượt. `submission` là hồ sơ danh tính mới nhất (chỉ có nghĩa khi đang xác minh danh tính):
 * luật sư yêu cầu làm lại thì lượt thành việc cần làm, đã nộp thì thành đang chờ luật sư. Chỉ để hiển thị; Backend mới
 * quyết định lượt còn hợp lệ hay không.
 */
export function describeTurn(turn: Turn, submission?: Submission | null): TurnView {
  const submitted = submission?.status === "SUBMITTED";
  const step = currentHandoverStep(turn.status, submitted, Boolean(turn.receivedAllAt));
  if (turn.receivedAllAt) {
    return {
      chip: "Đã hoàn tất",
      tone: "success",
      dot: "ok",
      group: "done",
      step,
      actionLabel: "Xem phiếu nhận",
      nextHint: "Bạn đã nhận đủ tài sản và ký phiếu giao nhận.",
    };
  }
  switch (turn.status) {
    case "INVITED":
    case "INITIAL_RESPONSE_EXPIRED":
      return {
        chip: "Thư mời mới",
        tone: "warning",
        dot: "warn",
        group: "urgent",
        step,
        actionLabel: "Bắt đầu ngay",
        nextHint: "Bấm Bắt đầu để nộp căn cước xác minh danh tính.",
      };
    case "IDENTITY_IN_PROGRESS":
      if (submission?.status === "SUPPLEMENT_REQUESTED") {
        return {
          chip: "Cần nộp lại căn cước",
          tone: "danger",
          dot: "bad",
          group: "urgent",
          step,
          actionLabel: "Nộp lại căn cước",
          nextHint: "Luật sư yêu cầu bạn nộp lại ảnh căn cước.",
        };
      }
      if (submitted) {
        return {
          chip: "Chờ luật sư duyệt",
          tone: "neutral",
          dot: "info",
          group: "waiting",
          step,
          actionLabel: "Xem tiến độ",
          nextHint: "Đã gửi căn cước. Bạn chưa cần làm gì thêm.",
        };
      }
      return {
        chip: "Cần nộp căn cước",
        tone: "warning",
        dot: "warn",
        group: "urgent",
        step,
        actionLabel: "Nộp căn cước",
        nextHint: "Nộp ảnh căn cước hai mặt để luật sư xác nhận danh tính.",
      };
    case "READY_TO_ACCEPT":
      return {
        chip: "Chờ bạn ký biên bản",
        tone: "warning",
        dot: "warn",
        group: "urgent",
        step,
        actionLabel: "Xem và ký biên bản",
        nextHint: "Danh tính đã được duyệt. Đọc phần tài sản của bạn rồi ký xác nhận.",
      };
    case "HANDOVER_COMMITTED": {
      if (turn.grant && turn.grant.status !== "ACTIVE") {
        const blocked = turn.grant.status === "BLOCKED";
        return {
          chip: blocked ? "Tạm dừng tải" : "Hết hạn tải",
          tone: blocked ? "warning" : "neutral",
          dot: blocked ? "warn" : "none",
          group: blocked ? "waiting" : "ended",
          step,
          actionLabel: "Mở chi tiết",
          nextHint: blocked
            ? "Quyền tải đang tạm dừng trong lúc hồ sơ được xác minh lại."
            : "Quyền tải đã hết hạn hoặc bị thu hồi.",
        };
      }
      if (turn.keyRequired && !turn.keyVerified) {
        return {
          chip: "Sẵn sàng nhận tài sản",
          tone: "warning",
          dot: "warn",
          group: "urgent",
          step,
          actionLabel: "Nhập mã và tải về",
          nextHint: "Đủ ba chữ ký. Nhập mã nhận Người thực thi gửi để mở tải tài sản.",
        };
      }
      const left = itemsLeft(turn);
      if (left > 0) {
        return {
          chip: `Còn ${left} mục chưa tải`,
          tone: "warning",
          dot: "warn",
          group: "urgent",
          step,
          actionLabel: "Tải tài sản",
          nextHint: "Tải đủ các mục rồi ký phiếu giao nhận.",
        };
      }
      return {
        chip: "Chờ ký phiếu nhận",
        tone: "warning",
        dot: "warn",
        group: "urgent",
        step,
        actionLabel: "Ký phiếu nhận",
        nextHint: "Đã tải đủ tài sản. Ký phiếu giao nhận để hoàn tất.",
      };
    }
    default:
      return {
        chip: TURN_STATUS_LABELS[turn.status],
        tone: "neutral",
        dot: "none",
        group: "ended",
        step,
        actionLabel: "Mở chi tiết",
        nextHint: TURN_ENDED_HINTS[turn.status] ?? "",
      };
  }
}
