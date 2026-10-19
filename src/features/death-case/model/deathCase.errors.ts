import { isAxiosError } from "axios";
import { z } from "zod";
import { HTTP_STATUS } from "@/shared/constants";

const problem = z.object({ code: z.string().optional(), reason: z.string().optional() });

/** Lý do của DEATH_CASE_NOT_ALLOWED ở các thao tác Executor (mở, sửa, tải trang, gửi, tạo bản bổ sung). */
const deathCaseReasons: Record<string, string> = {
  PLAN_NOT_RUNNING:
    "Kế hoạch bàn giao của kho chưa kích hoạt hoặc đã sang giai đoạn khác nên chưa thao tác được hồ sơ.",
  VERSION_LOCKED:
    "Phiên bản này đã gửi nên không sửa được nữa. Tạo phiên bản bổ sung nếu cần thay đổi.",
  CASE_CLOSED:
    "Hồ sơ đã đóng (đã duyệt, bị từ chối hoặc đang tạm dừng) nên không sửa hay gửi được.",
  CASE_NOT_REVISABLE:
    "Chưa tạo được phiên bản bổ sung: đã có bản nháp, hoặc hồ sơ không ở trạng thái đang xét hay cần bổ sung. Tải lại hồ sơ.",
};

/** Lý do của HANDOVER_NOT_ALLOWED khi Executor gửi lại lời mời bàn giao. */
const resendReasons: Record<string, string> = {
  PLAN_NOT_IN_HANDOVER: "Kế hoạch không còn ở giai đoạn bàn giao nên không gửi lại lời mời được.",
  WRONG_STATE: "Lượt này đã có người nhận hoặc đã kết thúc. Tải lại tiến độ để xem trạng thái mới.",
  HOLD_ACTIVE: "Kho đang bị tạm giữ nên chưa gửi lại lời mời được.",
  RESEND_TOO_SOON: "Vừa gửi lời mời cho lượt này. Vui lòng thử lại sau 15 phút.",
  NO_EMAIL: "Người nhận chưa có email nên không gửi lại lời mời được.",
  INVITATION_SEND_FAILED: "Gửi thư lời mời chưa thành công. Vui lòng thử lại sau.",
};

/**
 * Câu báo riêng theo `reason` cho lỗi của hồ sơ chứng tử và gửi lại lời mời.
 * Trả chuỗi rỗng khi không có lý do riêng để caller dùng thông báo chung của usePrivateAction.
 * INVITATION_SEND_FAILED đi kèm 503 nên phải bắt ở đây, trước nhánh "máy chủ sự cố" chung.
 */
export function deathCaseActionError(failure: unknown): string {
  if (!isAxiosError<unknown>(failure) || !failure.response) return "";
  const parsed = problem.safeParse(failure.response.data);
  if (!parsed.success) return "";
  const { code, reason } = parsed.data;
  if (!reason) return "";
  if (code === "DEATH_CASE_NOT_ALLOWED" && Object.hasOwn(deathCaseReasons, reason)) {
    return deathCaseReasons[reason];
  }
  if (code === "HANDOVER_NOT_ALLOWED" && Object.hasOwn(resendReasons, reason)) {
    if (
      reason === "INVITATION_SEND_FAILED" &&
      failure.response.status !== HTTP_STATUS.SERVICE_UNAVAILABLE
    ) {
      return "";
    }
    return resendReasons[reason];
  }
  return "";
}
