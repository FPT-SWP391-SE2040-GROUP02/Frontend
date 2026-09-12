// ==============================================================================
// SWP391 - LegacyVault: AssetTable UI Component
// Bảng hiển thị danh sách tài sản số tuân thủ chuẩn 4 trạng thái UI/UX Pro Max
// ==============================================================================

import { useState } from "react";
import {
  Coins,
  KeyRound,
  FileText,
  Lock,
  Search,
  Plus,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import {
  ASSET_CATEGORY,
  type AssetCategory,
  type AssetViewModel,
} from "@/entities/asset";
import { Button, Input, Skeleton } from "@/shared/ui";
import { APP_MESSAGES } from "@/shared/constants";

/**
 * @description Props cho component AssetTable.
 */
export interface AssetTableProps {
  /** Danh sách dữ liệu tài sản dạng ViewModel */
  assets?: AssetViewModel[];
  /** Trạng thái đang tải dữ liệu */
  isLoading?: boolean;
  /** Trạng thái tải dữ liệu thất bại */
  isError?: boolean;
  /** Thông điệp lỗi chi tiết (nếu có) */
  errorMessage?: string;
  /** Hàm callback khi người dùng bấm nút Thử lại khi có lỗi */
  onRetry?: () => void;
  /** Hàm callback khi người dùng bấm nút Thêm mới tài sản */
  onCreateClick?: () => void;
  /** Hàm callback khi người dùng bấm xem chi tiết tài sản */
  onViewDetail?: (asset: AssetViewModel) => void;
  /** Hàm callback khi người dùng bấm xóa tài sản */
  onDeleteAsset?: (assetId: string) => void;
}

/**
 * @description Component Bảng danh sách tài sản số với thanh tìm kiếm, bộ lọc theo danh mục
 * và xử lý trọn vẹn 4 trạng thái: Loading, Error, Empty, Success.
 *
 * @param {AssetTableProps} props Thuộc tính truyền vào cho component
 * @returns {React.JSX.Element} Giao diện bảng danh sách tài sản số
 *
 * @example
 * ```tsx
 * <AssetTable
 *   assets={assetList}
 *   isLoading={isLoading}
 *   isError={isError}
 *   onRetry={refetch}
 *   onCreateClick={() => setIsOpen(true)}
 * />
 * ```
 */
export function AssetTable({
  assets = [],
  isLoading = false,
  isError = false,
  errorMessage = APP_MESSAGES.ERROR.LOAD_FAILED,
  onRetry,
  onCreateClick,
  onViewDetail,
  onDeleteAsset,
}: AssetTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  /**
   * @description Lọc danh sách tài sản theo từ khóa tìm kiếm và danh mục được chọn
   */
  const filteredAssets = assets.filter((asset) => {
    const matchSearch =
      asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.dataTypeLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      selectedCategory === "ALL" || asset.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  /**
   * @description Render biểu tượng Icon hộp đại diện cho từng danh mục tài sản
   */
  const renderCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case ASSET_CATEGORY.CRYPTO:
        return (
          <div className="w-10 h-10 rounded-lg bg-[#B88E4C]/15 border border-[#E8DCC6] flex items-center justify-center text-[#B88E4C] shrink-0" title="Tiền mã hóa & Web3">
            <Coins className="w-5 h-5" />
          </div>
        );
      case ASSET_CATEGORY.CREDENTIAL:
        return (
          <div className="w-10 h-10 rounded-lg bg-emerald-950/10 dark:bg-emerald-500/10 border border-emerald-900/20 flex items-center justify-center text-primary dark:text-emerald-400 shrink-0" title="Tài khoản & Mật khẩu">
            <KeyRound className="w-5 h-5" />
          </div>
        );
      case ASSET_CATEGORY.DOCUMENT:
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0" title="Tài liệu mật & Di chúc">
            <FileText className="w-5 h-5" />
          </div>
        );
    }
  };

  // ==================== 1. TRẠNG THÁI LOADING (SKELETON) ====================
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl w-full overflow-hidden shadow-xs">
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-4 py-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== 2. TRẠNG THÁI ERROR (LỖI + NÚT THỬ LẠI) ====================
  if (isError) {
    return (
      <div className="bg-card border border-border rounded-xl w-full p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">Không thể tải danh sách tài sản</h3>
          <p className="text-sm text-muted-foreground max-w-md">{errorMessage}</p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            onClick={() => {
              // TODO: Developer tự hoàn thiện logic retry nếu cần xử lý thêm telemetry/logging
              onRetry();
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  // ==================== 3 & 4. TRẠNG THÁI SUCCESS & EMPTY ====================
  return (
    <div className="bg-card border border-border rounded-xl w-full overflow-hidden shadow-xs">
      {/* Header & Thanh Công Cụ Lọc */}
      <div className="p-5 sm:p-6 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Danh Mục Tài Sản Số</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý và mã hóa đầu cuối các tài sản di sản trước khi niêm phong kho
          </p>
        </div>
        {onCreateClick && (
          <Button
            onClick={() => {
              // TODO: Mở modal tạo mới tài sản
              onCreateClick();
            }}
            className="btn-gold shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm tài sản mới
          </Button>
        )}
      </div>

      {/* Toolbar Tìm kiếm & Filter */}
      <div className="p-4 sm:px-6 bg-muted/20 border-b border-border/60 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tài sản, loại dữ liệu..."
            className="pl-9 h-9.5 bg-background text-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9.5 rounded-lg border border-input bg-background px-3 text-xs w-full sm:w-auto font-medium focus-visible:outline-none focus-visible:border-ring"
        >
          <option value="ALL">Tất cả danh mục</option>
          <option value={ASSET_CATEGORY.CRYPTO}>Tiền mã hóa & Web3</option>
          <option value={ASSET_CATEGORY.CREDENTIAL}>Tài khoản & Mật khẩu</option>
          <option value={ASSET_CATEGORY.DOCUMENT}>Tài liệu mật & Di chúc</option>
        </select>
      </div>

      {/* Kiểm tra Empty State */}
      {filteredAssets.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-primary">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold">Chưa có tài sản số nào</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Kho lưu trữ của bạn chưa chứa tài sản nào trong danh mục này. Hãy bắt đầu thêm tài sản để thiết lập di sản.
            </p>
          </div>
          {onCreateClick && (
            <Button onClick={onCreateClick} variant="outline" className="gap-2 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Thêm tài sản đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/80 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-5">Tên Tài Sản & Loại</th>
                <th className="py-3 px-4">Danh Mục</th>
                <th className="py-3 px-4">Bảo Mật</th>
                <th className="py-3 px-4">Quyền Sở Hữu</th>
                <th className="py-3 px-4">Ngày Tạo</th>
                <th className="py-3 px-5 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-muted/20 transition-colors">
                  {/* Cột 1: Icon + Tên tài sản */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      {renderCategoryIcon(asset.category)}
                      <div>
                        <strong className="text-sm font-semibold text-foreground block">{asset.title}</strong>
                        <span className="text-xs text-muted-foreground">{asset.dataTypeLabel}</span>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Nhãn danh mục */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FBF7EE] text-[#88672F] border border-[#E8DCC6] dark:bg-[#1F1C13] dark:text-[#E8DCC6] dark:border-[#423C28]">
                      {asset.categoryLabel}
                    </span>
                  </td>

                  {/* Cột 3: Trạng thái mã hóa */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>AES-GCM-256</span>
                    </div>
                  </td>

                  {/* Cột 4: Quyền sở hữu */}
                  <td className="py-3.5 px-4">
                    <span className="text-muted-foreground font-medium">
                      {asset.propertyTypeLabel}
                    </span>
                  </td>

                  {/* Cột 5: Ngày tạo */}
                  <td className="py-3.5 px-4">
                    <span className="text-muted-foreground">
                      {asset.formattedCreatedAt}
                    </span>
                  </td>

                  {/* Cột 6: Nút thao tác */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {onViewDetail && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Mở modal giải mã hoặc xem chi tiết
                            onViewDetail(asset);
                          }}
                          className="h-8 px-2.5 text-xs text-primary dark:text-emerald-400 hover:bg-primary/10"
                        >
                          Chi tiết
                        </Button>
                      )}
                      {onDeleteAsset && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Xác nhận trước khi xóa tài sản
                            onDeleteAsset(asset.id);
                          }}
                          className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
