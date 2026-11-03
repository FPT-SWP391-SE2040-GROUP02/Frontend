import React, { useState } from "react";
import { Eye, EyeOff, Copy, Check, Lock } from "lucide-react";
import { Button } from "@/shared/ui";

/**
 * @file SeedPhraseGrid.tsx
 * @description Master UI Kit Component #1 (Phần 2): Lưới 12 từ khôi phục 3 cột (Seed Phrase Grid).
 * Trình bày mật mã BIP-39 tiêu chuẩn cho ví Web3 (MetaMask, Ledger, Trust Wallet).
 */

interface SeedPhraseGridProps {
  /** Chuỗi 12 từ cách nhau bởi dấu cách */
  seedPhrase: string;
  title?: string;
}

export const SeedPhraseGrid: React.FC<SeedPhraseGridProps> = ({
  seedPhrase,
  title = "Cụm Từ Khôi Phục Bí Mật (12-Word Seed Phrase)",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const words = seedPhrase.trim().split(/\s+/);

  const handleCopy = () => {
    navigator.clipboard.writeText(seedPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 rounded-[20px] bg-[#FAF9F5] border border-[#E8DCC6] shadow-[0_2px_12px_rgba(184,142,76,0.06)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8E5DD]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-center text-[#B88E4C]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#14241C]">{title}</h4>
            <span className="text-[11px] text-[#66786E]">Chuẩn phân mảnh mật mã học BIP-39</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
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
                <span>Ẩn từ</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Hiện từ</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 rounded-[10px] text-xs border-[#DCD9D0] text-[#0B291E] hover:bg-[#EFECE6] flex items-center gap-1 font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#059669]" />
                <span className="text-[#059669]">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép tất cả</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 3-Column Grid of 12 Words */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {words.map((word, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2.5 bg-[#EFECE6] border border-[#DCD9D0] rounded-[12px] transition-all hover:border-[#B88E4C]"
          >
            <span className="w-6 h-6 rounded-full bg-[#FAF9F5] text-[11px] font-bold text-[#A8A295] flex items-center justify-center shrink-0 border border-[#DCD9D0]">
              {index + 1}
            </span>
            <span className="font-mono text-xs font-semibold text-[#0B291E] truncate select-all">
              {isVisible ? word : "••••••"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-[#66786E] text-center italic">
        Thứ tự các từ từ 1 đến 12 là chìa khóa duy nhất để tái tạo ví và phân quyền thừa kế.
      </p>
    </div>
  );
};
