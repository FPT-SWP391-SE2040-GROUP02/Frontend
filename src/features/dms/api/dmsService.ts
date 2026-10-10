import type { DmsState, DmsHeartbeatConfig, PingHistoryItem } from "../model/dms.types";
import type { DmsConfigFormInput, PingRequestInput } from "../model/dms.schema";
import type { ApiResponse } from "@/shared/types";

/**
 * @file dmsService.ts
 * @description Tầng dịch vụ giao tiếp API cho module Dead Man's Switch (DMS Heartbeat & Proof-of-Life).
 * Tuân thủ quy tắc 7 (Scaffold with TODO) và quy tắc 8 (JSDoc chuẩn chỉ).
 */


/**
 * Lấy trạng thái thời gian thực của Dead Man's Switch
 * @description Truy xuất thông tin chu kỳ, hạn chót ping tiếp theo, số ngày còn lại và chữ ký ECDSA P-256.
 * @returns {Promise<DmsState>} Trạng thái hiện tại của hệ sinh thái DMS
 * @example
 * const state = await dmsService.getDmsStatus();
 * console.log(state.status, state.daysRemaining);
 */
export async function getDmsStatus(): Promise<DmsState> {
  // TODO: [P2][CHECKIN-01] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Migrate DMS status mock sang check-in đúng contract.
  // 2. [INPUT & OUTPUT]: GET /check-ins/me -> state/lastCheckInAt/nextDueAt/grace/serverTime.
  // 3. [CÁC BƯỚC]: Sau AUTH-02/VAULT-01 chốt DTO với BE3; schema -> service -> hooks -> adapter; bỏ fallback mock ở luồng thật.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, Zod, TanStack Query, entity adapters.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không biến 500/404 thành đang an toàn; countdown không đổi deadline; hết kỳ không tự cấp grant; không ký seal ECDSA ở FE.
  return {
    status: "ACTIVE",
    lastPingAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nextPingDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 25,
    hoursRemaining: 14,
    integritySealHash: "0x3f8a9e21...ecdsa_p256_verified_proof_of_life_anchor",
    config: {
      checkIntervalDays: 30,
      gracePeriodDays: 14,
      reminderFrequencyDays: 3,
      notifyExecutorOnGracePeriod: true,
      channels: [
        { type: "EMAIL", enabled: true, targetValue: "nguyenvana@gmail.com" },
        { type: "TELEGRAM", enabled: true, targetValue: "@vana_legacy" },
        { type: "SMS", enabled: false, targetValue: "+84988123456" },
        { type: "VOICE_CALL", enabled: false, targetValue: "+84988123456" },
      ],
    },
  };
}

/**
 * Gửi nhịp xung sinh tồn (⚡ Proof-of-Life Heartbeat Ping)
 * @description Reset chu kỳ đếm ngược và ký mã băm xác nhận sự hiện diện của chủ tài khoản.
 * @param {PingRequestInput} [_payload] Thông tin nguồn xác nhận (Web, Email, Telegram)
 * @returns {Promise<ApiResponse<{ nextPingDeadline: string; integritySealHash: string }>>}
 * @example
 * const result = await dmsService.sendPulsePing({ source: "WEB" });
 */
export async function sendPulsePing(
  _payload?: PingRequestInput
): Promise<ApiResponse<{ nextPingDeadline: string; integritySealHash: string }>> {
  // TODO: [P2][CHECKIN-02] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Nối xác nhận định kỳ không optimistic.
  // 2. [INPUT & OUTPUT]: Payload BE đã chốt -> kỳ mới và thời gian server từ POST /check-ins.
  // 3. [CÁC BƯỚC]: Sau CHECKIN-01 disable nút pending; gửi một lần; chờ response rồi invalidate status/history; không tự tính deadline bằng Date.now.
  // 4. [HÀM / THƯ VIỆN]: useMutation, shared transport, queryKeys, schema DTO.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: 429/double-submit/expired/hold; không gửi khi mở trang; heartbeat không thay alive-report/eKYC; lỗi giữ dữ liệu trước đó.
  const nextDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return {
    success: true,
    message: "Xác nhận nhịp sinh tồn thành công! Đồng hồ đếm ngược đã được đặt lại.",
    data: {
      nextPingDeadline: nextDeadline,
      integritySealHash: `0x${Math.random().toString(16).slice(2, 10)}...ecdsa_p256_anchor`,
    },
  };
}

/**
 * Cập nhật cấu hình Dead Man's Switch (Heartbeat Interval & Grace Period)
 * @description Thiết lập chu kỳ kiểm tra, thời gian ân hạn và các kênh liên lạc khẩn cấp.
 * @param {DmsConfigFormInput} config Dữ liệu cấu hình mới đã qua Zod validation
 * @returns {Promise<ApiResponse<DmsHeartbeatConfig>>}
 * @example
 * await dmsService.updateDmsConfig({ checkIntervalDays: 60, gracePeriodDays: 14, ... });
 */
export async function updateDmsConfig(
  config: DmsConfigFormInput
): Promise<ApiResponse<DmsHeartbeatConfig>> {
  // TODO: [P2][CHECKIN-03] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Nối cấu hình chu kỳ/kênh theo policy BE.
  // 2. [INPUT & OUTPUT]: Form/version -> config và kỳ áp dụng từ PATCH /vaults/me/check-in-settings.
  // 3. [CÁC BƯỚC]: Sau CHECKIN-01 migrate PUT /dms/config; RHF/Zod; xử lý validation/version; invalidate sau thành công.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, React Hook Form, Zod, TanStack Query.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không tự đổi lịch hiện tại ở FE; policy kỳ tiếp theo do BE; concurrency/429; không tự chọn Hangfire/Quartz thay contract.
  return {
    success: true,
    message: "Cập nhật cấu hình Dead Man's Switch thành công!",
    data: config as DmsHeartbeatConfig,
  };
}

/**
 * Truy xuất lịch sử các lần xác nhận sinh tồn
 * @description Lấy danh sách audit trail của các lần ping để kiểm tra tính minh bạch.
 * @returns {Promise<PingHistoryItem[]>}
 * @example
 * const history = await dmsService.getPingHistory();
 */
export async function getPingHistory(): Promise<PingHistoryItem[]> {
  // TODO: [P2][CHECKIN-04] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Đọc lịch sử check-in có phân trang đúng quyền.
  // 2. [INPUT & OUTPUT]: Query lịch sử đã được BE chốt -> DTO/data/meta -> ViewModel.
  // 3. [CÁC BƯỚC]: Sau CHECKIN-01 chốt route lịch sử; không mặc định /dms/history; hook enabled khi mở lịch sử và session sẵn sàng; adapter format.
  // 4. [HÀM / THƯ VIỆN]: TanStack Query enabled/queryKeys, shared transport, entity adapters.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không tải lịch sử khi modal đóng; không trả IP/địa điểm mẫu như thật; empty/error rõ ràng; cache tách account.
  return [
    {
      id: "ping-1",
      pingedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      source: "WEB",
      ipAddress: "118.69.182.204 (TP. Hồ Chí Minh)",
      userAgent: "Chrome 128.0 / Windows 11",
      status: "SUCCESS",
    },
    {
      id: "ping-2",
      pingedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      source: "TELEGRAM",
      ipAddress: "Telegram Bot Gateway",
      status: "SUCCESS",
    },
    {
      id: "ping-3",
      pingedAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
      source: "EMAIL_LINK",
      ipAddress: "14.241.233.105 (Hà Nội)",
      status: "SUCCESS",
    },
  ];
}

/**
 * Tạm dừng hoặc tiếp tục Dead Man's Switch (Chế độ Vacation Mode / Bảo trì)
 * @description Cho phép chủ sở hữu tạm dừng kích hoạt bàn giao di sản trong khoảng thời gian xác định (ví dụ đi du lịch vùng không có mạng).
 * @param {boolean} isPaused Trạng thái tạm dừng
 * @returns {Promise<ApiResponse<{ isPaused: boolean }>>}
 */
export async function toggleDmsPause(isPaused: boolean): Promise<ApiResponse<{ isPaused: boolean }>> {
  // TODO: [P3][CHECKIN-05] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Rà bỏ toggle-pause/vacation legacy nếu ngoài phạm vi SRS.
  // 2. [INPUT & OUTPUT]: Các caller isPaused -> quyết định loại UI/service hoặc contract được phê duyệt.
  // 3. [CÁC BƯỚC]: Sau CHECKIN-03 xác nhận scope với BE3; bỏ toggle nếu không có; chỉ migrate khi có policy/endpoint được chốt.
  // 4. [HÀM / THƯ VIỆN]: rg callers, TypeScript, schema/hook DMS hiện có.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không yêu cầu POST /dms/toggle-pause chỉ vì mock tồn tại; không giả pause thành công; không dùng pause để bỏ qua deadline/hold/grant.
  return {
    success: true,
    message: isPaused ? "Đã bật chế độ tạm dừng DMS (Vacation Mode)" : "Đã kích hoạt lại nhịp sinh tồn DMS",
    data: { isPaused },
  };
}

export const dmsService = {
  getDmsStatus,
  sendPulsePing,
  updateDmsConfig,
  getPingHistory,
  toggleDmsPause,
};
