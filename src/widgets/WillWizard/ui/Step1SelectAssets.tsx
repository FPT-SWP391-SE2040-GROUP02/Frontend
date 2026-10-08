import React from "react";
import { 
  Input, 
  Badge 
} from "@/shared/ui";
import { 
  Lock, 
  Bitcoin, 
  KeyRound, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { useAssets } from "@/features/assets";
import type { AssetType } from "@/features/assets";

/**
 * @file Step1SelectAssets.tsx
 * @description Bước 1 của Digital Will Wizard: Khai báo tiêu đề di chúc & Chọn danh sách tài sản từ Kho di sản đã niêm phong.
 */

interface Step1SelectAssetsProps {
  title: string;
  onTitleChange: (val: string) => void;
  declarationNotes: string;
  onNotesChange: (val: string) => void;
  selectedAssetIds: string[];
  onToggleAsset: (assetId: string) => void;
  onSelectAllAssets: (allIds: string[]) => void;
  errorMessage?: string | null;
}

export const Step1SelectAssets: React.FC<Step1SelectAssetsProps> = ({
  title,
  onTitleChange,
  declarationNotes,
  onNotesChange,
  selectedAssetIds,
  onToggleAsset,
  onSelectAllAssets,
  errorMessage,
}) => {
  const { data: assetsData, isLoading } = useAssets();

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case "CRYPTO":
        return <Bitcoin className="w-4 h-4 text-[#B88E4C]" />;
      case "CREDENTIAL":
        return <KeyRound className="w-4 h-4 text-[#0B291E]" />;
      case "DOCUMENT":
        return <FileText className="w-4 h-4 text-[#66786E]" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <h2 className="text-xl font-bold text-[#14241C]">
          Bước 1: Khai Báo Ý Chí & Chọn Di Sản Cần Định Đoạt
        </h2>
        <p className="text-xs text-[#66786E] mt-1 leading-relaxed">
          Đặt tên định danh cho bản di chúc và lựa chọn các tài sản số trong két di sản được bảo vệ bằng mã hóa AES-256-GCM để đưa vào phương án phân chia thừa kế.
        </p>
      </div>

      {errorMessage && (
        <div 
          role="alert" 
          className="p-3.5 rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-xs text-[#DC2626] font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Inputs */}
      <div className="space-y-4 p-5 sm:p-6 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[22px] shadow-sm">
        <div>
          <label htmlFor="will-title" className="block text-xs font-bold text-[#14241C] uppercase mb-1.5">
            Tiêu Đề Bản Di Chúc Số *
          </label>
          <Input
            id="will-title"
            type="text"
            placeholder="Ví dụ: Bản Di Chúc Phân Bổ Di Sản Gia Tộc 2026"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="h-11 bg-white border-[#D5D0C3] focus:border-[#B88E4C] rounded-[14px] text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            required
          />
        </div>

        <div>
          <label htmlFor="will-notes" className="block text-xs font-bold text-[#14241C] uppercase mb-1.5">
            Lời Dặn Dò / Ý Nguyện Chung (Không bắt buộc)
          </label>
          <textarea
            id="will-notes"
            rows={3}
            placeholder="Ghi chú thêm về tâm nguyện, hướng dẫn mở niêm phong hoặc lời gửi gắm đến các con cháu..."
            value={declarationNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full p-3.5 bg-white border border-[#D5D0C3] focus:border-[#B88E4C] rounded-[14px] text-xs font-sans outline-none focus-visible:ring-2 focus-visible:ring-[#B88E4C] transition-all"
          />
        </div>
      </div>

      {/* Asset Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#14241C] uppercase tracking-wider block">
              Danh Sách Tài Sản Trong Kho Di Sản ({selectedAssetIds.length} đã chọn)
            </span>
            <span className="text-[11px] text-[#66786E]">
              Bấm chọn các tài sản bạn muốn ủy thác cho người thụ hưởng
            </span>
          </div>

          {assetsData && assetsData.items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (selectedAssetIds.length === assetsData.items.length) {
                  onSelectAllAssets([]);
                } else {
                  onSelectAllAssets(assetsData.items.map((a) => a.id));
                }
              }}
              className="text-xs font-semibold text-[#B88E4C] hover:text-[#A07839] px-3 py-1.5 rounded-[12px] hover:bg-[#FBF7EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            >
              {selectedAssetIds.length === assetsData.items.length
                ? "Bỏ chọn tất cả"
                : "Chọn tất cả tài sản"}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[18px] animate-pulse"
              />
            ))}
          </div>
        ) : !assetsData || assetsData.items.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] space-y-2">
            <Lock className="w-8 h-8 text-[#66786E] mx-auto" />
            <p className="text-xs font-bold text-[#14241C]">Kho chưa có tài sản nào</p>
            <p className="text-[11px] text-[#66786E]">
              Vui lòng thêm tài sản vào Kho Di Sản trước khi lập di chúc.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {assetsData.items.map((asset) => {
              const isSelected = selectedAssetIds.includes(asset.id);

              return (
                <div
                  key={asset.id}
                  onClick={() => onToggleAsset(asset.id)}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleAsset(asset.id);
                    }
                  }}
                  className={`p-4 rounded-[18px] border transition-all cursor-pointer flex items-start justify-between gap-3 focus-visible:ring-2 focus-visible:ring-[#B88E4C] focus-visible:outline-none ${
                    isSelected
                      ? "bg-[#FAF9F5] border-[#0B291E] shadow-sm ring-1 ring-[#0B291E]"
                      : "bg-[#FAF9F5]/70 border-[#DCD9D0] hover:border-[#B88E4C]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[#EFECE6] border border-[#DCD9D0] flex items-center justify-center shrink-0 mt-0.5">
                      {getAssetIcon(asset.assetType)}
                    </div>
                    <div>
                      <span className="font-bold text-[#14241C] text-xs block">
                        {asset.title}
                      </span>
                      <span className="text-[11px] text-[#66786E] line-clamp-1 mt-0.5">
                        {asset.description}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-[#E5EDE8] text-[#0B291E] border border-[#A2C4AF] px-2 py-0.5 text-[10px] font-semibold rounded-full">
                          {asset.typeLabel}
                        </Badge>
                        <span className="text-[10px] font-mono text-[#B88E4C]">
                          {asset.shamirThresholdText}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#0B291E] text-[#B88E4C]"
                        : "border border-[#DCD9D0] bg-white"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
