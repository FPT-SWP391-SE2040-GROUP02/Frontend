import { RECEIVE_STEPS_DONE } from "@/entities/handoverRecord";
import { ROUTES } from "@/shared/config/routes.config";
import type { Tone } from "@/shared/ui/heritageKit";
import type { AvailableHandover, AvailableStatus } from "./handoverRequest.schema";

/** Nhãn tiếng Việt và màu của từng trạng thái kho được để lại cho người nhận. */
export const availableStatusLabel: Record<AvailableStatus, { label: string; tone: Tone }> = {
  NOT_REQUESTED: { label: "Chưa gửi yêu cầu", tone: "neutral" },
  REQUEST_PENDING: { label: "Chờ luật sư xét", tone: "warning" },
  SUPPLEMENT_REQUESTED: { label: "Cần bổ sung giấy tờ", tone: "warning" },
  REJECTED: { label: "Bị từ chối", tone: "danger" },
  IN_REVIEW: { label: "Luật sư đang xử lý", tone: "warning" },
  NEED_MY_SIGNATURE: { label: "Cần bạn ký biên bản", tone: "warning" },
  WAITING_OTHERS: { label: "Chờ luật sư hoặc Người thực thi ký", tone: "neutral" },
  CODE_READY: { label: "Đã có mã nhận", tone: "success" },
  RECEIVED: { label: "Đã nhận tài sản", tone: "success" },
  NEED_IDENTITY: { label: "Cần bạn nộp ảnh căn cước", tone: "warning" },
};

/** Bước tiếp theo của một dòng: nhãn nút và nơi dẫn tới. */
/**
 * Bước của người nhận ở một kho, theo sáu bước chung (RECEIVE_STEP_TITLES); RECEIVE_STEPS_DONE khi đã nhận xong; null
 * khi bị từ chối hoặc chưa gửi yêu cầu được. IN_REVIEW có lượt là đã nộp căn cước (bước 4), chưa có lượt là luật sư
 * còn đang xét và lập biên bản (bước 2).
 */
export function availableStep(row: AvailableHandover): number | null {
  const hasTurn = row.turnId !== null && row.turnId !== undefined;
  switch (row.status) {
    case "NOT_REQUESTED":
      if (row.canRequest) {
        return 1;
      }
      return null;
    case "REQUEST_PENDING":
    case "SUPPLEMENT_REQUESTED":
      return 2;
    case "IN_REVIEW":
      if (hasTurn) {
        return 4;
      }
      return 2;
    case "NEED_IDENTITY":
      return 3;
    case "NEED_MY_SIGNATURE":
    case "WAITING_OTHERS":
      return 5;
    case "CODE_READY":
      return 6;
    case "RECEIVED":
      return RECEIVE_STEPS_DONE;
    case "REJECTED":
      return null;
  }
}

export interface AvailableAction {
  label: string;
  to: string;
}

/**
 * Kho chưa gửi yêu cầu và gửi được: dòng có nút "Gửi yêu cầu" mở form ngay trong thẻ kho (không còn trang riêng),
 * khác các nút còn lại là liên kết sang cổng người nhận.
 */
export function canSendRequestHere(row: AvailableHandover): boolean {
  return row.status === "NOT_REQUESTED" && row.canRequest;
}

/**
 * Liên kết duy nhất của một dòng. Ký biên bản, nhập mã và tải đều làm ở cổng người nhận có sẵn,
 * trang này chỉ dẫn vào đó. Trả null khi không có gì để mở (chỉ hiện nhãn trạng thái) hoặc khi dòng dùng form gửi
 * yêu cầu ngay tại chỗ (`canSendRequestHere`).
 */
export function availableAction(row: AvailableHandover): AvailableAction | null {
  const portal = ROUTES.BENEFICIARY.CLAIM;
  const hasClaim = row.claimId !== null && row.claimId !== undefined;
  const hasTurn = row.turnId !== null && row.turnId !== undefined;
  switch (row.status) {
    case "NOT_REQUESTED":
      return null;
    case "REQUEST_PENDING":
      return { label: "Xem yêu cầu", to: portal };
    case "SUPPLEMENT_REQUESTED":
      return { label: "Nộp bổ sung", to: portal };
    case "NEED_MY_SIGNATURE":
      return { label: "Ký biên bản", to: portal };
    case "NEED_IDENTITY":
      return { label: "Nộp ảnh căn cước", to: portal };
    case "CODE_READY":
      return { label: "Nhập mã và tải", to: portal };
    case "REJECTED":
      if (hasClaim) {
        return { label: "Xem yêu cầu", to: portal };
      }
      return null;
    case "IN_REVIEW":
    case "WAITING_OTHERS":
    case "RECEIVED":
      if (hasTurn) {
        return { label: "Xem biên bản", to: portal };
      }
      return null;
  }
}
