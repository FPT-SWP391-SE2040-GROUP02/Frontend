import React from "react";
import { ShieldCheck, Zap } from "lucide-react";
import { Button } from "./button";

/**
 * @description Thuộc tính cấu hình cho LiveDmsPulseCard component.
 */
export interface LiveDmsPulseCardProps {
  /** Thời gian còn lại hiển thị trên thẻ (VD: '45 Days : 14 Hours Left') */
  timeLeft?: string;
  /** Trạng thái nhịp tim (VD: 'Active Heartbeat') */
  statusText?: string;
  /** Chuỗi hash ECDSA P-256 niêm phong toàn vẹn */
  sealHash?: string;
  /** Callback khi người dùng bấm nút I'm Alive để reset nhịp tim */
  onImAlive?: () => void;
  /** Trạng thái loading khi ping */
  isPending?: boolean;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Thẻ hiển thị nhịp tim Dead Man's Switch trực tiếp với chấm phát xung nhịp pulse-dot và niêm phong mật mã ECDSA P-256.
 *
 * @param {LiveDmsPulseCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Card DMS Heartbeat
 *
 * @example
 * ```tsx
 * <LiveDmsPulseCard
 *   timeLeft="45 Days : 14 Hours Left"
 *   sealHash="8f4b2a9c1e3d5f7a9b0c2e4f6a8d0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e"
 *   onImAlive={() => console.log('Pinged')}
 * />
 * ```
 */
export function LiveDmsPulseCard({
  timeLeft = "45 Days : 14 Hours Left",
  statusText = "Active Heartbeat",
  sealHash = "8f4b2a9c1e3d5f7a9b0c2e4f6a8d0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e",
  onImAlive,
  isPending = false,
  className = "",
}: LiveDmsPulseCardProps) {
  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Thẻ DMS Heartbeat chính */}
      <div className="bg-[var(--surface)] border border-[#DDD8CB] dark:border-[#1E432F] border-l-4 border-l-[#059669] rounded-[10px] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_12px_rgba(11,41,30,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
            <div className="pulse-dot" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#059669] font-bold">
              Status: {statusText}
            </div>
            <div className="text-sm sm:text-base font-bold text-[var(--primary)] dark:text-[#F3F7F4]">
              {timeLeft}
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={onImAlive}
          disabled={isPending}
          className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-[20px] px-4 py-2 self-start sm:self-center shadow-xs flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isPending ? "Đang phát xung..." : "⚡ I'm Alive"}</span>
        </Button>
      </div>

      {/* Thẻ niêm phong mật mã Integrity Seal */}
      {sealHash && (
        <div className="crypto-seal-card">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-bold text-[#7A5B27] dark:text-[#E2C17D] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Integrity Seal (ECDSA P-256)</span>
            </span>
            <span className="text-[9.5px] font-bold bg-white dark:bg-[#0C2217] px-2 py-0.5 rounded-[4px] text-[#7A5B27] dark:text-[#E2C17D] border border-[var(--gold-border)]">
              TAMPER-PROOF
            </span>
          </div>
          <div className="font-mono text-[10px] text-[var(--primary)] dark:text-[#E5EDE8] bg-white dark:bg-[#071710] p-2 rounded-[6px] border border-[#E8DCC6] dark:border-[#3A4D39] break-all select-all">
            {sealHash}
          </div>
        </div>
      )}
    </div>
  );
}
