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
import { Button } from "@/shared/ui";

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

  /**
   * @description Xóa tài sản khỏi danh sách
   */
  const handleDeleteAsset = (assetId: string) => {
    // TODO: Gọi useDeleteAsset mutation khi kết nối Backend
    setAssetList((prev) => prev.filter((item) => item.id !== assetId));
  };

  return (
    <div className="main space-y-6">
      {/* 1. Page Heading */}
      <div className="page-heading">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow text-gold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B88E4C]" />
              Kho Lưu Trữ Di Sản Số
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản Lý Tài Sản Số & Khóa Mật
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toàn bộ tài sản số được mã hóa client-side (AES-GCM-256) trước khi lưu trữ và chỉ được chuyển giao khi kích hoạt di chúc.
          </p>
        </div>

        <div className="heading-actions">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-gold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm tài sản mới
          </Button>
        </div>
      </div>

      {/* 2. Dead Man's Switch Quick Banner */}
      <div className="dms-banner">
        <div className="dms-icon">
          <Activity className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div className="dms-text flex-1">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span>Cơ Chế Giám Sát Nhịp Tim (DMS) Đang Hoạt Động</span>
            <span className="pill text-[10px]">
              <span className="status-dot"></span>
              Đã kiểm tra 2 ngày trước
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kho di sản sẽ tự động chuyển sang giai đoạn Chờ (Grace Period) nếu không nhận được tín hiệu Check-in trong 30 ngày tới.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-white dark:bg-background text-xs">
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
        onDeleteAsset={handleDeleteAsset}
      />

      {/* 5. Modal Tạo Mới Tài Sản (Strategy Pattern Dynamic Form) */}
      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
        }}
      />

      {/* 6. Modal Xem Chi Tiết & Giải Mã */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}
