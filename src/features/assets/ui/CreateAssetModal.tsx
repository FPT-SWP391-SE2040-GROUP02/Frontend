// ==============================================================================
// SWP391 - LegacyVault: CreateAssetModal UI Component
// Modal thêm tài sản số ứng dụng Strategy Pattern để thay đổi Form động
// ==============================================================================

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Plus } from "lucide-react";
import {
  ASSET_CATEGORY,
  ASSET_DATA_TYPE,
  PROPERTY_TYPE,
  createAssetFormSchema,
  type CreateAssetFormValues,
  type AssetCategory,
} from "@/entities/asset";
import {
  assetStrategyMap,
  getAssetStrategy,
} from "../model/strategies/assetStrategyMap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
} from "@/shared/ui";

/**
 * @description Props cho CreateAssetModal component.
 */
export interface CreateAssetModalProps {
  /** Trạng thái đóng/mở của Dialog modal */
  isOpen: boolean;
  /** Hàm callback khi người dùng bấm đóng hoặc hủy */
  onClose: () => void;
  /** ID kho lưu trữ mặc định liên kết tài sản */
  defaultVaultId?: string;
  /** Hàm callback sau khi thêm tài sản thành công */
  onSuccess?: () => void;
}

/**
 * @description Modal tạo mới Tài sản số tích hợp Strategy Pattern.
 * Giao diện tự động render các trường nhập liệu tương ứng khi người dùng thay đổi loại tài sản
 * (Ví Web3 Crypto, Tài khoản Mật khẩu, hoặc Tài liệu PDF/Giấy tờ pháp lý).
 *
 * @param {CreateAssetModalProps} props Thuộc tính truyền vào cho component
 * @returns {React.JSX.Element} Modal Dialog JSX
 *
 * @example
 * ```tsx
 * <CreateAssetModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   defaultVaultId="v1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c"
 * />
 * ```
 */
export function CreateAssetModal({
  isOpen,
  onClose,
  defaultVaultId = "v1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  onSuccess,
}: CreateAssetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>(
    ASSET_CATEGORY.CRYPTO
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetFormSchema),
    defaultValues: {
      vaultId: defaultVaultId,
      title: "",
      category: ASSET_CATEGORY.CRYPTO,
      dataType: ASSET_DATA_TYPE.SEED_PHRASE,
      propertyType: PROPERTY_TYPE.SEPARATE_PROPERTY,
      secretPayload: {
        network: "Ethereum (ERC-20)",
        walletAddress: "",
        seedPhrase: "",
      },
    },
  });

  /**
   * @description Lấy chiến lược xử lý tài sản tương ứng dựa theo Strategy Pattern
   */
  const currentStrategy = getAssetStrategy(selectedCategory);

  /**
   * @description Xử lý khi người dùng đổi danh mục tài sản ở Dropdown
   */
  const handleCategoryChange = (newCategory: AssetCategory) => {
    setSelectedCategory(newCategory);
    setValue("category", newCategory);

    // Cập nhật dataType mặc định phù hợp với từng Category
    if (newCategory === ASSET_CATEGORY.CRYPTO) {
      setValue("dataType", ASSET_DATA_TYPE.SEED_PHRASE);
    } else if (newCategory === ASSET_CATEGORY.CREDENTIAL) {
      setValue("dataType", ASSET_DATA_TYPE.WEB_ACCOUNT);
    } else {
      setValue("dataType", ASSET_DATA_TYPE.PDF_CONTRACT);
    }
  };

  /**
   * @description Handler xử lý nộp Form thêm mới tài sản số (Scaffold & // TODO)
   */
  const onSubmit = async (_formValues: CreateAssetFormValues) => {
    setIsSubmitting(true);
    try {
      // TODO: 1. Lấy strategy tương ứng: const strategy = assetStrategyMap[formValues.category]
      // TODO: 2. Gọi strategy.validate(formValues.secretPayload) để xác thực tính hợp lệ
      // TODO: 3. Gọi strategy.preparePayload(formValues.secretPayload) để mã hóa Client-side AES-GCM
      // TODO: 4. Gọi toCreatePayload(formValues, encryptedResult) để đóng gói DTO chuẩn C# Backend
      // TODO: 5. Gọi assetService.create(createRequest) gửi lên máy chủ
      // TODO: 6. Hiển thị thông báo thành công và gọi callback: reset(); onSuccess?.(); onClose();
    } catch (_error) {
      // TODO: Xử lý hiển thị thông báo lỗi thân thiện (toast.error)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#FAF9F5] dark:bg-[#0A1D15] border border-border shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">

          <div className="flex items-center gap-2 text-gold">
            <ShieldCheck className="w-5 h-5 text-[#B88E4C]" />
            <span className="eyebrow text-gold">Client-side Encryption</span>
          </div>
          <DialogTitle className="text-xl font-bold mt-1">
            Thêm Tài Sản Số Mới
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Thông tin bí mật sẽ được mã hóa đầu cuối bằng khóa của bạn trước khi gửi lên máy chủ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Tiêu đề tài sản */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Tên / Tiêu đề gợi nhớ tài sản *</Label>
            <Input
              id="title"
              placeholder="Ví dụ: Ví MetaMask chính, Tài khoản AWS Server..."
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Chọn Danh mục & Quyền sở hữu */}
          <div className="grid grid-cols-2 gap-4">
            {/* Danh mục tài sản */}
            <div className="space-y-1.5">
              <Label htmlFor="category">Danh mục tài sản *</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value as AssetCategory)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:outline-none"
              >
                <option value={ASSET_CATEGORY.CRYPTO}>Tiền mã hóa (Crypto)</option>
                <option value={ASSET_CATEGORY.CREDENTIAL}>Tài khoản & Mật khẩu</option>
                <option value={ASSET_CATEGORY.DOCUMENT}>Tài liệu mật & Di chúc</option>
              </select>
            </div>

            {/* Quyền sở hữu theo Luật Dân Sự */}
            <div className="space-y-1.5">
              <Label htmlFor="propertyType">Quyền sở hữu di sản *</Label>
              <select
                id="propertyType"
                {...register("propertyType")}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:outline-none"
              >
                <option value={PROPERTY_TYPE.SEPARATE_PROPERTY}>Tài sản riêng (Chính chủ)</option>
                <option value={PROPERTY_TYPE.COMMON_PROPERTY}>Tài sản chung (Vợ/Chồng)</option>
              </select>
            </div>
          </div>

          {/* ==================== STRATEGY PATTERN DYNAMIC FORM ==================== */}
          <div className="p-4 rounded-xl border border-gold-border/60 bg-gold-light/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gold-border/40">
              <span className="text-xs font-semibold text-[#88672F]">
                Dữ Liệu Nhạy Cảm — {selectedCategory}
              </span>
              <span className="pill gold text-[10px]">Được bảo vệ bằng mã hóa</span>
            </div>

            {/* Render dynamic form fields tương ứng theo từng Strategy */}
            {currentStrategy.renderFormFields(control, errors)}
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-gold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {isSubmitting ? "Đang mã hóa..." : "Mã hóa & Lưu tài sản"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
