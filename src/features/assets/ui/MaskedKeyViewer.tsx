import React, { useState } from "react";
import { Eye, EyeOff, Copy, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/shared/ui";

/**
 * @file MaskedKeyViewer.tsx
 * @description Master UI Kit Component #1 (Phần 1): Khung che dấu mật mã/khóa bí mật có nút Toggle/Copy.
 * Bảo vệ bí mật trên màn hình chống nhìn trộm (Anti-Shoulder Surfing).
 */

interface MaskedKeyViewerProps {
  label: string;
  value: string;
  warningText?: string;
}

export const MaskedKeyViewer: React.FC<MaskedKeyViewerProps> = ({
  label,
  value,
  warningText = "Tuyệt đối không chia sẻ khóa bí mật này cho bất kỳ ai.",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedValue = "•".repeat(Math.min(value.length, 36));

  return (
    <div className="p-4 rounded-[16px] bg-[#FAF9F5] border border-[#DCD9D0] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#14241C] uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
            className="h-8 px-2.5 rounded-[10px] text-xs text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6] flex items-center gap-1"
          >
            {isVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ẩn</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Hiện</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2.5 rounded-[10px] text-xs text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6] flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#059669]" />
                <span className="text-[#059669]">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-3 bg-[#EFECE6] border border-[#DCD9D0] rounded-[12px] font-mono text-xs break-all select-all text-[#0B291E]">
        {isVisible ? value : maskedValue}
      </div>

      {warningText && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#B45309]">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>{warningText}</span>
        </div>
      )}
    </div>
  );
};
