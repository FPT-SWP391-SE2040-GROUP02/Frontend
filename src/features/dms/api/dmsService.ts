import type {
  DmsState,
  DmsHeartbeatConfig,
  PingHistoryItem,
} from "../model/dms.types";
import type { DmsConfigFormInput, PingRequestInput } from "../model/dms.schema";
import type { ApiResponse } from "@/shared/types";

/**
 * @file dmsService.ts
 * @description Tầng dịch vụ giao tiếp API cho module Dead Man's Switch (DMS Heartbeat & Proof-of-Life).
 * Tuân thủ quy tắc 7 (Scaffold with TODO) và quy tắc 8 (JSDoc chuẩn chỉ).
 */

const DMS_ENDPOINT = "/dms";

/**
 * Lấy trạng thái thời gian thực của Dead Man's Switch
 * @description Truy xuất thông tin chu kỳ, hạn chót ping tiếp theo, số ngày còn lại và chữ ký ECDSA P-256.
 * @returns {Promise<DmsState>} Trạng thái hiện tại của hệ sinh thái DMS
 * @example
 * const state = await dmsService.getDmsStatus();
 * console.log(state.status, state.daysRemaining);
 */
export async function getDmsStatus(): Promise<DmsState> {
  // TODO: [Developer Step]
  // 1. Gọi GET /dms/status qua axiosClient
  // 2. Chuyển đổi dữ liệu trả về theo DTO DmsState
  // 3. Fallback mock state nếu đang ở môi trường dev chưa có backend C#
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
 * @param {PingRequestInput} [payload] Thông tin nguồn xác nhận (Web, Email, Telegram)
 * @returns {Promise<ApiResponse<{ nextPingDeadline: string; integritySealHash: string }>>}
 * @example
 * const result = await dmsService.sendPulsePing({ source: "WEB" });
 */
export async function sendPulsePing(
  payload?: PingRequestInput
): Promise<ApiResponse<{ nextPingDeadline: string; integritySealHash: string }>> {
  // TODO: [Developer Step]
  // 1. Gọi POST /dms/pulse với payload { source: payload?.source || 'WEB', clientTimestamp: new Date().toISOString() }
  // 2. Backend C# sẽ reset NextHeartbeatDeadline = Now + IntervalDays
  // 3. Backend tính toán lại ECDSA P-256 seal và trả về kết quả
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
  // TODO: [Developer Step]
  // 1. Gọi PUT /dms/config với body config
  // 2. Cập nhật cơ sở dữ liệu và lên lịch lại Hangfire / Quartz background job trên C# Backend
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
  // TODO: [Developer Step]
  // 1. Gọi GET /dms/history qua axiosClient
  // 2. Trả về mảng PingHistoryItem đã format
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
  // TODO: [Developer Step]
  // 1. Gọi POST /dms/toggle-pause với body { isPaused }
  // 2. Cảnh báo bảo mật cấp cao yêu cầu xác thực OTP 2FA trước khi cho phép tạm dừng
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
