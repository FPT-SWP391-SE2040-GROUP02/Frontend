import { AxiosError, isAxiosError } from "axios";
import { z } from "zod";
import { privateActionError } from "@/shared/api/usePrivateAction";
import { HTTP_STATUS } from "@/shared/constants";
import { invitationTokenSchema } from "../model/planSetup.schema";

const problem = z.object({ code: z.string().optional() });

export interface InvitationInspectFailure {
  title: string;
  message: string;
  /** Thử lại chỉ có ích khi lỗi tạm thời (mạng, quá tải, máy chủ); lời mời hỏng thì không. */
  retryable: boolean;
}

/**
 * Phân loại lỗi khi đọc lời mời Executor để người dùng biết nguyên nhân thật thay vì một thông báo chung.
 * Không đưa token, body hay chi tiết ngoại lệ ra giao diện.
 */
export function invitationInspectFailure(error: unknown, token: string): InvitationInspectFailure {
  if (!invitationTokenSchema.safeParse(token).success)
    return {
      title: "Liên kết thiếu mã lời mời",
      message:
        "Liên kết này không có mã lời mời hợp lệ (có thể bị cắt bớt khi sao chép). Hãy mở lại đúng nút trong email lời mời gần nhất.",
      retryable: false,
    };
  if (error instanceof z.ZodError)
    return {
      title: "Không đọc được phản hồi của máy chủ",
      message: "Máy chủ trả về dữ liệu không đúng định dạng. Vui lòng liên hệ hỗ trợ.",
      retryable: false,
    };
  if (isAxiosError<unknown>(error)) {
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT)
      return {
        title: "Máy chủ phản hồi quá lâu",
        message: "Chưa kiểm tra được lời mời. Vui lòng thử lại sau ít phút.",
        retryable: true,
      };
    if (!error.response)
      return {
        title: "Không kết nối được máy chủ",
        message: "Kiểm tra kết nối mạng rồi thử lại.",
        retryable: true,
      };
    const status = error.response.status;
    if (status === HTTP_STATUS.NOT_FOUND) {
      const parsed = problem.safeParse(error.response.data);
      if (parsed.success && parsed.data.code === "EXECUTOR_INVITATION_INVALID")
        return {
          title: "Lời mời không còn dùng được",
          message:
            "Lời mời đã hết hạn, đã bị thay bằng lời mời mới (khi Chủ kho gửi lại), đã bị thu hồi hoặc đã bị từ chối. Hãy nhờ Chủ kho gửi lại lời mời và dùng liên kết trong email mới nhất.",
          retryable: false,
        };
      return {
        title: "Không tìm thấy chức năng lời mời",
        message:
          "Máy chủ không có API kiểm tra lời mời này (sai địa chỉ máy chủ hoặc bản triển khai chưa cập nhật). Vui lòng liên hệ hỗ trợ.",
        retryable: false,
      };
    }
    if (status === HTTP_STATUS.TOO_MANY_REQUESTS || status >= HTTP_STATUS.INTERNAL_SERVER_ERROR)
      return {
        title: "Chưa kiểm tra được lời mời",
        message: privateActionError(error),
        retryable: true,
      };
  }
  return {
    title: "Không đọc được lời mời",
    message: privateActionError(error),
    retryable: false,
  };
}
