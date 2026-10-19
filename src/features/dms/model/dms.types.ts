/**
 * @file dms.types.ts
 * @description Định nghĩa các kiểu dữ liệu DTO và Entity cho hệ sinh thái Dead Man's Switch (DMS Pulse Check-in).
 */

/**
 * Các trạng thái vòng đời của Dead Man's Switch
 */
export type DmsStatus =
  | "ACTIVE"
  | "CHECKIN_PENDING"
  | "CHECKIN_SUSPENDED" // Tạm treo 90 ngày sau khi hết thời gian chờ (SRS 3.11.0 - DMS-04)
  | "FROZEN_INACTIVITY" // Đóng băng kho do bất hoạt sau 90 ngày không phản hồi (DMS-09)
  | "WARNING"
  | "GRACE_PERIOD"
  | "TRIGGERED"
  | "PAUSED";

/**
 * Kênh gửi thông báo nhắc nhở nhịp sinh tồn
 */
export type NotificationChannelType = "EMAIL" | "SMS" | "TELEGRAM" | "VOICE_CALL";

export interface NotificationChannelConfig {
  type: NotificationChannelType;
  enabled: boolean;
  targetValue: string; // email hoặc số điện thoại hoặc telegram chat_id
}

/**
 * @description Cấu hình chu kỳ kiểm tra sinh tồn (DMS Heartbeat Settings)
 */
export interface DmsHeartbeatConfig {
  /** Chu kỳ kiểm tra sinh tồn (tính bằng ngày: 30 / 60 / 90 / 180) */
  checkIntervalDays: number;
  /** Thời gian chờ xác nhận (7 / 14 / 30 ngày) */
  gracePeriodDays: number;
  /** Tần suất nhắc nhở trước hạn (mỗi 3 ngày / mỗi 7 ngày) */
  reminderFrequencyDays: number;
  /** Danh sách kênh nhận thông báo nhắc nhở */
  channels: NotificationChannelConfig[];
  /** Tự động gửi cảnh báo khẩn cấp tới người giám hộ (Executor) khi bước vào Grace Period */
  notifyExecutorOnGracePeriod: boolean;
}

/**
 * @description Trạng thái thời gian thực của Dead Man's Switch (SRS 3.11.0)
 */
export interface DmsState {
  /** Trạng thái hiện tại */
  status: DmsStatus;
  /** Thời điểm xác nhận sinh tồn gần nhất (ISO string) */
  lastPingAt: string;
  /** Hạn chót cần gửi nhịp ping tiếp theo (ISO string) */
  nextPingDeadline: string;
  /** Thời điểm bắt đầu tạm treo 90 ngày (suspended_at) */
  suspendedAt?: string;
  /** Thời điểm đóng băng do bất hoạt (freeze_at = suspended_at + 90 days) */
  freezeAt?: string;
  /** Thời điểm kết thúc thời gian ân hạn (nếu đang ở Grace Period) */
  gracePeriodEndsAt?: string;
  /** Số ngày còn lại */
  daysRemaining: number;
  /** Số giờ còn lại */
  hoursRemaining: number;
  /** Chuỗi mã băm niêm phong toàn vẹn bất biến ECDSA P-256 */
  integritySealHash: string;
  /** Cấu hình hiện tại */
  config: DmsHeartbeatConfig;
}

/**
 * @description Nhật ký một lần xác nhận sinh tồn (Ping History Item)
 */
export interface PingHistoryItem {
  id: string;
  pingedAt: string;
  source: "WEB" | "EMAIL_LINK" | "TELEGRAM" | "MOBILE_APP";
  ipAddress?: string;
  userAgent?: string;
  status: "SUCCESS" | "LATE";
}
