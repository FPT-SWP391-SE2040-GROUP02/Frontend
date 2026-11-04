/**
 * Chu kỳ tự động refetch (polling) theo mili-giây cho các luồng nghiệp vụ.
 * Quy tắc:
 * - FAST (10s): Cho các luồng theo dõi trạng thái nhảy liên tục (DMS Heartbeat, Death Case status, Handover progress).
 * - NORMAL (20s): Cho các màn hình danh sách nghiệp vụ (Verifier review cases, Executor claims, My invitations, Admin dashboard & incidents).
 * - SLOW (60s): Cho dữ liệu cấu hình hoặc ít biến động (System configs, plans).
 */
export const POLLING_INTERVAL = {
  FAST: 10_000,
  NORMAL: 20_000,
  SLOW: 60_000,
} as const;

export type PollingInterval = (typeof POLLING_INTERVAL)[keyof typeof POLLING_INTERVAL];
