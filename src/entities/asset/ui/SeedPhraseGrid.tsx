import * as React from "react";

/**
 * Thuộc tính của component SeedPhraseGrid
 */
export interface SeedPhraseGridProps {
  /**
   * Mảng danh sách 12 hoặc 24 từ khóa bí mật
   */
  words: string[];
  /**
   * Tiêu đề hiển thị
   */
  title?: string;
  /**
   * Cho phép che mờ toàn bộ từ khóa hay hiển thị rõ
   */
  blurred?: boolean;
  /**
   * Callback khi người dùng muốn sao chép toàn bộ seed phrase
   */
  onCopyAll?: () => void;
  /**
   * Class CSS bổ sung
   */
  className?: string;
}

/**
 * @description Lưới hiển thị 12 hoặc 24 từ khóa khôi phục ví Web3 (Seed Phrase) theo chuẩn BIP-39.
 * Định dạng đánh số thứ tự từng từ và hỗ trợ chế độ bảo vệ quyền riêng tư.
 *
 * @param {SeedPhraseGridProps} props Thuộc tính component
 * @returns {React.ReactElement} Phần tử giao diện SeedPhraseGrid
 *
 * @example
 * ```tsx
 * <SeedPhraseGrid
 *   words={["ocean", "vintage", "shield", "legacy", "glacier", "timber", "anchor", "orbit", "velvet", "harbor", "zenith", "crystal"]}
 * />
 * ```
 */
export const SeedPhraseGrid: React.FC<SeedPhraseGridProps> = ({
  words,
  title = "Recovery Seed Phrase (BIP-39 Mnemonic)",
  blurred = false,
  onCopyAll,
  className = "",
}) => {
  const [isBlurred, setIsBlurred] = React.useState<boolean>(blurred);

  const handleCopy = () => {
    // TODO: 1. Ghép mảng words thành chuỗi cách nhau bởi dấu cách
    // TODO: 2. Ghi vào clipboard qua navigator.clipboard.writeText
    // TODO: 3. Kích hoạt callback onCopyAll và hiển thị toast thông báo
    const fullPhrase = words.join(" ");
    navigator.clipboard.writeText(fullPhrase).then(() => {
      if (onCopyAll) onCopyAll();
    });
  };

  return (
    <div className={`flex flex-col gap-2.5 w-full ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[var(--text-muted,#66786e)]">
          {title}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsBlurred(!isBlurred)}
            className="text-[11px] text-[var(--heritage-primary,#0b291e)] dark:text-[var(--heritage-gold,#d4af37)] hover:underline font-medium"
          >
            {isBlurred ? "Hiện từ khóa" : "Che mờ"}
          </button>
          <span className="text-[var(--border-ui,#dcd9d0)] dark:text-[#2d4d3d]">|</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] text-[var(--heritage-gold-hover,#a07839)] dark:text-[var(--heritage-gold,#d4af37)] hover:underline font-medium"
          >
            Sao chép 12 từ
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 transition-all duration-200 ${
          isBlurred ? "blur-sm select-none" : ""
        }`}
      >
        {words.map((word, index) => (
          <div
            key={`${word}-${index}`}
            className="flex items-center gap-2 bg-[#faf9f5] dark:bg-[#0e221a] border border-[#ddd8cb] dark:border-[#1d3b2f] px-2.5 py-2 rounded-md font-mono text-xs text-[var(--text-main,#14241c)] dark:text-[#f3f6f4] shadow-xs"
          >
            <span className="text-[var(--text-muted,#66786e)] dark:text-[#8fa599] text-[10.5px] w-4 text-right">
              {index + 1}.
            </span>
            <span className="font-semibold">{word}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
