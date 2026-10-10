import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assetPreviewSchema, type AssetPreviewInput } from "../model/assetPreview.schema";
import { APP_MESSAGES } from "@/shared/constants";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from "@/shared/ui";
import { Plus, Shield, Bitcoin, KeyRound, FileText } from "lucide-react";
import { availableAssetStrategies, getAssetStrategy } from "../model/strategies/assetStrategyMap";
import type { AssetType } from "../model/asset.types";

/**
 * @file CreateAssetModal.tsx
 * @description Modal tạo mới và mã hóa tài sản số (áp dụng Strategy Pattern theo Rule 9).
 */

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAssetModalContent: React.FC<CreateAssetModalProps> = ({ isOpen, onClose }) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    clearErrors,
    trigger,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<AssetPreviewInput>({
    resolver: zodResolver(assetPreviewSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { title: "", description: "", assetType: "CRYPTO", specificData: {} },
  });
  const [selectedType, specificData] = useWatch({ control, name: ["assetType", "specificData"] });
  const activeStrategy = getAssetStrategy(selectedType);
  /** @description Đổi loại tài sản và xóa dữ liệu riêng của loại trước trong RAM. */
  const handleTypeChange = (type: AssetType): void => {
    setValue("assetType", type);
    setValue("specificData", {});
    clearErrors("specificData");
  };
  /** @description Cập nhật form state; validation chạy khi blur, không theo từng phím gõ. */
  const handleSpecificDataChange = (field: string, value: unknown): void => {
    setValue(
      "specificData",
      { ...getValues("specificData"), [field]: value },
      { shouldDirty: true },
    );
  };
  /** @description Chỉ kiểm tra form preview; không gọi API hoặc mã hóa giả. */
  const onSubmit = (): void => {
    // TODO: [P0][ASSET-03] DEVELOPER BLUEPRINT
    // 1. [MỤC TIÊU]: Tạo tài sản thật sau khi BE chốt DTO, quyền và cơ chế upload/content.
    // 2. [INPUT & OUTPUT]: Form hợp lệ + packageId -> asset DTO được BE xác nhận.
    // 3. [CÁC BƯỚC]: Chốt contract; schema/service/hooks; thay preview handler; invalidate khi server thành công.
    // 4. [HÀM / THƯ VIỆN]: RHF/Zod, shared transport, TanStack Query.
    // 5. [ĐIỀU KIỆN BIÊN]: Không beneficiary giả, Base64 giả mã hóa, Shamir hoặc plaintext trong storage/log.
  };
  /** @description Xóa dữ liệu nhạy cảm của form khi người dùng đóng modal. */
  const handleClose = (): void => {
    reset();
    onClose();
  };

  const typeIcons = { CRYPTO: Bitcoin, CREDENTIAL: KeyRound, DOCUMENT: FileText };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
                {APP_MESSAGES.UI.PREVIEW}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {isSubmitSuccessful && <p role="status">{APP_MESSAGES.UI.VALID_PREVIEW}</p>}
          {errors.title && (
            <p id="asset-title-error" role="alert">
              {errors.title.message}
            </p>
          )}
          {errors.description && (
            <p id="asset-description-error" role="alert">
              {errors.description.message}
            </p>
          )}
          {errors.specificData && (
            <p id="asset-specific-error" role="alert">
              {typeof errors.specificData.message === "string"
                ? errors.specificData.message
                : APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE}
            </p>
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
                    className={selectedType === strat.type ? "text-[#B88E4C]" : "text-[#66786E]"}
                  >
                    {React.createElement(typeIcons[strat.type], { className: "w-4 h-4" })}
                  </span>
                  <span>{strat.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#66786E] mt-2 italic">{activeStrategy.description}</p>
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
                {...register("title")}
                aria-invalid={Boolean(errors.title)}
                aria-describedby="asset-title-error"
                className="h-11 bg-[#FAF9F5] border-[#D5D0C3] focus:border-[#B88E4C] rounded-[14px] text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14241C] mb-1.5">
                Mô Tả / Chỉ Dẫn Cho Người Thừa Kế
              </label>
              <Textarea
                rows={2}
                placeholder="Ghi chú thêm về mục đích hoặc mật khẩu gợi ý..."
                {...register("description")}
                aria-invalid={Boolean(errors.description)}
                aria-describedby="asset-description-error"
                className="w-full p-3 bg-[#FAF9F5] border border-[#D5D0C3] focus:border-[#B88E4C] rounded-[14px] text-xs font-sans outline-none focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
              />
            </div>
          </div>

          {/* Section 3: Dynamic Fields rendered by Active Strategy */}
          <div
            className="pt-2 border-t border-[#E8E5DD]"
            onBlur={() => void trigger("specificData")}
          >
            <label className="block text-xs font-bold text-[#14241C] uppercase mb-3">
              2. Dữ Liệu Bảo Mật Riêng Biệt ({activeStrategy.label})
            </label>
            {activeStrategy.renderFormFields({
              data: specificData,
              onChange: handleSpecificDataChange,
            })}
          </div>

          {/* Section 4: Envelope Encryption & Handover Notice */}
          <div className="p-4 rounded-[16px] bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-between text-xs text-[#78350F]">
            <div>
              <span className="font-bold block">Chính sách bàn giao tài sản (SRS 3.11.0)</span>
              <span className="text-[11px] text-[#A07839]">
                Tài sản sẽ được tự động gom vào kho bàn giao tương ứng với tập người nhận sau khi
                thiết lập di sản.
              </span>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-[#FAF9F5] border border-[#E8DCC6] rounded-[8px] text-[#B88E4C]">
              AES-256-GCM
            </span>
          </div>

          <DialogFooter className="pt-4 border-t border-[#E8E5DD] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto min-h-[44px] rounded-[16px] border-[#DCD9D0] text-[#14241C] hover:bg-[#EFECE6] text-xs font-semibold px-5 focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"

              className="w-full sm:w-auto min-h-[44px] rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-6 shadow-sm flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            >
              <Plus className="w-4 h-4 text-[#B88E4C]" />
              Kiểm tra dữ liệu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/** @description Unmount form khi đóng để xóa dữ liệu nhạy cảm khỏi phiên modal. */
export const CreateAssetModal: React.FC<CreateAssetModalProps> = (props) =>
  props.isOpen ? <CreateAssetModalContent {...props} /> : null;
