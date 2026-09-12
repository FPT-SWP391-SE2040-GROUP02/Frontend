import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  Button,
  Badge 
} from "@/shared/ui";
import { ShieldCheck, Lock, Calendar, Users, Hash } from "lucide-react";
import { getAssetStrategy } from "../model/strategies/assetStrategyMap";
import type { AssetViewModel } from "../model/asset.types";

/**
 * @file AssetDetailModal.tsx
 * @description Modal xem chi tiết tài sản số với cơ chế giải mã an toàn tại RAM và Master UI Kit Component #1.
 */

interface AssetDetailModalProps {
  asset: AssetViewModel | null;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
}) => {
  if (!asset) return null;

  const strategy = getAssetStrategy(asset.assetType);

  return (
    <Dialog open={Boolean(asset)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-[#E8E5DD]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#14241C]">
                  {asset.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#66786E] flex items-center gap-2 mt-0.5">
                  <span>{strategy.label}</span>
                  <span>•</span>
                  <span>Mã định danh: {asset.id}</span>
                </DialogDescription>
              </div>
            </div>

            <Badge className="bg-[#E5EDE8] text-[#0B291E] border border-[#A2C4AF] px-3 py-1 font-semibold rounded-full text-xs">
              {asset.statusLabel}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Metadata chips */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-[#EFECE6] border border-[#DCD9D0] rounded-[16px] text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#66786E]" />
              <div>
                <span className="text-[10px] text-[#66786E] block">Ngày niêm phong</span>
                <span className="font-semibold text-[#14241C]">{asset.createdAtFormatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#B88E4C]" />
              <div>
                <span className="text-[10px] text-[#66786E] block">Người thừa kế</span>
                <span className="font-semibold text-[#14241C]">{asset.beneficiaryCount} người</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#0B291E]" />
              <div>
                <span className="text-[10px] text-[#66786E] block">Phân mảnh khóa</span>
                <span className="font-semibold font-mono text-[#0B291E]">{asset.shamirThresholdText}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {asset.description && (
            <div>
              <span className="text-xs font-bold text-[#66786E] uppercase block mb-1">
                Chỉ dẫn cho người thừa kế
              </span>
              <p className="text-xs text-[#14241C] bg-white p-3.5 rounded-[12px] border border-[#DCD9D0] leading-relaxed">
                {asset.description}
              </p>
            </div>
          )}

          {/* Dynamic Details Rendered by Concrete Strategy (Master UI Kit Component #1) */}
          <div>
            <span className="text-xs font-bold text-[#14241C] uppercase block mb-3">
              Dữ liệu mật mã đã giải mã an toàn (Client-side Decrypted)
            </span>
            {strategy.renderDetails({
              rawPayload: asset.rawPayload,
              metadata: asset.metadata,
            })}
          </div>

          {/* Security Notice */}
          <div className="p-3.5 rounded-[14px] bg-[#E5EDE8] border border-[#A2C4AF] flex items-center gap-2 text-xs text-[#0B291E]">
            <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
            <span>
              Dữ liệu được giải mã tạm thời tại bộ nhớ RAM máy tính của bạn và sẽ tự động xóa khi đóng cửa sổ này.
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E8E5DD] flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-[16px] border-[#DCD9D0] text-[#14241C] hover:bg-[#EFECE6] text-xs font-semibold px-6"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
