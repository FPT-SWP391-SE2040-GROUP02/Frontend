import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "./button";

/**
 * @description Thuộc tính cấu hình cho MaskedKeyDisplay component.
 */
export interface MaskedKeyDisplayProps {
  /** Chuỗi Private Key hoặc chuỗi bí mật */
  secretKey: string;
  /** Danh sách 12 từ khóa khôi phục (Seed phrase) */
  seedPhrase?: string[];
  /** Tiêu đề hiển thị */
  title?: string;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Khung hiển thị Private Key che dấu mật mã (dấu chấm tròn) kèm 12 từ khôi phục dạng lưới 3 cột chuẩn Master UI Kit.
 *
 * @param {MaskedKeyDisplayProps} props Thuộc tính component
 * @returns {React.JSX.Element} Khung hiển thị khóa mật mã
 *
 * @example
 * ```tsx
 * <MaskedKeyDisplay
 *   secretKey="0x7F9A2C8B31E4...D90A"
 *   seedPhrase={["ocean", "vintage", "shield", "legacy", "glacier", "timber"]}
 * />
 * ```
 */
export function MaskedKeyDisplay({
  secretKey,
  seedPhrase = ["ocean", "vintage", "shield", "legacy", "glacier", "timber"],
  title = "1. Private Key & 12-Word Recovery Seed Phrase",
  className = "",
}: MaskedKeyDisplayProps) {
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-[var(--surface)] border border-[#DDD8CB] dark:border-[#1E432F] rounded-[12px] p-4.5 space-y-3.5 shadow-xs ${className}`}>
      <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
        {title}
      </div>

      {/* Dải che Private Key */}
      <div className="flex items-center gap-2 bg-white dark:bg-[#071710] p-2 sm:p-2.5 rounded-[8px] border border-[#D5D0C3] dark:border-[#1E432F]">
        <span className="font-mono text-xs tracking-wider flex-1 text-[var(--primary)] dark:text-[#E5EDE8] truncate select-all">
          {isMasked ? "••••••••••••••••••••••••••••••••" : secretKey}
        </span>

        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={() => setIsMasked(!isMasked)}
          className="text-[10.5px] gap-1"
        >
          {isMasked ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>{isMasked ? "Hiện" : "Ẩn"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleCopy}
          className="text-[10.5px] gap-1 border-[var(--gold-border)] text-[#7D5D28] dark:text-[#E2C17D] bg-[var(--gold-light)] dark:bg-[#182C1F]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Đã sao chép" : "Copy"}</span>
        </Button>
      </div>

      {/* Lưới 12 từ khôi phục Seed Phrase */}
      {seedPhrase && seedPhrase.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {seedPhrase.map((word, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#071710] border border-[#DDD8CB] dark:border-[#1E432F] px-2.5 py-1.5 rounded-[6px] text-[11px] font-mono flex items-center gap-1.5"
            >
              <span className="text-[var(--text-muted)] font-semibold select-none">{idx + 1}.</span>
              <span className="text-[var(--primary)] dark:text-[#F3F7F4] font-medium">{word}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
