import { isAxiosError } from "axios";
import { z } from "zod";
import { privateActionError } from "@/shared/api/usePrivateAction";

const problem = z.object({ code: z.string().optional(), reason: z.string().optional() });

const grantReasons: Record<string, string> = {
  EXPIRED: "Quyền xem/tải đã hết hạn. Tải lại để xem trạng thái mới nhất.",
  BLOCKED: "Quyền xem/tải đang bị tạm giữ. Liên hệ hỗ trợ nếu cần làm rõ.",
  REVOKED: "Quyền xem/tải đã bị thu hồi.",
  PLAN_NOT_ACTIVE: "Kế hoạch bàn giao hiện không còn hiệu lực nên chưa thể tải nội dung.",
};

/**
 * Body lỗi của endpoint tải là Blob (responseType blob) nên mã lỗi bị mất.
 * Đọc lại thành object JSON; body không phải problem+json thì bỏ đi, không đưa ra UI.
 */
export async function readBlobProblem(failure: unknown): Promise<unknown> {
  if (isAxiosError<unknown>(failure) && failure.response?.data instanceof Blob) {
    try {
      failure.response.data = JSON.parse(await failure.response.data.text()) as unknown;
    } catch {
      failure.response.data = undefined;
    }
  }
  return failure;
}

/**
 * Thông báo cho lỗi tải nội dung. Lỗi toàn vẹn là 500 nên phải xử lý trước nhánh "máy chủ sự cố"
 * chung; tải thất bại không bao giờ được hiển thị như thành công.
 */
export function downloadErrorMessage(failure: unknown): string {
  if (isAxiosError<unknown>(failure) && failure.response) {
    const parsed = problem.safeParse(failure.response.data);
    if (parsed.success) {
      if (parsed.data.code === "CONTENT_INTEGRITY_FAILED") {
        return "Không thể xác nhận tính toàn vẹn của nội dung nên hệ thống không gửi tệp. Vui lòng liên hệ hỗ trợ.";
      }
      if (parsed.data.code === "GRANT_NOT_ACTIVE") {
        const reason = parsed.data.reason;
        if (reason && Object.hasOwn(grantReasons, reason)) return grantReasons[reason];
        return "Quyền tải nội dung hiện không còn hiệu lực. Tải lại trạng thái bàn giao.";
      }
    }
  }
  return privateActionError(failure);
}
