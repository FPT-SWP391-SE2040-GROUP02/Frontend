import { useEffect, useRef, useState } from "react";
import { AxiosError, isAxiosError } from "axios";
import { z } from "zod";
import { accessTokenMemory } from "./accessToken";
import { HTTP_STATUS } from "@/shared/constants";

const problem = z.object({
  code: z.string().optional(),
  reason: z.string().optional(),
  missingRequirements: z.array(z.string()).optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

const MAX_VALIDATION_MESSAGES = 3;
const MAX_VALIDATION_MESSAGE_LENGTH = 200;
const VIETNAMESE_LETTER = /[À-ỹ]/;

/**
 * Thông báo kiểm tra dữ liệu do Backend viết bằng tiếng Việt cho người dùng (không chứa nội dung bí mật).
 * Chỉ nhận câu có chữ tiếng Việt và đủ ngắn để không đưa lỗi kỹ thuật tiếng Anh của framework ra giao diện.
 */
function validationMessages(errors: Record<string, string[]> | undefined): string[] {
  if (!errors) return [];
  const found: string[] = [];
  for (const list of Object.values(errors)) {
    for (const text of list) {
      const message = text.trim();
      const usable =
        message.length > 0 &&
        message.length <= MAX_VALIDATION_MESSAGE_LENGTH &&
        VIETNAMESE_LETTER.test(message);
      if (usable && !found.includes(message)) found.push(message);
    }
  }
  return found.slice(0, MAX_VALIDATION_MESSAGES);
}

/** Reason-specific messages for HANDOVER_NOT_ALLOWED */
const handoverNotAllowedReasons: Record<string, string> = {
  HOLD_ACTIVE: "Kho đang bị tạm giữ, tạm thời chưa thực hiện được. Các hạn đang được giữ nguyên.",
  PLAN_NOT_IN_HANDOVER: "Kế hoạch không còn ở giai đoạn bàn giao.",
  WRONG_STATE:
    "Lượt này không còn ở bước phù hợp để thực hiện thao tác này (đã có người nhận, đã chuyển bước hoặc đã kết thúc).",
  OWN_TURN: "Lượt này do chính tài khoản của bạn nhận nên bạn không tự xác nhận được.",
  RESEND_TOO_SOON: "Vừa gửi xong, vui lòng thử lại sau 15 phút.",
  NO_EMAIL: "Người nhận chưa có email.",
  INVITATION_SEND_FAILED: "Chưa gửi được thư mời. Chưa có gì thay đổi, vui lòng thử lại sau.",
};

/** Reason-specific messages for EXECUTOR_NOT_ALLOWED */
const executorNotAllowedReasons: Record<string, string> = {
  OWNER_CANNOT_ACCEPT:
    "Bạn đang đăng nhập bằng tài khoản Chủ kho. Chủ kho không thể tự nhận làm Người thực hiện cho kho của chính mình. Hãy đăng xuất và đăng nhập bằng đúng email được mời.",
  INVITEE_EMAIL_MISMATCH:
    "Lời mời này gửi tới một email khác. Hãy đăng xuất và đăng nhập bằng đúng email được mời.",
  REPLACEMENT_REQUIRED:
    "Người thực hiện đã nhận nhiệm vụ nên không thu hồi trực tiếp. Hãy mời người thay; người cũ tự thôi khi người mới chấp nhận.",
  PLAN_NOT_DRAFT: "Kế hoạch của kho không ở trạng thái cho phép phản hồi lời mời Executor lúc này.",
  INDEPENDENT_EXECUTOR_REQUIRED: "Bạn đã đảm nhiệm một vai trò Người thực hiện khác trong kho này.",
};

/** Reason-specific messages for ASSET_IN_USE */
const assetInUseReasons: Record<string, string> = {
  IN_CONTAINER: "Tài sản đang nằm trong một gói. Hãy gỡ khỏi gói trước khi xóa.",
  PINNED_IN_HANDOVER: "Tài sản đã được ghim vào một lượt bàn giao nên không thể xóa.",
};

/** Reason-specific messages for VAULT_NOT_EDITABLE */
const vaultNotEditableReasons: Record<string, string> = {
  HOLD_ACTIVE: "Kho đang bị tạm giữ nên chưa thể chỉnh sửa.",
};

/** Reason-specific messages for DEATH_CASE_NOT_ALLOWED (báo còn sống, mục 6.14) */
const deathCaseNotAllowedReasons: Record<string, string> = {
  OBJECTION_ALREADY_REJECTED:
    "Lời báo trước đã bị bác. Hãy gửi một ảnh selfie mới để mở lại thay vì báo trơn.",
  OBJECTION_WINDOW_CLOSED: "Đã hết hạn 7 ngày gửi selfie cho lời báo này.",
  SELFIE_ATTEMPTS_EXCEEDED: "Bạn đã hết lượt thử selfie trong 24 giờ. Hãy thử lại sau.",
  OBJECTION_NOT_OPEN: "Hồ sơ này chưa có lời báo còn sống đang mở.",
  ALIVE_EVIDENCE_REQUIRED:
    "Chưa thể xác nhận còn sống: cần selfie đạt hoặc đã qua 7 ngày chờ bằng chứng.",
  OWNER_SELFIE_PASSED:
    "Owner đã có selfie khớp nên không thể từ chối báo tử. Chọn xác nhận còn sống hoặc chưa đủ bằng chứng.",
  // Lý do khi Người xét duyệt chấp thuận, bổ sung, từ chối hoặc xem xét cờ bị Backend từ chối.
  PLAN_STATE_INVALID:
    "Kế hoạch của kho không còn ở trạng thái mở hồ sơ, hoặc kho đã có lượt bàn giao. Tải lại hồ sơ để xem trạng thái mới nhất.",
  HOLD_ACTIVE: "Kho đang bị tạm giữ nên chưa chấp thuận được. Chờ gỡ tạm giữ rồi thử lại.",
  CASE_CLOSED: "Hồ sơ đã được chấp thuận, từ chối hoặc tạm dừng nên không thao tác thêm được.",
  NOT_UNDER_REVIEW: "Hồ sơ không còn ở bước xét duyệt. Tải lại để xem trạng thái mới nhất.",
  NEWER_VERSION_PENDING:
    "Người thực hiện đang có bản mới chờ xét nên chưa chấp thuận được bản này.",
  OWNER_NOT_NOTIFIED: "Chưa báo được cho Chủ kho nên đồng hồ 72 giờ phản đối chưa chạy.",
  OBJECTION_PERIOD_NOT_OVER: "Chưa hết 72 giờ để Chủ kho phản đối.",
  FLAGS_NOT_REVIEWED: "Còn cảnh báo của bản đang xét chưa được kiểm tra.",
  VERIFIER_CONFLICT: "Bạn có quan hệ với kho này nên chỉ được xem, không được quyết định.",
  PLAN_NOT_RUNNING: "Kế hoạch chưa chạy hoặc đã sang giai đoạn khác nên chưa thao tác được.",
  VERSION_LOCKED: "Bản hồ sơ này đã được gửi nên không sửa được nữa.",
  CASE_NOT_REVISABLE: "Hồ sơ chưa ở trạng thái cần bổ sung nên chưa tạo bản mới được.",
};

/** Reason-specific messages for PAYMENT_NOT_ALLOWED (báo giá/tạo đơn, mục 6.18) */
const paymentNotAllowedReasons: Record<string, string> = {
  VAULT_CLOSED: "Kho đã đóng nên không mua được dịch vụ.",
  PLAN_LOCKED: "Kế hoạch đang trong giai đoạn bàn giao hoặc bị khóa nên chưa mua được dịch vụ.",
  OWNER_EKYC_REQUIRED: "Cần hoàn tất xác minh danh tính eKYC của Chủ kho trước khi mua gói.",
  RENEWAL_NOT_SUPPORTED: "Kho không có kỳ dịch vụ phù hợp để thao tác này.",
  USAGE_EXCEEDS_PLAN:
    "Dữ liệu đang dùng (dung lượng hoặc số người nhận) vượt mức của lựa chọn này. Chọn hạng lớn hơn, thêm suất người nhận hoặc giảm dữ liệu trước.",
};

/** Reason-specific messages for PAYMENT_ORDER_NOT_PAYABLE */
const paymentOrderNotPayableReasons: Record<string, string> = {
  PAID: "Đơn này đã được thanh toán.",
  EXPIRED: "Đơn đã hết hạn. Hãy tạo đơn mới.",
  CANCELLED: "Đơn đã bị hủy. Hãy tạo đơn mới.",
  VAULT_CLOSED: "Kho đã đóng nên không thanh toán được đơn này.",
  ENTITLEMENT_CHANGED: "Quyền dịch vụ của kho đã thay đổi sau khi tạo đơn. Hãy tạo đơn mới.",
};

/** Reason-specific messages for EKYC_SERVICE_UNAVAILABLE (BE giữ mã 503 nhưng cho biết nguyên nhân thật) */
const ekycServiceUnavailableReasons: Record<string, string> = {
  FACE_TEMPLATE_MISSING:
    "Chủ kho chưa có mẫu khuôn mặt vì chưa hoàn tất xác minh eKYC. Hãy hoàn tất eKYC ở mục Xác minh rồi gửi lại selfie.",
};

/** Mã trong missingRequirements cần thông báo riêng thay cho thông báo chung của DEATH_CASE_INCOMPLETE. */
const missingRequirementMessages: Record<string, string> = {
  DEATH_CERTIFICATE_NOT_RECOGNIZED:
    "Hệ thống không nhận ra trang nào là giấy chứng tử hoặc trích lục khai tử. Hãy tải lên ảnh chụp rõ giấy chứng tử rồi gửi lại.",
};

/** Ưu tiên `reason` của BE trước thông báo chung theo `code`. */
/** Reason-specific messages for EKYC_IDENTITY_MISMATCH */
const ekycIdentityMismatchReasons: Record<string, string> = {
  CITIZEN_ID_ALREADY_USED:
    "Số CCCD này đã được sử dụng để xác minh cho một tài khoản khác trong hệ thống.",
  BENEFICIARY_CONFLICT:
    "Số CCCD trên giấy tờ trùng với một người nhận bạn đã thêm. Người nhận không được trùng với Chủ kho; hãy xóa hoặc sửa hồ sơ người nhận đó trước.",
  WRONG_PERSON: "Giấy tờ không khớp với danh tính đã gắn cho tài khoản này.",
};

/** Reason-specific messages for CHECKIN_NOT_ALLOWED (Executor điểm danh thay chủ kho) */
const checkInNotAllowedReasons: Record<string, string> = {
  PLAN_NOT_OVERDUE: "Chủ kho không còn quá hạn điểm danh. Tải lại để xem trạng thái mới nhất.",
  DEATH_CASE_OPEN: "Kho đã có hồ sơ chứng tử đang mở nên không điểm danh thay được nữa.",
};

const reasonMessages: Record<string, Record<string, string>> = {
  CHECKIN_NOT_ALLOWED: checkInNotAllowedReasons,
  HANDOVER_NOT_ALLOWED: handoverNotAllowedReasons,
  EXECUTOR_NOT_ALLOWED: executorNotAllowedReasons,
  ASSET_IN_USE: assetInUseReasons,
  VAULT_NOT_EDITABLE: vaultNotEditableReasons,
  DEATH_CASE_NOT_ALLOWED: deathCaseNotAllowedReasons,
  PAYMENT_NOT_ALLOWED: paymentNotAllowedReasons,
  PAYMENT_ORDER_NOT_PAYABLE: paymentOrderNotPayableReasons,
  EKYC_SERVICE_UNAVAILABLE: ekycServiceUnavailableReasons,
  EKYC_IDENTITY_MISMATCH: ekycIdentityMismatchReasons,
};

/** 401 nhưng phiên còn sống (BE mục 6.2a, 6.4). */
const reauthCodes = new Set([
  "INVALID_TWO_FACTOR_CODE",
  "REAUTHENTICATION_FAILED",
  "INVALID_GOOGLE_TOKEN",
]);

const messages: Record<string, string> = {
  REAUTHENTICATION_FAILED: "Mật khẩu hiện tại chưa đúng. Bạn nhập lại rồi thử tiếp.",
  INVALID_GOOGLE_TOKEN:
    "Đăng nhập Google chưa hợp lệ hoặc không phải tài khoản Google đã liên kết. Thử lại bằng đúng tài khoản.",
  GOOGLE_ACCOUNT_ALREADY_LINKED:
    "Tài khoản Google này đã được dùng ở một tài khoản LegacyVault khác. Hãy chọn tài khoản Google khác.",
  LAST_LOGIN_METHOD: "Đây là phương thức đăng nhập cuối cùng nên không thể gỡ.",
  LOGIN_METHOD_ALREADY_EXISTS: "Tài khoản đã có mật khẩu. Tải lại để xem trạng thái mới nhất.",
  INVALID_TWO_FACTOR_CODE:
    "Mã chưa đúng hoặc đã dùng. Kiểm tra mã đang hiện trên ứng dụng xác thực rồi thử lại.",
  TWO_FACTOR_ALREADY_ENABLED: "Xác thực hai bước đã được bật. Tải lại để xem trạng thái.",
  TWO_FACTOR_SETUP_REQUIRED: "Cần tạo khóa mới trước khi xác nhận. Bắt đầu lại từ bước tạo khóa.",
  TWO_FACTOR_NOT_ENABLED: "Xác thực hai bước chưa được bật. Tải lại để xem trạng thái.",
  TWO_FACTOR_ADMIN_ONLY: "Chỉ tài khoản quản trị mới dùng được xác thực hai bước.",
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
  ASSET_IN_USE: "Tài sản đang được sử dụng nên chưa xóa được.",
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
  CONTAINER_REMOVED: "Gói bàn giao đã bị xóa, không thể chỉnh sửa.",
  ASSET_ALREADY_IN_CONTAINER: "Tài sản đang nằm trong một gói khác.",
  PLAN_DEACTIVATION_CONFIRMATION_REQUIRED:
    "Thao tác này sẽ đưa kế hoạch về nháp. Đọc cảnh báo và xác nhận trước khi tiếp tục.",
  BENEFICIARY_IDENTITY_CONFLICT:
    "Số CCCD này đã tồn tại trong danh sách người nhận của kho (với thông tin khác). Vui lòng kiểm tra lại.",
  BENEFICIARY_IN_USE: "Người nhận đang được gắn vào gói. Hãy gỡ khỏi các gói trước.",
  BENEFICIARY_SLOTS_EXCEEDED: "Kho không còn suất người nhận.",
  CHECKIN_NOT_ALLOWED: "Kế hoạch hiện không cho phép điểm danh.",
  EKYC_IMAGE_REJECTED:
    "Ảnh chưa đáp ứng yêu cầu xác minh. Hãy chọn ảnh rõ, đúng mặt giấy tờ hoặc selfie rồi thử lại.",
  EKYC_DOCUMENT_EXPIRED: "Bước giấy tờ đã hết hạn hoặc đã được dùng. Bắt đầu lại với ảnh giấy tờ.",
  EKYC_BACK_REQUIRED: "Cần chụp và gửi mặt sau giấy tờ trước khi tiếp tục.",
  EKYC_CONSENT_REQUIRED:
    "Cần đồng ý điều khoản xác minh trước khi tiếp tục. Bắt đầu lại từ bước đồng ý.",
  EKYC_DOCUMENT_MISMATCH:
    "Mặt trước và mặt sau không khớp. Kiểm tra ảnh và gửi lại cùng một giấy tờ.",
  EKYC_IDENTITY_MISMATCH: "Giấy tờ không khớp hoặc số CCCD này đã được sử dụng trong hệ thống.",
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
  PAYMENT_NOT_ALLOWED: "Chưa thể mua dịch vụ lúc này. Tải lại để kiểm tra trạng thái kho.",
  PAYMENT_ORDER_PENDING:
    "Kho đang có một đơn chờ thanh toán khác. Hãy hoàn tất hoặc hủy đơn đó trước khi tạo đơn mới.",
  PAYMENT_ORDER_NOT_PAYABLE: "Đơn này không còn thanh toán được. Tải lại để xem trạng thái.",
  PAYMENT_ORDER_NOT_FOUND: "Không tìm thấy đơn thanh toán của kho này.",
  CONTENT_INTEGRITY_FAILED:
    "Không thể xác nhận tính toàn vẹn của nội dung. Vui lòng liên hệ hỗ trợ.",
  VAULT_PIN_NOT_SET: "Kho đã có tài sản nên cần đặt mã PIN trước khi tiếp tục.",
  VAULT_PIN_ALREADY_SET: "Kho đã có mã PIN. Dùng chức năng đổi mã PIN.",
  VAULT_PIN_REQUIRED: "Thao tác này cần nhập mã PIN của kho.",
  INVALID_VAULT_PIN: "Mã PIN chưa đúng.",
  VAULT_PIN_LOCKED: "Mã PIN đang bị khóa tạm vì nhập sai nhiều lần. Vui lòng thử lại sau.",
  VAULT_PIN_TOO_WEAK:
    "Mã PIN quá dễ đoán. Không dùng các số giống nhau hoặc dãy số liên tiếp (111111, 123456...).",
  VAULT_PIN_RESET_NEEDS_PASSWORD:
    "Tài khoản của bạn chưa có mật khẩu nên chưa đặt lại mã PIN được. Hãy đặt mật khẩu ở mục Phương thức đăng nhập trước.",
};

/**
 * Chỉ hiển thị thông báo do FE quản lý; không đưa exception/body nhạy cảm ra UI. Ngoại lệ: VALIDATION_ERROR hiện
 * câu lỗi tiếng Việt cụ thể của Backend (xem validationMessages) để người dùng biết trường nào sai.
 */
export function privateActionError(error: unknown): string {
  if (isAxiosError<unknown>(error)) {
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT)
      return "Máy chủ phản hồi quá lâu. Tải lại danh sách để kiểm tra kết quả trước khi gửi lại.";
    if (!error.response)
      return "Không kết nối được máy chủ. Kiểm tra kết nối và tải lại danh sách trước khi gửi lại.";
    const status = error.response.status;
    // Các mã 401 này là lỗi xác thực lại/nhập mã, phiên vẫn còn: không được báo hết phiên.
    const reauthCode = problem.safeParse(error.response.data).data?.code;
    if (status === HTTP_STATUS.UNAUTHORIZED && reauthCode && reauthCodes.has(reauthCode))
      return messages[reauthCode];
    if (status === HTTP_STATUS.UNAUTHORIZED) return "Phiên đã hết hạn. Vui lòng đăng nhập lại.";
    if (status === HTTP_STATUS.PAYLOAD_TOO_LARGE)
      return "Tệp vượt quá giới hạn tải lên của máy chủ.";
    if (status === HTTP_STATUS.TOO_MANY_REQUESTS)
      return "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.";
    const parsed = problem.safeParse(error.response?.data);
    const code = parsed.success ? parsed.data.code : undefined;
    const reasonOnServerError =
      status === HTTP_STATUS.SERVICE_UNAVAILABLE &&
      code === "HANDOVER_NOT_ALLOWED" &&
      parsed.success &&
      parsed.data.reason === "INVITATION_SEND_FAILED";
    if (
      status >= HTTP_STATUS.INTERNAL_SERVER_ERROR &&
      !(status === HTTP_STATUS.SERVICE_UNAVAILABLE && code === "EKYC_SERVICE_UNAVAILABLE") &&
      !reasonOnServerError
    )
      return "Máy chủ đang gặp sự cố. Tải lại để kiểm tra kết quả; nếu lỗi tiếp diễn, vui lòng liên hệ hỗ trợ.";
    const reason = parsed.success ? parsed.data.reason : undefined;
    if (code && reason) {
      const byReason = reasonMessages[code];
      if (byReason && Object.hasOwn(byReason, reason)) return byReason[reason];
    }
    const missing = parsed.success ? (parsed.data.missingRequirements ?? []) : [];
    const missingMessage = missing.find((item) => Object.hasOwn(missingRequirementMessages, item));
    if (code === "DEATH_CASE_INCOMPLETE" && missingMessage)
      return missingRequirementMessages[missingMessage];
    if (code === "VALIDATION_ERROR") {
      const specific = validationMessages(parsed.success ? parsed.data.errors : undefined);
      if (specific.length > 0) return specific.join(" ");
    }
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
 * Trích xuất map lỗi theo trường từ response 400 (ProblemDetails / ValidationProblemDetails).
 * Chuẩn hóa tên trường về camelCase và bỏ các tiền tố như $. hoặc request.
 */
export function extractValidationFieldErrors(error: unknown): Record<string, string[]> {
  if (!isAxiosError(error) || !error.response?.data) return {};
  const data = error.response.data as Record<string, unknown>;
  const parsed = problem.safeParse(data);
  const rawErrors =
    parsed.success && parsed.data.errors
      ? parsed.data.errors
      : (data.errors as Record<string, unknown> | undefined);
  if (!rawErrors || typeof rawErrors !== "object") return {};

  const result: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(rawErrors)) {
    const trimmed = key.replace(/^\$\.?|^request\./, "");
    const lastDot = trimmed.lastIndexOf(".");
    const leaf = lastDot >= 0 ? trimmed.substring(lastDot + 1) : trimmed;
    const normalizedKey = leaf.length > 0 ? leaf[0].toLowerCase() + leaf.substring(1) : leaf;

    if (Array.isArray(val)) {
      result[normalizedKey] = val.map((v) => String(v));
    } else if (typeof val === "string") {
      result[normalizedKey] = [val];
    }
  }
  return result;
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
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
    onFailure?: (error: unknown, fieldErrors: Record<string, string[]>) => void,
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
    setFieldErrors({});
    setSucceeded(false);
    try {
      const result = await operation();
      if (!current()) return false;
      publish(result);
      setSucceeded(true);
      return true;
    } catch (failure) {
      if (current()) {
        const extracted = extractValidationFieldErrors(failure);
        setError(privateActionError(failure));
        setFieldErrors(extracted);
        if (onFailure) {
          onFailure(failure, extracted);
        }
      }
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  /** Xoá feedback (thành công/lỗi/ký trường) để UI không hiển thị thông báo cũ; không chạm `pending`. */
  function reset() {
    setError("");
    setFieldErrors({});
    setSucceeded(false);
  }
  return { execute, reset, pending, error, fieldErrors, succeeded };
}
