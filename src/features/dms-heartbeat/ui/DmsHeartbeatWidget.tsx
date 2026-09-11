import * as React from "react";

/**
 * Thuộc tính của component DmsHeartbeatWidget
 */
export interface DmsHeartbeatWidgetProps {
  /**
   * Trạng thái hoạt động của nhịp tim (active, grace_period, triggered)
   */
  status?: "active" | "grace_period" | "triggered";
  /**
   * Số ngày còn lại trước khi kích hoạt quy trình chuyển giao
   */
  daysRemaining: number;
  /**
   * Số giờ còn lại
   */
  hoursRemaining?: number;
  /**
   * Callback khi người dùng nhấn nút "I'm Alive / Check-in"
   */
  onCheckIn?: () => Promise<void>;
  /**
   * Đang trong tiến trình gửi request check-in
   */
  isLoading?: boolean;
  /**
   * Class CSS bổ sung
   */
  className?: string;
}

/**
 * @description Widget theo dõi nhịp tim sinh tồn Dead Man's Switch (DMS).
 * Hiển thị hiệu ứng radar pulse nhấp nháy, thời gian đếm ngược còn lại và nút xác nhận sinh tồn.
 *
 * @param {DmsHeartbeatWidgetProps} props Thuộc tính cấu hình widget
 * @returns {React.ReactElement} Phần tử giao diện DmsHeartbeatWidget
 *
 * @example
 * ```tsx
 * <DmsHeartbeatWidget
 *   daysRemaining={45}
 *   hoursRemaining={14}
 *   onCheckIn={async () => await handleHeartbeatPing()}
 * />
 * ```
 */
export const DmsHeartbeatWidget: React.FC<DmsHeartbeatWidgetProps> = ({
  status = "active",
  daysRemaining,
  hoursRemaining = 0,
  onCheckIn,
  isLoading = false,
  className = "",
}) => {
  const isGracePeriod = status === "grace_period";
  const borderColor = isGracePeriod ? "border-l-amber-500" : "border-l-emerald-600";
  const pulseColor = isGracePeriod ? "bg-amber-500" : "bg-emerald-600";

  const handleCheckInClick = async () => {
    // TODO: 1. Gọi API POST /api/dms/heartbeat-ping để reset timer đếm ngược
    // TODO: 2. Ký cryptographic heartbeat payload bằng private key của user
    // TODO: 3. Cập nhật state ngày giờ check-in mới nhất vào React Query cache
    // TODO: 4. Hiển thị toast thông báo "Đã gia hạn thành công thời gian sinh tồn"
    if (onCheckIn) {
      await onCheckIn();
    }
  };

  return (
    <div
      className={`bg-[var(--heritage-surface,#faf9f5)] dark:bg-[#0a1d15] border border-[#ddd8cb] dark:border-[#1d3b2f] border-l-4 ${borderColor} rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[var(--heritage-primary-light,#e5ede8)] dark:bg-[#123326] flex items-center justify-center shrink-0 relative">
          <div className={`w-2.5 h-2.5 rounded-full ${pulseColor} animate-dms-pulse`} />
        </div>
        <div>
          <div
            className={`text-[10.5px] uppercase tracking-wider font-semibold ${
              isGracePeriod ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {isGracePeriod ? "Cảnh báo: Đang trong thời gian ân hạn" : "Status: Active Heartbeat"}
          </div>
          <div className="text-base font-semibold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4] mt-0.5">
            {daysRemaining} Ngày : {hoursRemaining} Giờ còn lại
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={handleCheckInClick}
        className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <span>⚡</span>
        <span>{isLoading ? "Đang xác nhận..." : "I'm Alive / Check-in"}</span>
      </button>
    </div>
  );
};
