import { APP_MESSAGES } from "@/shared/constants";
import React, { useState } from "react";
import {
  Activity,
  ShieldCheck,
  Clock,
  Zap,
  SlidersHorizontal,
  History,
  Copy,
  Check,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { Button, Badge } from "@/shared/ui";
import { useDmsStatus, useSendPulsePing, useToggleDmsPause } from "../model/useDms";
import type { DmsStatus } from "../model/dms.types";

const HEARTBEAT_LABELS = { copySeal: "Sao chép chuỗi mã băm" } as const;

/**
 * @file DmsHeartbeatCard.tsx
 * @description Master UI Kit Component #2: Live Dead Man's Switch Heartbeat Card.
 * Hiển thị điểm phát xung nhịp sinh tồn (pulse-dot animation), đồng hồ đếm ngược,
 * nút kích hoạt "⚡ I'm Alive", và Thẻ niêm phong mật mã ECDSA P-256.
 */

/** Presentation callbacks for the heartbeat configuration and history dialogs. */
interface DmsHeartbeatCardProps {
  /** Callback mở modal cấu hình chu kỳ */
  onOpenConfig?: () => void;
  /** Callback mở modal lịch sử ping */
  onOpenHistory?: () => void;
}

/** Displays heartbeat query states and delegates actions to the existing DMS hooks. */
export const DmsHeartbeatCard: React.FC<DmsHeartbeatCardProps> = ({
  onOpenConfig,
  onOpenHistory,
}) => {
  const { data: dmsState, isLoading, isError, refetch } = useDmsStatus();
  const { mutate: sendPing, isPending: isPinging } = useSendPulsePing();
  const { mutate: togglePause, isPending: isTogglingPause } = useToggleDmsPause();

  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCopySeal = () => {
    if (dmsState?.integritySealHash) {
      navigator.clipboard.writeText(dmsState.integritySealHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePing = () => {
    sendPing(
      { source: "WEB" },
      {
        onSuccess: (res) => {
          setSuccessMessage(res.message ?? null);
          setTimeout(() => setSuccessMessage(null), 5000);
        },
      },
    );
  };

  const handleTogglePause = () => {
    const nextPaused = dmsState?.status !== "PAUSED";
    togglePause(nextPaused);
  };

  if (isLoading) {
    return (
      <div className="min-w-0 border-y border-heritage-border py-6 animate-pulse">
        <div className="h-6 w-48 max-w-full bg-[#EFECE6] rounded-full mb-4"></div>
        <div className="h-12 w-full bg-[#EFECE6] rounded-lg mb-6"></div>
        <div className="h-32 bg-[#EFECE6] rounded-lg"></div>
      </div>
    );
  }

  if (isError)
    return (
      <div role="alert" className="p-6 space-y-3">
        <p>{APP_MESSAGES.ERROR.LOAD_FAILED}</p>
        <Button onClick={() => void refetch()}>{APP_MESSAGES.UI.RETRY}</Button>
      </div>
    );
  if (!dmsState)
    return (
      <p role="status" className="p-6">
        {APP_MESSAGES.UI.EMPTY}
      </p>
    );

  const getStatusBadge = (status: DmsStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-[#E5EDE8] text-[#0B291E] border border-[#A2C4AF] px-3 py-1 font-semibold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#059669] absolute" />
            <span className="ml-1.5">ĐANG HOẠT ĐỘNG</span>
          </Badge>
        );
      case "WARNING":
        return (
          <Badge className="bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] px-3 py-1 font-semibold rounded-full flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            CẢNH BÁO SẮP HẾT HẠN
          </Badge>
        );
      case "GRACE_PERIOD":
        return (
          <Badge className="bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] px-3 py-1 font-semibold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            THỜI GIAN ÂN HẠN ({dmsState.config.gracePeriodDays} NGÀY)
          </Badge>
        );
      case "PAUSED":
        return (
          <Badge className="bg-[#F3F4F6] text-[#4B5563] border border-[#D1D5DB] px-3 py-1 font-semibold rounded-full flex items-center gap-1.5">
            <PauseCircle className="w-3.5 h-3.5" />
            TẠM DỪNG (VACATION MODE)
          </Badge>
        );
      case "TRIGGERED":
        return (
          <Badge className="bg-[#FEF2F2] text-[#991B1B] border border-[#F87171] px-3 py-1 font-semibold rounded-full">
            ĐÃ KÍCH HOẠT BÀN GIAO
          </Badge>
        );
      default:
        return null;
    }
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round((dmsState.daysRemaining / dmsState.config.checkIntervalDays) * 100)),
  );

  return (
    <div className="min-w-0 border-y border-heritage-border py-4 sm:py-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-heritage-border">
        <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
          <div className="size-11 shrink-0 rounded-lg bg-heritage-primary flex items-center justify-center text-heritage-gold">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-heritage-text">Cơ Chế Nhịp Sinh Tồn</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#66786E]">
              Dead Man's Switch (DMS Protocol) • Bàn giao di sản tự động khi mất tín hiệu
            </p>
          </div>
        </div>

        <div className="min-w-0 max-w-full [&_[data-slot=badge]]:whitespace-normal [&_[data-slot=badge]]:text-left [&_svg]:shrink-0">
          {getStatusBadge(dmsState.status)}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="mt-6 p-4 rounded-lg bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] flex items-center gap-3 animate-in fade-in duration-300">
          <ShieldCheck className="w-5 h-5 text-[#059669] shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Main Countdown & Heartbeat Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Left Col: Big Countdown Display */}
        <div className="min-w-0 lg:col-span-7 bg-[#EFECE6] border border-heritage-border rounded-lg p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <span className="min-w-0 text-xs font-bold text-[#66786E] uppercase flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 text-[#B88E4C]" />
                Thời Gian Đến Hạn Xác Nhận Tiếp Theo
              </span>
              <span className="text-xs font-semibold text-[#0B291E] bg-[#FAF9F5] px-2.5 py-1 rounded-full border border-[#DCD9D0]">
                Chu kỳ {dmsState.config.checkIntervalDays} ngày
              </span>
            </div>

            {/* Countdown Metrics */}
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-heritage-primary tracking-normal">
                  {dmsState.daysRemaining}
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#66786E]">ngày</span>
              </div>
              <div className="text-3xl font-light text-[#A8A295]">:</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-heritage-text">
                  {dmsState.hoursRemaining}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#66786E]">giờ</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#DCD9D0] h-2.5 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  progressPercent > 50
                    ? "bg-[#059669]"
                    : progressPercent > 20
                      ? "bg-[#B88E4C]"
                      : "bg-[#DC2626]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap justify-between gap-x-4 gap-y-2 text-xs text-[#66786E]">
              <span>
                Ping gần nhất: {new Date(dmsState.lastPingAt).toLocaleDateString("vi-VN")}
              </span>
              <span>
                Hạn chót: {new Date(dmsState.nextPingDeadline).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Big Action Button: I'm Alive */}
          <div className="mt-6 pt-4 border-t border-[#DCD9D0]/60 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handlePing}
              disabled={isPinging || dmsState.status === "PAUSED"}
              className="w-full min-w-0 h-auto min-h-14 whitespace-normal rounded-lg bg-heritage-primary hover:bg-[#133E2F] px-4 py-3 text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 shrink-0 text-[#B88E4C] fill-[#B88E4C]" />
              <span className="min-w-0">
                {isPinging ? "Đang xác nhận nhịp sinh tồn..." : "⚡ I'm Alive (Tôi Vẫn Khỏe Mạnh)"}
              </span>
            </Button>
          </div>
        </div>

        {/* Right Col: ECDSA P-256 Integrity Seal Card */}
        <div className="min-w-0 lg:col-span-5 bg-heritage-surface border border-[#E8DCC6] rounded-lg p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 shrink-0 rounded-lg bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-center text-[#B88E4C]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#14241C]">Niêm Phong Mật Mã Học</h3>
                <span className="text-[11px] font-mono text-[#B88E4C] uppercase font-semibold">
                  ECDSA P-256 Cryptographic Seal
                </span>
              </div>
            </div>

            <p className="text-xs text-[#66786E] mb-3 leading-relaxed">
              Mỗi nhịp sinh tồn được ký số mật mã học bất biến bằng khóa riêng và lưu trữ bằng chứng
              chứng thực tại sổ cái pháp lý.
            </p>

            {/* Seal Hash Display */}
            <div className="p-3 bg-[#EFECE6] border border-[#DCD9D0] rounded-lg flex items-center justify-between gap-2 mb-3">
              <span className="min-w-0 font-mono text-xs text-[#0B291E] truncate select-all">
                {dmsState.integritySealHash}
              </span>
              <button
                type="button"
                onClick={handleCopySeal}
                className="flex size-11 items-center justify-center hover:bg-heritage-surface rounded-lg text-[#66786E] hover:text-heritage-primary transition-colors shrink-0"
                aria-label={HEARTBEAT_LABELS.copySeal}
                title={HEARTBEAT_LABELS.copySeal}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#059669]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="text-[11px] text-[#66786E] flex flex-wrap items-center justify-between gap-2">
              <span>
                Chuẩn mã hóa: <strong>NIST P-256</strong>
              </span>
              <span className="text-[#059669] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Đã xác thực
              </span>
            </div>
          </div>

          {/* Secondary Action Toolbar */}
          <div className="mt-4 pt-4 border-t border-heritage-border grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenConfig}
              className="h-auto min-h-11 min-w-0 whitespace-normal rounded-lg border-heritage-border text-heritage-text hover:bg-[#EFECE6] px-2 py-2 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B88E4C]" />
              Cấu hình
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenHistory}
              className="h-auto min-h-11 min-w-0 whitespace-normal rounded-lg border-heritage-border text-heritage-text hover:bg-[#EFECE6] px-2 py-2 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <History className="w-3.5 h-3.5 text-[#66786E]" />
              Lịch sử ping
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleTogglePause}
              disabled={isTogglingPause}
              className={`h-auto min-h-11 min-w-0 whitespace-normal rounded-lg px-2 py-2 text-xs font-semibold flex items-center justify-center gap-2 ${
                dmsState.status === "PAUSED"
                  ? "text-[#059669] hover:bg-[#E5EDE8]"
                  : "text-[#B45309] hover:bg-[#FFFBEB]"
              }`}
            >
              {dmsState.status === "PAUSED" ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  Tiếp tục
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  Nghỉ phép
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
