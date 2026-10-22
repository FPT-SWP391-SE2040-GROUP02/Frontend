import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { checkInService } from "../api/checkInService";

/**
 * Khung quản lý và ghép nối đồng hồ thông minh (Samsung Galaxy Watch)
 * Sinh mã PIN 6 số động để liên kết thiết bị với tài khoản chủ kho.
 */
export function SmartwatchCheckInButton({
  className,
}: {
  vaultId?: string;
  status?: unknown;
  className?: string;
}) {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isGettingCode, setIsGettingCode] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  const handleGetPairingCode = async () => {
    setIsGettingCode(true);
    setPairingError(null);
    try {
      const res = await checkInService.getSmartwatchPairingCode();
      setPairingCode(res.code);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tạo mã ghép nối lúc này.";
      setPairingError(message);
    } finally {
      setIsGettingCode(false);
    }
  };

  return (
    <div className={`mt-4 rounded-xl border border-emerald-600/20 bg-emerald-500/5 p-4 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-800">
            Hệ sinh thái Galaxy Watch trực tuyến
          </span>
        </div>
        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
          Sinh trắc học PPG
        </span>
      </div>

      <p className="mt-2 text-xs text-heritage-muted">
        Cảm biến quang học BioActive theo dõi xung mạch máu và trạng thái tiếp xúc da tay để điểm danh sinh tồn DMS tự động.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-amber-600/30 text-amber-900 hover:bg-amber-600/10"
          disabled={isGettingCode}
          onClick={handleGetPairingCode}
        >
          {isGettingCode ? "Đang tạo mã..." : "🔗 Ghép nối đồng hồ mới"}
        </Button>
      </div>

      {pairingCode && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center">
          <p className="text-xs font-medium text-amber-900">Mã ghép nối cho đồng hồ (hiệu lực 5 phút):</p>
          <div className="my-1.5 flex justify-center gap-2 font-mono text-2xl font-bold tracking-widest text-amber-800">
            {pairingCode.split("").map((digit, i) => (
              <span key={i} className="rounded bg-white/80 px-2.5 py-1 shadow-xs">
                {digit}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-amber-700">
            Mở ứng dụng <strong>LegacyVault Watch</strong> và nhập 6 số này để liên kết.
          </p>
        </div>
      )}

      {pairingError && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {pairingError}
        </p>
      )}
    </div>
  );
}
