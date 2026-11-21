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
    <div
      className={`bg-heritage-surface border border-heritage-border dark:border-heritage-primary-hover rounded-[12px] p-4.5 space-y-3.5 shadow-xs ${className}`}
    >
      <div className="text-[10.5px] uppercase tracking-wider text-heritage-muted font-bold">
        {title}
      </div>

      {/* Dải che Private Key */}
      <div className="flex items-center gap-2 bg-white dark:bg-heritage-primary p-2 sm:p-2.5 rounded-[8px] border border-heritage-border-strong dark:border-heritage-primary-hover">
        <span className="font-mono text-sm tracking-wider flex-1 text-heritage-primary dark:text-heritage-primary-light truncate select-all">
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
          className="text-[10.5px] gap-1 border-heritage-gold-border text-heritage-warning dark:text-heritage-gold-soft bg-heritage-gold-light dark:bg-heritage-primary"
        >
          {copied ? (
            <Check className="w-3 h-3 text-heritage-success" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span>{copied ? "Đã sao chép" : "Copy"}</span>
        </Button>
      </div>

      {/* Lưới 12 từ khôi phục Seed Phrase */}
      {seedPhrase && seedPhrase.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {seedPhrase.map((word, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-heritage-primary border border-heritage-border dark:border-heritage-primary-hover px-2.5 py-1.5 rounded-[6px] text-[0.875rem] font-mono flex items-center gap-1.5"
            >
              <span className="text-heritage-muted font-semibold select-none">{idx + 1}.</span>
              <span className="text-heritage-primary dark:text-heritage-primary-light font-medium">
                {word}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
