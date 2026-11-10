import { isAxiosError } from "axios";
import { privateActionError } from "@/shared/api/usePrivateAction";
import { HTTP_STATUS } from "@/shared/constants";

/** Câu lỗi hiện dưới ô chọn ngày: lỗi riêng của chức năng tua, còn lại dùng câu chung của ứng dụng. */
export function demoClockErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data: unknown = error.response?.data;
    let code = "";
    if (
      data !== null &&
      typeof data === "object" &&
      "code" in data &&
      typeof data.code === "string"
    ) {
      code = data.code;
    }
    if (status === HTTP_STATUS.CONFLICT && code === "DEMO_CLOCK_BUSY") {
      return "Đang có một lần tua khác chạy. Hãy chờ nó xong rồi thử lại.";
    }
    if (status === HTTP_STATUS.NOT_FOUND) {
      return "Chỉ tài khoản Quản trị viên mới tua được, và máy chủ phải bật chế độ thử nghiệm.";
    }
  }
  return privateActionError(error);
}
