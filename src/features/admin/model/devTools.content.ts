import type {
  DevClock,
  DevEkycReset,
  DevMilestoneKey,
  DevRewindBeforeEkyc,
} from "./devTools.schema";

/** Nội dung từng mốc trên màn hình công cụ thử nghiệm, theo thứ tự từ trên xuống. */
export const DEV_MILESTONES: Record<
  DevMilestoneKey,
  { title: string; description: string; code?: string; effect: string; done: string }
> = {
  CHECKIN_OVERDUE: {
    title: "Quá hạn điểm danh",
    description: "Đưa kỳ điểm danh hiện tại sang “Quá hạn”, vẫn còn thời gian chờ.",
    code: "CHECKIN_OVERDUE",
    effect: "chuyển kỳ điểm danh hiện tại sang quá hạn, vẫn còn thời gian chờ",
    done: "Đã tua tới “Quá hạn điểm danh”. Chủ kho thấy trạng thái quá hạn. Có thể tua tiếp mốc kế.",
  },
  GRACE_ENDED: {
    title: "Hết thời gian chờ",
    description: "Đưa sang bước kiểm tra và mở sự cố cho Người thực hiện.",
    code: "AWAITING_CHECK",
    effect: "chuyển sang bước kiểm tra và mở sự cố cho Người thực hiện",
    done: "Đã tua tới “Hết thời gian chờ”. Sự cố đã mở cho Người thực hiện. Có thể tua tiếp mốc kế.",
  },
  OBJECTION_WINDOW_ENDED: {
    title: "Hết 72 giờ phản đối",
    description: "Cho Người xét duyệt duyệt được hồ sơ chứng tử ngay.",
    effect: "hết 72 giờ phản đối để Người xét duyệt duyệt được hồ sơ chứng tử ngay",
    done: "Đã tua tới “Hết 72 giờ phản đối”. Người xét duyệt có thể duyệt hồ sơ.",
  },
  SELFIE_DEADLINE_PASSED: {
    title: "Hết hạn selfie 7 ngày",
    description: "Cho Người xét duyệt kết luận “còn sống” khi không có eKYC thật.",
    effect: "hết hạn gửi selfie 7 ngày để Người xét duyệt kết luận lời báo còn sống",
    done: "Đã tua tới “Hết hạn selfie 7 ngày”. Người xét duyệt có thể kết luận lời báo còn sống.",
  },
};

/** Nhãn trạng thái kế hoạch theo PlanStatus của Backend; giá trị lạ hiện nguyên chuỗi. */
const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang hoạt động",
  CHECKIN_OVERDUE: "Quá hạn điểm danh",
  AWAITING_CHECK: "Chờ kiểm tra",
  DEATH_CASE_OPEN: "Đang xử lý chứng tử",
  HANDOVER_IN_PROGRESS: "Đang bàn giao",
  BLOCKED: "Bị chặn",
  CLOSED: "Đã đóng",
};

export function planStatusLabel(status: string) {
  return Object.hasOwn(PLAN_STATUS_LABELS, status) ? PLAN_STATUS_LABELS[status] : status;
}

export const CHECK_IN_STATE_LABELS: Record<DevClock["checkInState"], string> = {
  ON_TIME: "Đúng hạn",
  OVERDUE: "Quá hạn",
  NOT_RUNNING: "Không chạy",
};

export const CLOCK_STATE_LABELS: Record<DevClock["clockState"], string> = {
  REAL_TIME: "Thời gian thực",
  SHIFTED: "Đã tua",
};

export const DEV_TOOLS_NOTICE =
  "Trang này chỉ có ở môi trường Development và chỉ quản trị viên dùng được. Bản chạy thật không có. Mọi thao tác được ghi vào nhật ký kiểm toán.";

export const DEV_TOOLS_FOOTNOTE =
  "Tua theo thứ tự từ trên xuống. “Về thời gian hiện tại” đưa đồng hồ của hồ sơ về thời gian thực; trạng thái đã phát sinh khi tua được giữ nguyên.";

export const RESET_DONE =
  "Đồng hồ của hồ sơ đã về thời gian hiện tại. Trạng thái đã phát sinh được giữ nguyên.";

export const EKYC_RESET_DESCRIPTION =
  "Xóa toàn bộ dữ liệu eKYC của một tài khoản (lượt xác minh, đồng ý chụp ảnh, danh tính đã gắn, mẫu khuôn mặt) để làm lại eKYC từ đầu, kể cả với CCCD khác. Email, vai trò, kho và vai Người thực hiện giữ nguyên.";

/** Thông báo sau khi đặt lại; chỉ dùng số lượng máy chủ trả về. */
export function ekycResetDone(result: DevEkycReset) {
  const removedNothing =
    result.verificationsRemoved === 0 &&
    result.consentsRemoved === 0 &&
    !result.identityRemoved &&
    result.faceTemplatesRemoved === 0;
  if (removedNothing) return `Tài khoản ${result.email} chưa có dữ liệu eKYC, không có gì để xóa.`;
  return `Đã đặt lại eKYC của ${result.email}: xóa ${result.verificationsRemoved} lượt xác minh, ${result.consentsRemoved} lần đồng ý${result.identityRemoved ? ", danh tính đã gắn" : ""}${result.faceTemplatesRemoved > 0 ? ", mẫu khuôn mặt" : ""}. Tài khoản có thể làm lại eKYC.`;
}

export const REWIND_DESCRIPTION =
  "Đưa kho đang chọn về thời điểm ngay trước bước xác minh danh tính và mua gói: xóa eKYC của Chủ kho, trả gói dịch vụ về Free và hủy đơn thanh toán đang chờ. Đơn đã trả, tài sản, người nhận, gói tài sản và Người thực hiện giữ nguyên. Chỉ dùng khi kế hoạch còn Nháp.";

export const EKYC_THRESHOLD_DESCRIPTION =
  "Ngưỡng cao (> 0.45) tăng cường bảo mật chống giả mạo nhưng khắt khe hơn. Ngưỡng thấp (< 0.30) hỗ trợ nhận diện dễ hơn trong điều kiện thiếu sáng hoặc camera độ phân giải thấp.";

export function ekycThresholdDone(result: { currentThreshold: number }) {
  return `Đã cập nhật ngưỡng so khớp khuôn mặt eKYC về ${result.currentThreshold.toFixed(3)}. Áp dụng ngay cho các lượt so khớp kế tiếp (bộ nhớ, chưa lưu DB).`;
}

export function ekycThresholdResetDone(defaultThreshold: number) {
  return `Đã đặt lại ngưỡng so khớp về giá trị mặc định ${defaultThreshold.toFixed(3)} (chuẩn khuyến nghị của mô hình InsightFace).`;
}

/** Thông báo sau khi đưa kho về trước eKYC; chỉ dùng số lượng máy chủ trả về. */
export function rewindDone(result: DevRewindBeforeEkyc) {
  const ekycRemoved =
    result.verificationsRemoved > 0 ||
    result.consentsRemoved > 0 ||
    result.identityRemoved ||
    result.faceTemplatesRemoved > 0;
  const changed = ekycRemoved || result.entitlementReset || result.pendingOrdersCancelled > 0;
  if (!changed) {
    return `Kho của ${result.ownerEmail} đã ở trước bước eKYC và mua gói, không có gì để đổi.`;
  }
  const parts: string[] = [];
  if (ekycRemoved) parts.push("xóa eKYC");
  if (result.entitlementReset) parts.push(`trả gói ${result.previousTier} về Free`);
  if (result.pendingOrdersCancelled > 0) {
    parts.push(`hủy ${result.pendingOrdersCancelled} đơn đang chờ`);
  }
  return `Đã đưa kho của ${result.ownerEmail} về trước eKYC và mua gói: ${parts.join(", ")}. Chủ kho có thể làm eKYC rồi mua gói lại.`;
}
