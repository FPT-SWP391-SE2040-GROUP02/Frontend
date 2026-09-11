import * as React from "react";

/**
 * Thuộc tính của component IntegritySealCard
 */
export interface IntegritySealCardProps {
  /**
   * Chuỗi mã băm toàn vẹn SHA-256 của bản di chúc
   */
  manifestHash: string;
  /**
   * Thuật toán mật mã sử dụng (mặc định: "ECDSA P-256 + SHA-256")
   */
  algorithm?: string;
  /**
   * Nhãn trạng thái niêm phong
   */
  statusLabel?: string;
  /**
   * Callback khi người dùng muốn kiểm tra tính toàn vẹn trên blockchain/chứng thực
   */
  onVerifyProof?: () => void;
  /**
   * Class CSS bổ sung
   */
  className?: string;
}

/**
 * @description Con dấu niêm phong mật mã số (Cryptographic Integrity Seal).
 * Dùng cho Notary đối soát bản gốc di chúc và người thụ hưởng xác minh tính bất biến (Tamper-proof).
 *
 * @param {IntegritySealCardProps} props Thuộc tính component
 * @returns {React.ReactElement} Phần tử giao diện IntegritySealCard
 *
 * @example
 * ```tsx
 * <IntegritySealCard
 *   manifestHash="8f4b2a9c1e3d5f7a9b0c2e4f6a8d0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e"
 * />
 * ```
 */
export const IntegritySealCard: React.FC<IntegritySealCardProps> = ({
  manifestHash,
  algorithm = "ECDSA P-256 · SHA-256",
  statusLabel = "TAMPER-PROOF",
  onVerifyProof,
  className = "",
}) => {
  const [copied, setCopied] = React.useState<boolean>(false);

  const handleCopyHash = () => {
    // TODO: 1. Sao chép manifestHash vào clipboard
    // TODO: 2. Hiển thị thông báo toast thành công
    navigator.clipboard.writeText(manifestHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleVerify = () => {
    // TODO: 1. Gọi API đối chiếu chữ ký số và mã băm với bản ghi sổ cái công chứng
    // TODO: 2. Mở modal hiển thị chi tiết chữ ký điện tử X.509
    if (onVerifyProof) {
      onVerifyProof();
    }
  };

  return (
    <div
      className={`bg-[var(--heritage-gold-light,#fbf7ee)] dark:bg-[#1a1811] border border-[var(--heritage-gold-border,#e8dcc6)] dark:border-[#423c28] rounded-xl p-4 shadow-xs ${className}`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7a5b27] dark:text-[var(--heritage-gold,#d4af37)]">
          <span>🛡️</span>
          <span>Cryptographic Integrity Seal ({algorithm})</span>
        </div>
        <span className="text-[9.5px] font-bold bg-white dark:bg-[#2a2315] text-[#7a5b27] dark:text-[var(--heritage-gold,#d4af37)] border border-[var(--heritage-gold-border,#e8dcc6)] dark:border-[#52472e] px-2 py-0.5 rounded-full uppercase tracking-wider">
          {statusLabel}
        </span>
      </div>

      <div className="text-[11px] text-[var(--text-muted,#66786e)] dark:text-[#8fa599] mb-1">
        Digital Will Manifest Hash:
      </div>

      <div className="flex items-center gap-2">
        <div className="font-mono text-[11px] text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4] bg-white dark:bg-[#0c2219] px-2.5 py-1.5 rounded-md border border-[var(--heritage-gold-border,#e8dcc6)] dark:border-[#384d41] flex-1 break-all select-all">
          {manifestHash}
        </div>
        <button
          type="button"
          onClick={handleCopyHash}
          className="px-2 py-1.5 text-[11px] font-medium bg-white dark:bg-[#201d14] hover:bg-[#faf7ee] text-[#7a5b27] dark:text-[var(--heritage-gold,#d4af37)] border border-[var(--heritage-gold-border,#e8dcc6)] dark:border-[#423c28] rounded-md transition-colors shrink-0"
        >
          {copied ? "✓ Đã chép" : "📋"}
        </button>
        <button
          type="button"
          onClick={handleVerify}
          className="px-2.5 py-1.5 text-[11px] font-medium bg-[var(--heritage-gold,#b88e4c)] hover:bg-[var(--heritage-gold-hover,#a07839)] text-white rounded-md transition-colors shrink-0"
        >
          Đối soát
        </button>
      </div>
    </div>
  );
};
