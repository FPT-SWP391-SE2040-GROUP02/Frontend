import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  Button,
  Input 
} from "@/shared/ui";
import { Plus, Shield, Bitcoin, KeyRound, FileText } from "lucide-react";
import { availableAssetStrategies, getAssetStrategy } from "../model/strategies/assetStrategyMap";
import { useCreateAsset } from "../model/useAssets";
import type { AssetType } from "../model/asset.types";

/**
 * @file CreateAssetModal.tsx
 * @description Modal tạo mới và mã hóa tài sản số (áp dụng Strategy Pattern theo Rule 9).
 */

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { mutate: createAsset, isPending } = useCreateAsset();

  const [selectedType, setSelectedType] = useState<AssetType>("CRYPTO");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specificData, setSpecificData] = useState<Record<string, unknown>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeStrategy = getAssetStrategy(selectedType);

  const handleTypeChange = (type: AssetType) => {
    setSelectedType(type);
    setSpecificData({});
    setErrorMessage(null);
  };

  const handleSpecificDataChange = (field: string, value: unknown) => {
    setSpecificData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Vui lòng nhập tên tài sản");
      return;
    }

    // Validate theo Strategy hiện tại
    if (!activeStrategy.validate(specificData)) {
      setErrorMessage("Vui lòng điền đầy đủ và chính xác các trường bắt buộc theo loại tài sản");
      return;
    }

    createAsset(
      {
        title: title.trim(),
        assetType: selectedType,
        description: description.trim(),
        beneficiaryIds: ["ben_default_01"],
        shamirThreshold: 2,
        shamirTotalShares: 3,
        specificData,
      },
      {
        onSuccess: () => {
          onClose();
          setTitle("");
          setDescription("");
          setSpecificData({});
        },
        onError: (err) => {
          setErrorMessage(err.message || "Đã xảy ra lỗi khi tạo tài sản");
        },
      }
    );
  };

  const getTypeIcon = (type: AssetType) => {
    switch (type) {
      case "CRYPTO":
        return <Bitcoin className="w-4 h-4" />;
      case "CREDENTIAL":
        return <KeyRound className="w-4 h-4" />;
      case "DOCUMENT":
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-[#E8E5DD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#14241C]">
                Niêm Phong Tài Sản Số Mới
              </DialogTitle>
              <DialogDescription className="text-xs text-[#66786E]">
                Mã hóa đầu cuối Client-Side (AES-256-GCM) & Phân mảnh khóa Shamir (k out of n)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {errorMessage && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] text-xs text-[#DC2626] font-medium">
              {errorMessage}
            </div>
          )}

          {/* Section 1: Asset Type Tabs (Strategy Selection) */}
          <div>
            <label className="block text-xs font-bold text-[#14241C] uppercase mb-2">
              1. Chọn Loại Tài Sản Số (Strategy Pattern)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {availableAssetStrategies.map((strat) => (
                <button
                  key={strat.type}
                  type="button"
                  onClick={() => handleTypeChange(strat.type)}
                  className={`min-h-[56px] p-3 rounded-[16px] text-xs font-bold border transition-all flex flex-col items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#B88E4C] focus-visible:outline-none ${
                    selectedType === strat.type
                      ? "bg-[#0B291E] text-white border-[#0B291E] shadow-sm"
                      : "bg-[#EFECE6] text-[#14241C] border-[#DCD9D0] hover:bg-[#FAF9F5]"
                  }`}
                  aria-pressed={selectedType === strat.type}
                >
                  <span
                    className={
                      selectedType === strat.type ? "text-[#B88E4C]" : "text-[#66786E]"
                    }
                  >
                    {getTypeIcon(strat.type)}
                  </span>
                  <span>{strat.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#66786E] mt-2 italic">
              {activeStrategy.description}
            </p>
          </div>

          {/* Section 2: General Info */}
          <div className="space-y-4 pt-2 border-t border-[#E8E5DD]">
            <div>
              <label className="block text-xs font-bold text-[#14241C] mb-1.5">
                Tên Định Danh Tài Sản *
              </label>
              <Input
                type="text"
                placeholder="Ví dụ: Ví Lạnh Bitcoin Gia Tộc / Tài Khoản AWS Root"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 bg-[#FAF9F5] border-[#D5D0C3] focus:border-[#B88E4C] rounded-[14px] text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14241C] mb-1.5">
                Mô Tả / Chỉ Dẫn Cho Người Thừa Kế
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú thêm về mục đích hoặc mật khẩu gợi ý..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-[#FAF9F5] border border-[#D5D0C3] focus:border-[#B88E4C] rounded-[14px] text-xs font-sans outline-none focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
              />
            </div>
          </div>

          {/* Section 3: Dynamic Fields rendered by Active Strategy */}
          <div className="pt-2 border-t border-[#E8E5DD]">
            <label className="block text-xs font-bold text-[#14241C] uppercase mb-3">
              2. Dữ Liệu Bảo Mật Riêng Biệt ({activeStrategy.label})
            </label>
            {activeStrategy.renderFormFields({
              data: specificData,
              onChange: handleSpecificDataChange,
            })}
          </div>

          {/* Section 4: Shamir Key Sharing Notice */}
          <div className="p-4 rounded-[16px] bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-between text-xs text-[#78350F]">
            <div>
              <span className="font-bold block">Phân Mảnh Khóa Shamir (2/3 Shares)</span>
              <span className="text-[11px] text-[#A07839]">
                Kho cần tối thiểu 2 trong 3 người thụ hưởng để phục hồi dữ liệu gốc.
              </span>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-[#FAF9F5] border border-[#E8DCC6] rounded-[8px] text-[#B88E4C]">
              k = 2, n = 3
            </span>
          </div>

          <DialogFooter className="pt-4 border-t border-[#E8E5DD] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] rounded-[16px] border-[#DCD9D0] text-[#14241C] hover:bg-[#EFECE6] text-xs font-semibold px-5 focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto min-h-[44px] rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-6 shadow-sm flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            >
              <Plus className="w-4 h-4 text-[#B88E4C]" />
              {isPending ? "Đang mã hóa & niêm phong..." : "Niêm Phong Tài Sản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
