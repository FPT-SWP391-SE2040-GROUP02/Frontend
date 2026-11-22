import type { DevEkycReset, DevRewindBeforeEkyc } from "./devTools.schema";

/** Nhãn trạng thái kế hoạch theo PlanStatus của Backend; giá trị lạ hiện nguyên chuỗi. */
const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang hoạt động",
  HANDOVER_REQUESTED: "Đang lập biên bản",
  HANDOVER_IN_PROGRESS: "Đang bàn giao",
  BLOCKED: "Bị chặn",
  CLOSED: "Đã đóng",
};

export function planStatusLabel(status: string) {
  return Object.hasOwn(PLAN_STATUS_LABELS, status) ? PLAN_STATUS_LABELS[status] : status;
}

export const DEV_TOOLS_NOTICE =
  "Trang này chỉ có ở môi trường Development và chỉ quản trị viên dùng được. Bản chạy thật không có. Mọi thao tác được ghi vào nhật ký hoạt động.";

export const EKYC_RESET_DESCRIPTION =
  "Đưa một tài khoản về lúc vừa đăng ký và đăng nhập được: xóa toàn bộ eKYC và xóa hẳn kho của tài khoản cùng mọi thứ trong kho (tài sản, gói, người nhận, Người thực thi, kế hoạch, biên bản bàn giao, bàn giao, thanh toán, tệp mã hóa). Email, mật khẩu, vai trò và vai Người thực thi ở kho người khác giữ nguyên.";

/** Thông báo sau khi đặt lại; chỉ dùng số lượng máy chủ trả về. */
export function ekycResetDone(result: DevEkycReset) {
  const removedNothing =
    result.verificationsRemoved === 0 &&
    result.consentsRemoved === 0 &&
    !result.identityRemoved &&
    result.faceTemplatesRemoved === 0 &&
    !result.vaultRemoved;
  if (removedNothing)
    return `Tài khoản ${result.email} chưa có eKYC và chưa có kho, không có gì để xóa.`;
  const vaultPart = result.vaultRemoved
    ? `, xóa kho cùng toàn bộ dữ liệu trong kho và ${result.filesRemoved} tệp mã hóa`
    : "";
  return `Đã đặt lại ${result.email} về lúc vừa đăng ký: xóa ${result.verificationsRemoved} lượt xác minh, ${result.consentsRemoved} lần đồng ý${result.identityRemoved ? ", danh tính đã gắn" : ""}${result.faceTemplatesRemoved > 0 ? ", mẫu khuôn mặt" : ""}${vaultPart}. Tài khoản đăng nhập lại để tạo kho, làm eKYC và mua gói từ đầu.`;
}

export const REWIND_DESCRIPTION =
  "Đưa kho đang chọn về thời điểm ngay trước bước xác minh danh tính và mua gói: xóa eKYC của Chủ kho, trả gói dịch vụ về Free và hủy đơn thanh toán đang chờ. Đơn đã trả, tài sản, người nhận, gói tài sản và Người thực thi giữ nguyên. Chỉ dùng khi kế hoạch còn Nháp.";

export const EKYC_PAUSE_DESCRIPTION =
  "Bật khi cần chạy thử cả luồng mà không có giấy tờ thật hay camera: mọi bước eKYC (giấy tờ, thử thách camera, so khớp khuôn mặt) đều tự đạt. Người nhận được đọc ra đúng họ tên và số CCCD chủ kho đã khai; chủ kho nhận một số CCCD thử riêng cho từng tài khoản. Chỉ ở bộ nhớ máy chủ, khởi động lại là về tắt. Nhớ tắt sau khi thử xong.";

export function ekycPauseDone(paused: boolean) {
  return paused
    ? "Đã tạm ngừng eKYC: các bước xác minh danh tính sẽ tự đạt cho tới khi bạn tắt."
    : "Đã bật lại eKYC thật.";
}

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
