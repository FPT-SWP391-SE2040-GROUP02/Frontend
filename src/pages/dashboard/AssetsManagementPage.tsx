// ==============================================================================
// SWP391 - LegacyVault: AssetsManagementPage (Dashboard Screen)
// Trang quản lý toàn diện tài sản số của người lập di chúc
// Lắp ghép Widgets & Features theo đúng chuẩn Feature-Sliced Design (FSD)
// ==============================================================================

import { useState } from "react";
import { Activity, ShieldAlert, Plus, Sparkles } from "lucide-react";
import {
  AssetTable,
  CreateAssetModal,
  AssetDetailModal,
  AssetStatsWidget,
} from "@/features/assets";
import {
  MOCK_ASSET_VIEW_MODELS,
  type AssetViewModel,
} from "@/entities/asset";
import { Button, ConfirmDialog, toast } from "@/shared/ui";

/**
 * @description Màn hình Quản lý Tài Sản Số (AssetsManagementPage).
 * Cho phép người lập di chúc lưu trữ, phân loại, mã hóa các khóa ví Web3,
 * tài khoản trực tuyến và hồ sơ pháp lý vào kho di sản bảo mật.
 *
 * @returns {React.JSX.Element} Trang quản lý tài sản hoàn chỉnh
 *
 * @example
 * ```tsx
 * <Route path="/dashboard/assets" element={<AssetsManagementPage />} />
 * ```
 */
export function AssetsManagementPage() {
  // State quản lý danh sách tài sản (Sử dụng Mock data hoặc custom query hook)
  const [assetList, setAssetList] = useState<AssetViewModel[]>(MOCK_ASSET_VIEW_MODELS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetViewModel | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<AssetViewModel | null>(null);

  /**
   * @description Xác nhận xóa tài sản sau khi bấm nút trên ConfirmDialog
   */
  const handleConfirmDelete = () => {
    if (!deletingAsset) return;
    // TODO: Gọi useDeleteAsset mutation khi kết nối Backend
    setAssetList((prev) => prev.filter((item) => item.id !== deletingAsset.id));
    toast.success(`Đã xóa tài sản "${deletingAsset.title}" khỏi kho di sản.`, "Xóa thành công");
    setDeletingAsset(null);
  };


  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#B88E4C]">
              <Sparkles className="w-3.5 h-3.5 text-[#B88E4C]" />
              Kho Lưu Trữ Di Sản Số
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Quản Lý Tài Sản Số & Khóa Mật
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Toàn bộ tài sản số được mã hóa client-side (AES-GCM-256) trước khi lưu trữ và chỉ được chuyển giao khi kích hoạt di chúc.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-gold shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm tài sản mới
          </Button>
        </div>
      </div>

      {/* 2. Dead Man's Switch Quick Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-emerald-900/15 bg-emerald-900/5 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-white dark:bg-background border border-emerald-900/20 flex items-center justify-center text-primary dark:text-emerald-400 shrink-0 shadow-xs">
          <Activity className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              Cơ Chế Giám Sát Nhịp Tim (DMS) Đang Hoạt Động
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Đã kiểm tra 2 ngày trước
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kho di sản sẽ tự động chuyển sang giai đoạn Chờ (Grace Period) nếu không nhận được tín hiệu Check-in trong 30 ngày tới.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="bg-background text-xs h-9">
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-[#B88E4C]" />
            Cấu hình thời hạn
          </Button>
        </div>
      </div>


      {/* 3. 4 Stat Cards */}
      <AssetStatsWidget assets={assetList} />

      {/* 4. Bảng danh sách tài sản (4 trạng thái) */}
      <AssetTable
        assets={assetList}
        isLoading={false}
        isError={false}
        onCreateClick={() => setIsCreateModalOpen(true)}
        onViewDetail={(asset) => setSelectedAsset(asset)}
        onDeleteAsset={(assetId) => {
          const found = assetList.find((a) => a.id === assetId);
          if (found) setDeletingAsset(found);
        }}
      />

      {/* 5. Modal Tạo Mới Tài Sản (Strategy Pattern Dynamic Form) */}
      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          toast.success("Đã thêm mới và mã hóa tài sản thành công!", "Tạo mới thành công");
        }}
      />

      {/* 6. Modal Xem Chi Tiết & Giải Mã */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
      />

      {/* 7. Popup Xác Nhận Xóa Tài Sản Di Sản */}
      <ConfirmDialog
        isOpen={Boolean(deletingAsset)}
        title="Xác nhận xóa tài sản số"
        description={`Bạn có chắc chắn muốn xóa "${deletingAsset?.title}" khỏi kho lưu trữ di sản? Hành động này sẽ hủy khóa bí mật và không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        isDestructive
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingAsset(null)}
      />
    </div>
  );
}

