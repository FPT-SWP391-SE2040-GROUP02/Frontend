// ==============================================================================
// SWP391 - LegacyVault: AssetDetailModal UI Component
// Modal xem chi tiết và giải mã tài sản số theo danh mục
// ==============================================================================

import { useState } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  Lock,
  Coins,
  KeyRound,
  FileText,
} from "lucide-react";
import {
  ASSET_CATEGORY,
  type AssetViewModel,
} from "@/entities/asset";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@/shared/ui";

/**
 * @description Props cho AssetDetailModal component.
 */
export interface AssetDetailModalProps {
  /** Đối tượng tài sản được chọn để xem chi tiết */
  asset: AssetViewModel | null;
  /** Trạng thái mở/đóng Modal */
  isOpen: boolean;
  /** Hàm callback khi đóng Modal */
  onClose: () => void;
}

/**
 * @description Component hiển thị chi tiết tài sản số, hỗ trợ hiển thị dữ liệu mật mã,
 * sao chép khóa bí mật và tải file tài liệu di chúc đã mã hóa.
 *
 * @param {AssetDetailModalProps} props Thuộc tính của component
 * @returns {React.JSX.Element} Modal chi tiết tài sản
 *
 * @example
 * ```tsx
 * <AssetDetailModal
 *   asset={selectedAsset}
 *   isOpen={Boolean(selectedAsset)}
 *   onClose={() => setSelectedAsset(null)}
 * />
 * ```
 */
export function AssetDetailModal({
  asset,
  isOpen,
  onClose,
}: AssetDetailModalProps) {
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!asset) return null;

  /**
   * @description Xử lý sao chép văn bản vào clipboard
   */
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * @description Render chi tiết nội dung dựa theo danh mục tài sản
   */
  const renderAssetContent = () => {
    switch (asset.category) {
      case ASSET_CATEGORY.CRYPTO:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Địa Chỉ Ví Công Khai
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("0x71C...b92F")}
                  className="h-7 px-2 text-xs gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Đã chép" : "Sao chép"}
                </Button>
              </div>
              <p className="font-mono text-xs bg-background p-2.5 rounded-lg border border-border break-all">
                0x71C...b92F (Ethereum Mainnet)
              </p>
            </div>

            {/* Khóa bí mật đã mã hóa */}
            <div className="p-4 rounded-xl border border-gold-border bg-gold-light/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#B88E4C]" />
                  <span className="text-xs font-bold text-[#88672F]">
                    Cụm Từ Khôi Phục / Khóa Bí Mật
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDecrypted(!isDecrypted)}
                  className="h-7 px-2.5 text-xs gap-1.5 border-gold-border text-[#88672F] hover:bg-gold-light"
                >
                  {isDecrypted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {isDecrypted ? "Ẩn bí mật" : "Giải mã xem"}
                </Button>
              </div>

              {isDecrypted ? (
                <div className="p-3 bg-white dark:bg-background rounded-lg border border-gold-border/80">
                  <p className="font-mono text-xs leading-relaxed text-foreground">
                    witch collapse practice feed shame open despair creek road again ice leaf
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-muted/60 rounded-lg border border-dashed border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• ••••
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case ASSET_CATEGORY.CREDENTIAL:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <small className="text-muted-foreground block text-[11px]">Tên đăng nhập</small>
                <strong className="text-xs mt-1 block">admin@legacyvault.vn</strong>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <small className="text-muted-foreground block text-[11px]">Dịch vụ</small>
                <strong className="text-xs mt-1 block">Google Workspace</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gold-border bg-gold-light/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#88672F]">Mật khẩu tài khoản</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDecrypted(!isDecrypted)}
                  className="h-7 px-2 text-xs border-gold-border text-[#88672F]"
                >
                  {isDecrypted ? "Ẩn" : "Hiện"}
                </Button>
              </div>
              <p className="font-mono text-xs bg-white dark:bg-background p-2.5 rounded-lg border border-gold-border">
                {isDecrypted ? "LegacyVault@Secret2026!#" : "••••••••••••••••"}
              </p>
            </div>
          </div>
        );

      case ASSET_CATEGORY.DOCUMENT:
      default:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-xs block font-semibold">{asset.title}.pdf</strong>
                  <small className="text-muted-foreground text-[11px]">Tài liệu đã mã hóa • 2.4 MB</small>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Tải xuống và giải mã binary phía client
                }}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Tải về
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-[#FAF9F5] dark:bg-[#0A1D15] border border-border shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">

          <div className="flex items-center gap-2 text-gold mb-1">
            <ShieldCheck className="w-4 h-4 text-[#B88E4C]" />
            <span className="eyebrow text-gold">Chi Tiết Tài Sản Số</span>
          </div>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {asset.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Mã định danh: <span className="font-mono">{asset.id}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Thông tin metadata */}
        <div className="grid grid-cols-3 gap-2 py-2 text-xs border-b border-border">
          <div>
            <span className="text-muted-foreground block text-[11px]">Danh mục</span>
            <span className="font-medium mt-0.5 block">{asset.categoryLabel}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Quyền sở hữu</span>
            <span className="font-medium mt-0.5 block">{asset.propertyTypeLabel}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Ngày tạo</span>
            <span className="font-medium mt-0.5 block">{asset.formattedCreatedAt}</span>
          </div>
        </div>

        {/* Khối nội dung giải mã */}
        <div className="py-2">
          {renderAssetContent()}
        </div>

        {/* Nút đóng */}
        <div className="flex justify-end pt-3 border-t border-border">
          <Button onClick={onClose} variant="outline" size="sm">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
