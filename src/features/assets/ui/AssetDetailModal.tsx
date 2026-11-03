import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, Button, Badge } from "@/shared/ui";
import {
  ShieldCheck,
  Lock,
  Calendar,
  Users,
  Hash,
  Copy,
  Check,
  X,
  KeyRound,
  FileText,
  Bitcoin,
} from "lucide-react";
import { getAssetStrategy } from "../model/strategies/assetStrategyMap";
import type { AssetViewModel, AssetType } from "../model/asset.types";

/**
 * @file AssetDetailModal.tsx
 * @description Modal xem chi tiết tài sản số với bố cục phân vùng rộng rãi, chuẩn responsive (Heritage Forest & Champagne Gold).
 * Tuân thủ WCAG 2.1 AA Touch Target (>= 44px) và 5 Trụ cột UI/UX Quốc tế.
 */

interface AssetDetailModalProps {
  asset: AssetViewModel | null;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, onClose }) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!asset) return null;

  const strategy = getAssetStrategy(asset.assetType);

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case "CRYPTO":
        return <Bitcoin className="w-5 h-5 text-heritage-gold" />;
      case "CREDENTIAL":
        return <KeyRound className="w-5 h-5 text-heritage-primary" />;
      case "DOCUMENT":
        return <FileText className="w-5 h-5 text-heritage-muted" />;
      default:
        return <Lock className="w-5 h-5" />;
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(asset.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <Dialog open={Boolean(asset)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] sm:w-[720px] md:w-[820px] max-w-4xl max-h-[90vh] bg-heritage-surface border border-heritage-border rounded-[28px] p-0 overflow-hidden shadow-[0_24px_64px_rgba(11,41,30,0.2)] flex flex-col"
      >
        {/* Modal Top Header Banner */}
        <div className="bg-heritage-sidebar p-6 sm:p-7 text-white relative shrink-0">
          {/* Close 'X' Button at top right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết tài sản"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center absolute top-5 right-5 transition-colors focus-visible:ring-2 focus-visible:ring-heritage-gold focus-visible:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-12">
            <div className="w-12 h-12 rounded-[16px] bg-heritage-sidebar/90 border border-heritage-gold/40 flex items-center justify-center text-heritage-gold shrink-0 shadow-sm">
              {getAssetIcon(asset.assetType)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-mono tracking-wider uppercase text-heritage-gold font-bold">
                  {strategy.label}
                </span>
                <span className="text-white/40">•</span>
                <Badge className="bg-heritage-sidebar/90 text-heritage-success border border-heritage-success/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {asset.statusLabel}
                </Badge>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight break-words">
                {asset.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/75 flex-wrap">
                <span className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-md">
                  Mã: {asset.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  aria-label="Sao chép ID tài sản"
                  className="hover:text-white transition-colors flex items-center gap-1 text-[11px] text-heritage-gold"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-heritage-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* Section 1: Key Metrics Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-heritage-canvas border border-heritage-border rounded-[20px] text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-white border border-heritage-border flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-heritage-muted" />
              </div>
              <div>
                <span className="text-[10px] text-heritage-muted font-bold uppercase tracking-wider block">
                  Niêm Phong
                </span>
                <span className="font-semibold text-heritage-text text-xs block mt-0.5">
                  {asset.createdAtFormatted}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-white border border-heritage-border flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-heritage-gold" />
              </div>
              <div>
                <span className="text-[10px] text-heritage-muted font-bold uppercase tracking-wider block">
                  Thừa Kế
                </span>
                <span className="font-bold text-heritage-text text-sm block mt-0.5">
                  {asset.beneficiaryCount} người
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-white border border-heritage-border flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-heritage-primary" />
              </div>
              <div>
                <span className="text-[10px] text-heritage-muted font-bold uppercase tracking-wider block">
                  Phân Mảnh Khóa
                </span>
                <span className="font-bold font-mono text-heritage-primary text-xs block mt-0.5">
                  {asset.shamirThresholdText}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Instructions Card */}
          {asset.description && (
            <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-heritage-border shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-heritage-muted uppercase tracking-wider block">
                Chỉ Dẫn & Ghi Chú Riêng Cho Người Thừa Kế
              </span>
              <p className="text-xs text-heritage-text leading-relaxed italic bg-heritage-surface p-3.5 rounded-[14px] border border-heritage-neutral-bg">
                "{asset.description}"
              </p>
            </div>
          )}

          {/* Section 3: Dynamic Decrypted Cryptographic Data Card */}
          <div className="p-5 sm:p-6 rounded-[22px] bg-white border border-heritage-border shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-heritage-neutral-bg pb-3">
              <span className="text-xs font-bold text-heritage-primary uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-heritage-gold" />
                Dữ Liệu Mật Mã Học Đã Giải Mã (Client-side Decrypted)
              </span>
              <Badge className="bg-heritage-gold-light text-heritage-gold border border-heritage-gold-border text-[10px] font-bold px-2.5 py-0.5">
                AES-256-GCM
              </Badge>
            </div>

            {strategy.renderDetails({
              rawPayload: asset.rawPayload,
              metadata: asset.metadata,
            })}
          </div>

          {/* Section 4: RAM Security Banner */}
          <div className="p-4 rounded-[18px] bg-heritage-primary-light border border-[#A2C4AF] flex items-start gap-3 text-xs text-heritage-primary">
            <ShieldCheck className="w-5 h-5 text-heritage-success shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold block">Bảo Mật Zero-Knowledge Client-Side:</strong>
              Dữ liệu mật mã trên chỉ được giải mã tạm thời tại bộ nhớ RAM trên máy tính của bạn và
              sẽ tự động giải phóng ngay khi đóng cửa sổ này. Máy chủ máy chủ không lưu giữ khóa
              giải mã thô.
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-4 sm:px-8 bg-heritage-surface border-t border-heritage-neutral-bg flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-[16px] bg-heritage-sidebar hover:bg-heritage-sidebar/90 text-white text-xs font-bold px-7 shadow-sm focus-visible:ring-2 focus-visible:ring-heritage-gold"
          >
            Đóng Cửa Sổ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
