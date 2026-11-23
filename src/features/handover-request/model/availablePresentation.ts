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
  WAITING_OTHERS: { label: "Chờ các bên khác ký", tone: "neutral" },
  CODE_READY: { label: "Đã có mã nhận", tone: "success" },
  RECEIVED: { label: "Đã nhận tài sản", tone: "success" },
  NEED_IDENTITY: { label: "Cần bạn nộp ảnh căn cước", tone: "warning" },
};

/** Bước tiếp theo của một dòng: nhãn nút và nơi dẫn tới. */
export interface AvailableAction {
  label: string;
  to: string;
}

/**
 * Nút duy nhất của một dòng. Ký biên bản, nhập mã và tải đều làm ở cổng người nhận có sẵn,
 * trang này chỉ dẫn vào đó. Trả null khi không có gì để mở (chỉ hiện nhãn trạng thái).
 */
export function availableAction(row: AvailableHandover): AvailableAction | null {
  const portal = ROUTES.BENEFICIARY.CLAIM;
  const hasClaim = row.claimId !== null && row.claimId !== undefined;
  const hasTurn = row.turnId !== null && row.turnId !== undefined;
  switch (row.status) {
    case "NOT_REQUESTED":
      if (row.canRequest) {
        const query = new URLSearchParams({ vaultId: row.vaultId });
        return { label: "Gửi yêu cầu", to: `${ROUTES.REQUEST}?${query.toString()}` };
      }
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
