import { APP_MESSAGES } from "@/shared/constants";

/** Legacy contracts retained for callers; no fixture or simulated successful operation. */

// TODO: Integrate only after matching the official Backend DTOs and permission rules.

// Input/output: typed signatures below; no fixture fallback.

// Steps: confirm contract, validate schema, call service, publish confirmed result through hooks.

// API/library: existing official services, Zod and TanStack Query; do not invent endpoints.

// Edges: auth failures, missing resources, version conflicts and duplicate writes must remain errors.

import type { DmsHeartbeatConfig, DmsState, PingHistoryItem } from "../model/dms.types";

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
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Gửi nhịp xung sinh tồn (⚡ Proof-of-Life Heartbeat Ping)
 * @description Reset chu kỳ đếm ngược và ký mã băm xác nhận sự hiện diện của chủ tài khoản.
 * @param {PingRequestInput} [_payload] Thông tin nguồn xác nhận (Web, Email, Telegram)
 * @returns {Promise<ApiResponse<{ nextPingDeadline: string; integritySealHash: string }>>}
 * @example
 * const result = await dmsService.sendPulsePing({ source: "WEB" });
 */
export async function sendPulsePing(__payload?: PingRequestInput): Promise<
  ApiResponse<{
    nextPingDeadline: string;
    integritySealHash: string;
  }>
> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
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
  _config: DmsConfigFormInput,
): Promise<ApiResponse<DmsHeartbeatConfig>> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Truy xuất lịch sử các lần xác nhận sinh tồn
 * @description Lấy danh sách audit trail của các lần ping để kiểm tra tính minh bạch.
 * @returns {Promise<PingHistoryItem[]>}
 * @example
 * const history = await dmsService.getPingHistory();
 */
export async function getPingHistory(): Promise<PingHistoryItem[]> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Tạm dừng hoặc tiếp tục Dead Man's Switch (Chế độ Vacation Mode / Bảo trì)
 * @description Cho phép chủ sở hữu tạm dừng kích hoạt bàn giao di sản trong khoảng thời gian xác định (ví dụ đi du lịch vùng không có mạng).
 * @param {boolean} isPaused Trạng thái tạm dừng
 * @returns {Promise<ApiResponse<{ isPaused: boolean }>>}
 */
export async function toggleDmsPause(_isPaused: boolean): Promise<
  ApiResponse<{
    isPaused: boolean;
  }>
> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

export const dmsService = {
  getDmsStatus,
  sendPulsePing,
  updateDmsConfig,
  getPingHistory,
  toggleDmsPause,
};
