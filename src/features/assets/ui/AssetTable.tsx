import React, { useState, useMemo } from "react";
import {
  Lock,
  Trash2,
  Eye,
  AlertCircle,
  Plus,
  Bitcoin,
  KeyRound,
  FileText,
  Search,
  X,
} from "lucide-react";
import { Button, Badge, Input } from "@/shared/ui";
import { useAssets, useDeleteAsset } from "../model/useAssets";
import type { AssetViewModel, AssetType } from "../model/asset.types";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

/**
 * @file AssetTable.tsx
 * @description Bảng danh sách tài sản số trong kho di sản với đầy đủ 4 trạng thái (Loading, Error, Empty, Success).
 * Tuân thủ WCAG 2.1 AA Touch Target (>= 44px), NN/g Heuristics (Error Prevention, Recognition), và 8pt Grid.
 */

interface AssetTableProps {
  /** Callback khi người dùng nhấn chọn xem chi tiết một tài sản */
  onSelectAsset: (asset: AssetViewModel) => void;
  /** Callback khi người dùng nhấn nút thêm tài sản mới */
  onOpenCreateModal: () => void;
  /** Bộ lọc phân loại đang được áp dụng */
  selectedType?: string;
  /** Chuỗi tìm kiếm trực tiếp từ thanh công cụ bên ngoài (nếu có) */
  externalSearchTerm?: string;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  onSelectAsset,
  onOpenCreateModal,
  selectedType,
  externalSearchTerm = "",
}) => {
  const { data, isLoading, isError, refetch } = useAssets(
    selectedType && selectedType !== "ALL" ? { assetType: selectedType } : undefined,
  );
  const { mutate: deleteAsset, isPending: isDeleting } = useDeleteAsset();

  // State quản lý tìm kiếm nội bộ và modal xác nhận xóa an toàn
  const [internalSearch, setInternalSearch] = useState<string>("");
  const [assetToDelete, setAssetToDelete] = useState<AssetViewModel | null>(null);

  const effectiveSearchTerm = (externalSearchTerm || internalSearch).trim().toLowerCase();

  // Lọc dữ liệu theo từ khóa tìm kiếm (Doherty Threshold < 400ms - Phản hồi tức thì & Null Safety)
  const filteredItems = useMemo(() => {
    if (!data?.items || !Array.isArray(data.items)) return [];
    if (!effectiveSearchTerm) return data.items;

    return data.items.filter((item) => {
      if (!item) return false;
      const title = (item.title ?? "").toLowerCase();
      const description = (item.description ?? "").toLowerCase();
      const typeLabel = (item.typeLabel ?? "").toLowerCase();

      return (
        title.includes(effectiveSearchTerm) ||
        description.includes(effectiveSearchTerm) ||
        typeLabel.includes(effectiveSearchTerm)
      );
    });
  }, [data, effectiveSearchTerm]);

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case "CRYPTO":
        return <Bitcoin className="w-4 h-4 text-heritage-gold" />;
      case "CREDENTIAL":
        return <KeyRound className="w-4 h-4 text-heritage-primary" />;
      case "DOCUMENT":
        return <FileText className="w-4 h-4 text-heritage-muted" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const getBadgeStyle = (type: AssetType) => {
    switch (type) {
      case "CRYPTO":
        return "bg-heritage-gold-light text-heritage-gold border-heritage-gold-border";
      case "CREDENTIAL":
        return "bg-heritage-primary-light text-heritage-primary border-[#A2C4AF]";
      case "DOCUMENT":
        return "bg-heritage-canvas text-heritage-text border-heritage-border";
    }
  };

  const handleConfirmDelete = () => {
    if (!assetToDelete) return;
    deleteAsset(assetToDelete.id, {
      onSuccess: () => {
        setAssetToDelete(null);
      },
    });
  };

  // 1. Trạng thái Loading (Skeleton)
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Đang tải danh sách tài sản"
        className="bg-heritage-surface border border-heritage-border rounded-[24px] p-6 space-y-4"
      >
        <div className="h-10 bg-heritage-canvas rounded-[14px] w-1/3 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-heritage-canvas rounded-[16px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 2. Trạng thái Error
  if (isError || !data) {
    return (
      <div
        role="alert"
        className="bg-heritage-surface border border-heritage-danger/30 rounded-[24px] p-8 text-center space-y-4 shadow-sm"
      >
        <div className="w-12 h-12 rounded-[16px] bg-heritage-danger-bg border border-heritage-danger/30 flex items-center justify-center text-heritage-danger mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-heritage-text">
            Không thể tải danh sách tài sản số
          </h3>
          <p className="text-xs text-heritage-muted mt-1 max-w-sm mx-auto leading-relaxed">
            Đã xảy ra lỗi kết nối với máy chủ mã hóa hoặc chứng thực phiên làm việc.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          className="min-h-[44px] rounded-[16px] bg-heritage-sidebar hover:bg-heritage-sidebar/90 text-white text-xs font-semibold px-6 shadow-sm focus-visible:ring-2 focus-visible:ring-heritage-gold"
        >
          Thử Lại Ngay
        </Button>
      </div>
    );
  }

  // 3. Trạng thái Empty (Khi chưa có tài sản nào)
  if (data.items.length === 0) {
    return (
      <div className="bg-heritage-surface border border-heritage-border rounded-[24px] p-12 text-center space-y-4 shadow-[0_2px_12px_rgba(11,41,30,0.04)]">
        <div className="w-16 h-16 rounded-[20px] bg-heritage-primary-light text-heritage-primary flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-heritage-text">Kho Di Sản Chưa Có Tài Sản Nào</h3>
          <p className="text-xs sm:text-sm text-heritage-muted max-w-md mx-auto mt-1 leading-relaxed">
            Hãy bắt đầu bảo vệ ví tiền mã hóa, tài khoản số hoặc tài liệu mật bằng mã hóa cấp quân
            sự AES-256-GCM.
          </p>
        </div>
        <Button
          onClick={onOpenCreateModal}
          className="min-h-[44px] rounded-[20px] bg-heritage-sidebar hover:bg-heritage-sidebar/90 text-white font-bold text-xs px-6 py-3 shadow-[0_4px_16px_rgba(11,41,30,0.2)] flex items-center gap-2 mx-auto focus-visible:ring-2 focus-visible:ring-heritage-gold"
        >
          <Plus className="w-4 h-4 text-heritage-gold" />
          Thêm Tài Sản Đầu Tiên
        </Button>
      </div>
    );
  }

  // 4. Trạng thái Success
  return (
    <div className="space-y-4">
      {/* Search Input Bar (Heuristic #7: Flexibility & Efficiency) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-heritage-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Tìm kiếm tài sản trong kho..."
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            className="h-11 pl-10 pr-9 bg-heritage-surface border-heritage-border focus:border-heritage-gold rounded-[16px] text-xs font-medium focus-visible:ring-2 focus-visible:ring-heritage-gold"
            aria-label="Tìm kiếm tài sản trong kho"
          />
          {internalSearch && (
            <button
              onClick={() => setInternalSearch("")}
              aria-label="Xóa nội dung tìm kiếm"
              className="w-7 h-7 rounded-full flex items-center justify-center text-heritage-muted hover:text-heritage-text absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-heritage-muted font-medium self-end sm:self-center">
          Hiển thị <span className="font-bold text-heritage-primary">{filteredItems.length}</span> /{" "}
          {data.items.length} tài sản
        </div>
      </div>

      {/* Kết quả tìm kiếm rỗng */}
      {filteredItems.length === 0 ? (
        <div className="bg-heritage-surface border border-heritage-border rounded-[24px] p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-heritage-text">
            Không tìm thấy tài sản khớp với "{effectiveSearchTerm}"
          </p>
          <p className="text-xs text-heritage-muted">
            Vui lòng kiểm tra lại từ khóa hoặc xóa bộ lọc tìm kiếm.
          </p>
          <Button
            variant="outline"
            onClick={() => setInternalSearch("")}
            className="min-h-[44px] rounded-[16px] border-heritage-border text-xs font-semibold mt-2"
          >
            Xóa Tìm Kiếm
          </Button>
        </div>
      ) : (
        <div className="bg-heritage-surface border border-heritage-border rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(11,41,30,0.04)]">
          <div className="overflow-x-auto">
            <table
              className="w-full text-left border-collapse"
              aria-label="Bảng danh sách tài sản số"
            >
              <thead>
                <tr className="border-b border-heritage-neutral-bg bg-heritage-canvas/70 text-heritage-muted text-[11px] font-bold uppercase tracking-wider">
                  <th scope="col" className="py-4 px-6">
                    Tài Sản Số
                  </th>
                  <th scope="col" className="py-4 px-4">
                    Loại Tài Sản
                  </th>
                  <th scope="col" className="py-4 px-4">
                    Người Thừa Kế
                  </th>
                  <th scope="col" className="py-4 px-4">
                    Phân Mảnh Khóa
                  </th>
                  <th scope="col" className="py-4 px-4">
                    Ngày Niêm Phong
                  </th>
                  <th scope="col" className="py-4 px-6 text-right">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-neutral-bg text-xs font-medium">
                {filteredItems.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-[#FAF7EE]/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectAsset(asset)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectAsset(asset);
                      }
                    }}
                  >
                    {/* Title & Description */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[12px] bg-heritage-canvas border border-heritage-border flex items-center justify-center shrink-0 group-hover:border-heritage-gold transition-colors">
                          {getAssetIcon(asset.assetType)}
                        </div>
                        <div>
                          <span className="font-bold text-heritage-text text-sm block group-hover:text-heritage-primary">
                            {asset.title}
                          </span>
                          <span className="text-[11px] text-heritage-muted truncate max-w-xs block">
                            {asset.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-4 px-4">
                      <Badge
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getBadgeStyle(
                          asset.assetType,
                        )}`}
                      >
                        {asset.typeLabel}
                      </Badge>
                    </td>

                    {/* Beneficiaries Count */}
                    <td className="py-4 px-4 text-heritage-text">
                      <span className="font-bold text-heritage-primary">
                        {asset.beneficiaryCount}
                      </span>{" "}
                      người
                    </td>

                    {/* Shamir Threshold */}
                    <td className="py-4 px-4 font-mono text-[11px] text-heritage-gold">
                      {asset.shamirThresholdText}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-heritage-muted text-[11px]">
                      {asset.createdAtFormatted}
                    </td>

                    {/* Actions with >= 44px Touch Target (WCAG 2.1 AA) */}
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => onSelectAsset(asset)}
                          aria-label={`Xem chi tiết tài sản ${asset.title}`}
                          className="min-h-[44px] px-3.5 rounded-[12px] text-xs text-heritage-primary hover:bg-heritage-primary-light flex items-center gap-1.5 font-semibold focus-visible:ring-2 focus-visible:ring-heritage-gold"
                        >
                          <Eye className="w-4 h-4 text-heritage-gold" />
                          <span>Xem</span>
                        </Button>

                        <Button
                          variant="ghost"
                          disabled={isDeleting}
                          onClick={() => setAssetToDelete(asset)}
                          aria-label={`Xóa tài sản ${asset.title}`}
                          className="min-h-[44px] px-3 rounded-[12px] text-xs text-heritage-danger hover:bg-heritage-danger-bg flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-heritage-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accessible Confirmation Modal (NN/g Heuristic #5: Error Prevention) */}
      <ConfirmDeleteModal
        isOpen={Boolean(assetToDelete)}
        title="Xác Nhận Hủy Niêm Phong & Xóa Tài Sản"
        itemTitle={assetToDelete?.title || ""}
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setAssetToDelete(null)}
      />
    </div>
  );
};
