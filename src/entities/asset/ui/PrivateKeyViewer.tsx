import * as React from "react";

/**
 * Thuộc tính của component PrivateKeyViewer
 */
export interface PrivateKeyViewerProps {
  /**
   * Chuỗi private key đã được giải mã hoặc chuỗi mật mã (raw key string)
   */
  privateKey: string;
  /**
   * Tiêu đề hiển thị cho ô khóa
   */
  label?: string;
  /**
   * Callback khi người dùng yêu cầu giải mã hoặc hiển thị khóa
   */
  onRevealRequest?: () => Promise<boolean>;
  /**
   * Class CSS bổ sung
   */
  className?: string;
}

/**
 * @description Component hiển thị Private Key hoặc Master Decryption Key của ví Web3 / Két sắt số.
 * Hỗ trợ chế độ che mờ an toàn (`••••••••`), nút ẩn/hiện và sao chép vào bộ nhớ đệm.
 *
 * @param {PrivateKeyViewerProps} props Thuộc tính component
 * @returns {React.ReactElement} Phần tử giao diện PrivateKeyViewer
 *
 * @example
 * ```tsx
 * <PrivateKeyViewer
 *   privateKey="0x7f4a9b2c1e3d5f..."
 *   label="Master Seed Decryption Key"
 * />
 * ```
 */
export const PrivateKeyViewer: React.FC<PrivateKeyViewerProps> = ({
  privateKey,
  label = "Master Private Key (Client-Side Encrypted)",
  onRevealRequest,
  className = "",
}) => {
  const [isRevealed, setIsRevealed] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);

  const handleToggleReveal = async () => {
    // TODO: 1. Nếu đang ẩn và có onRevealRequest, yêu cầu nhập mã PIN/Mật khẩu hoặc quét vân tay
    // TODO: 2. Xác thực thành công thì mới chuyển isRevealed = true
    // TODO: 3. Đặt bộ đếm tự động ẩn lại sau 30 giây để bảo vệ quyền riêng tư
    if (!isRevealed && onRevealRequest) {
      const allowed = await onRevealRequest();
      if (!allowed) return;
    }
    setIsRevealed((prev) => !prev);
  };

  const handleCopy = async () => {
    // TODO: 1. Sử dụng navigator.clipboard.writeText để sao chép privateKey vào clipboard
    // TODO: 2. Xóa clipboard sau 45 giây để tránh bị phần mềm gián điệp đọc
    // TODO: 3. Hiển thị thông báo Toast thành công
    try {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // TODO: Xử lý ngoại lệ khi clipboard permission bị từ chối
    }
  };

  const maskedString = "•".repeat(Math.min(privateKey.length, 32));

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[var(--text-muted,#66786e)]">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2 bg-[#faf9f5] dark:bg-[#0e221a] border border-[#d5d0c3] dark:border-[#1d3b2f] rounded-lg p-2.5 shadow-sm">
        <span className="font-mono text-xs text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4] flex-1 overflow-x-auto whitespace-nowrap tracking-wider select-all">
          {isRevealed ? privateKey : maskedString}
        </span>

        <button
          type="button"
          onClick={handleToggleReveal}
          className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[#e5ede8] dark:bg-[#163a2c] hover:bg-[#d6e3da] text-[var(--heritage-primary,#0b291e)] dark:text-[#d6e2db] transition-colors"
        >
          {isRevealed ? "Ẩn" : "👁️ Hiện"}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[var(--heritage-gold-light,#fbf7ee)] dark:bg-[#201d14] text-[var(--heritage-gold-hover,#a07839)] dark:text-[var(--heritage-gold,#d4af37)] border border-[var(--heritage-gold-border,#e8dcc6)] dark:border-[#423c28] hover:bg-[#f5ecda] transition-colors"
        >
          {copied ? "✓ Đã chép" : "📋 Copy"}
        </button>
      </div>
    </div>
  );
};
