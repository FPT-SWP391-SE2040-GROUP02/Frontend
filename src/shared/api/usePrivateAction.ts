import { useEffect, useRef, useState } from "react";
import { AxiosError, isAxiosError } from "axios";
import { z } from "zod";
import { accessTokenMemory } from "./accessToken";
import { HTTP_STATUS } from "@/shared/constants";

const problem = z.object({ code: z.string().optional() });
const messages: Record<string, string> = {
  EXECUTOR_INVITATION_INVALID:
    "Lời mời Executor không hợp lệ hoặc đã hết hạn. Liên hệ Chủ kho để gửi lại.",
  EXECUTOR_INVITATION_CONFLICT: "Lời mời hoặc phân công đã tồn tại/thay đổi. Tải lại để kiểm tra.",
  EXECUTOR_NOT_ALLOWED: "Trạng thái hoặc tài khoản hiện không cho phép thao tác Executor này.",
  PLAN_ACTIVATION_NOT_ALLOWED: "Trạng thái kế hoạch hiện không cho phép kích hoạt lại.",
  PLAN_ACTIVATION_REQUIREMENTS_NOT_MET:
    "Kế hoạch chưa đủ điều kiện. Tải lại checklist để kiểm tra trước khi kích hoạt.",
  POLICY_ACKNOWLEDGEMENT_REQUIRED: "Cần đọc và xác nhận nội dung hiện hành trước khi tiếp tục.",
  VALIDATION_ERROR: "Dữ liệu chưa hợp lệ. Kiểm tra các trường đã nhập trước khi gửi lại.",
  VAULT_NOT_FOUND: "Không tìm thấy kho. Tải lại để kiểm tra kho của tài khoản hiện tại.",
  ASSET_NOT_FOUND: "Không tìm thấy tài sản trong kho. Tải lại danh sách trước khi tiếp tục.",
  CONTAINER_NOT_FOUND: "Không tìm thấy gói bàn giao. Tải lại danh sách trước khi tiếp tục.",
  BENEFICIARY_NOT_FOUND: "Không tìm thấy hồ sơ người nhận. Tải lại danh sách trước khi tiếp tục.",
  EMAIL_NOT_VERIFIED: "Vui lòng xác minh email trước khi tạo kho.",
  ACCOUNT_NOT_ACTIVE: "Tài khoản hiện không được phép thực hiện thao tác này.",
  PAID_TIER_REQUIRED: "Thao tác này cần gói dịch vụ trả phí còn hiệu lực.",
  EDIT_CONFLICT: "Dữ liệu đã thay đổi. Tải lại trước khi chỉnh sửa tiếp.",
  VAULT_NOT_EDITABLE: "Kho hiện không cho phép chỉnh sửa.",
  STORAGE_QUOTA_EXCEEDED: "Kho không đủ dung lượng cho nội dung này.",
  CONTAINER_LIMIT_EXCEEDED: "Kho đã đạt giới hạn số gói bàn giao.",
  CONTAINER_ARCHIVED: "Gói đã lưu trữ, không thể chỉnh sửa.",
  ASSET_ALREADY_IN_CONTAINER: "Tài sản đang nằm trong một gói khác.",
  PLAN_DEACTIVATION_CONFIRMATION_REQUIRED:
    "Thao tác này sẽ đưa kế hoạch về nháp. Đọc cảnh báo và xác nhận trước khi tiếp tục.",
  BENEFICIARY_IDENTITY_CONFLICT: "Số định danh đã có hồ sơ với thông tin khác.",
  BENEFICIARY_IN_USE: "Người nhận đang được gắn vào gói. Hãy gỡ khỏi các gói trước.",
  BENEFICIARY_SLOTS_EXCEEDED: "Kho không còn suất người nhận.",
  CHECKIN_NOT_ALLOWED: "Kế hoạch hiện không cho phép điểm danh.",
  EKYC_IMAGE_REJECTED:
    "Ảnh chưa đáp ứng yêu cầu xác minh. Hãy chọn ảnh rõ, đúng mặt giấy tờ hoặc selfie rồi thử lại.",
  EKYC_DOCUMENT_EXPIRED: "Bước giấy tờ đã hết hạn hoặc đã được dùng. Bắt đầu lại với ảnh giấy tờ.",
  EKYC_CONSENT_REQUIRED:
    "Cần đồng ý điều khoản xác minh trước khi tiếp tục. Bắt đầu lại từ bước đồng ý.",
  EKYC_DOCUMENT_MISMATCH:
    "Mặt trước và mặt sau không khớp. Kiểm tra ảnh và gửi lại cùng một giấy tờ.",
  EKYC_SERVICE_UNAVAILABLE: "Dịch vụ xác minh hiện chưa sẵn sàng. Vui lòng thử lại sau.",
  DEATH_CASE_NOT_FOUND: "Không tìm thấy hồ sơ chứng tử trong phạm vi truy cập của bạn.",
  DEATH_CASE_NOT_ALLOWED:
    "Trạng thái hồ sơ hoặc kế hoạch hiện không cho phép thao tác này. Tải lại để kiểm tra.",
  DEATH_CASE_INCOMPLETE: "Hồ sơ chưa đủ thông tin hoặc trang giấy tờ. Bổ sung trước khi gửi.",
  DEATH_CASE_FILE_LIMIT_EXCEEDED: "Hồ sơ đã đạt giới hạn số trang giấy tờ.",
  HANDOVER_INVITATION_INVALID: "Lời mời không hợp lệ hoặc không còn sử dụng được.",
  HANDOVER_NOT_FOUND: "Không tìm thấy lượt bàn giao trong phạm vi truy cập của bạn.",
  HANDOVER_NOT_ALLOWED:
    "Trạng thái bàn giao hiện không cho phép thao tác này. Tải lại để kiểm tra.",
  HANDOVER_ALREADY_CLAIMED: "Lời mời đã được nhận. Kiểm tra danh sách lượt bàn giao của bạn.",
  HANDOVER_DECISION_EXPIRED: "Thời hạn quyết định đã kết thúc. Tải lại trạng thái bàn giao.",
  GRANT_NOT_ACTIVE: "Quyền tải nội dung hiện không còn hiệu lực. Tải lại trạng thái bàn giao.",
  CONTENT_INTEGRITY_FAILED:
    "Không thể xác nhận tính toàn vẹn của nội dung. Vui lòng liên hệ hỗ trợ.",
};

/** Chỉ hiển thị thông báo do FE quản lý; không đưa exception/body nhạy cảm ra UI. */
export function privateActionError(error: unknown): string {
  if (isAxiosError<unknown>(error)) {
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT)
      return "Máy chủ phản hồi quá lâu. Tải lại danh sách để kiểm tra kết quả trước khi gửi lại.";
    if (!error.response)
      return "Không kết nối được máy chủ. Kiểm tra kết nối và tải lại danh sách trước khi gửi lại.";
    const status = error.response.status;
    if (status === HTTP_STATUS.UNAUTHORIZED) return "Phiên đã hết hạn. Vui lòng đăng nhập lại.";
    if (status === HTTP_STATUS.PAYLOAD_TOO_LARGE)
      return "Tệp vượt quá giới hạn tải lên của máy chủ.";
    if (status === HTTP_STATUS.TOO_MANY_REQUESTS)
      return "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.";
    const parsed = problem.safeParse(error.response?.data);
    const code = parsed.success ? parsed.data.code : undefined;
    if (
      status >= HTTP_STATUS.INTERNAL_SERVER_ERROR &&
      !(status === HTTP_STATUS.SERVICE_UNAVAILABLE && code === "EKYC_SERVICE_UNAVAILABLE")
    )
      return "Máy chủ đang gặp sự cố. Tải lại để kiểm tra kết quả; nếu lỗi tiếp diễn, vui lòng liên hệ hỗ trợ.";
    if (code && Object.hasOwn(messages, code)) return messages[code];
    if (status === HTTP_STATUS.FORBIDDEN) return "Bạn không có quyền thực hiện thao tác này.";
    if (status === HTTP_STATUS.BAD_REQUEST)
      return "Dữ liệu hoặc yêu cầu chưa hợp lệ. Kiểm tra dữ liệu và tải lại trang trước khi thử lại.";
    if (status === HTTP_STATUS.NOT_FOUND)
      return "Không tìm thấy nội dung hoặc API yêu cầu. Tải lại danh sách trước khi tiếp tục.";
    if (status === HTTP_STATUS.CONFLICT)
      return "Trạng thái dữ liệu đã thay đổi. Tải lại để kiểm tra trước khi thực hiện tiếp.";
  }
  return "Không hoàn tất được thao tác. Kiểm tra dữ liệu và thử lại; nếu chưa rõ kết quả, tải lại danh sách trước khi gửi tiếp.";
}

/**
 * Submit riêng tư không retry/optimistic và không đưa payload vào MutationCache.
 * Chặn double-submit; chỉ publish kết quả khi vẫn mount và Bearer không đổi.
 * Server có thể đã ghi dù client bỏ response; cần đọc lại trước retry thủ công.
 */
export function usePrivateAction() {
  const mounted = useRef(true);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function execute<T>(
    operation: () => Promise<T>,
    publish: (result: T) => void,
  ): Promise<boolean> {
    if (busy.current) return false;
    const credential = accessTokenMemory.get();
    if (!credential) {
      setError("Vui lòng đăng nhập lại trước khi tiếp tục.");
      return false;
    }
    const current = () => mounted.current && accessTokenMemory.get() === credential;
    busy.current = true;
    setPending(true);
    setError("");
    setSucceeded(false);
    try {
      const result = await operation();
      if (!current()) return false;
      publish(result);
      setSucceeded(true);
      return true;
    } catch (failure) {
      if (current()) setError(privateActionError(failure));
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return { execute, pending, error, succeeded };
}
