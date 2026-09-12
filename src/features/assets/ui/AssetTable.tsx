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
  X
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
    selectedType && selectedType !== "ALL" ? { assetType: selectedType } : undefined
  );
  const { mutate: deleteAsset, isPending: isDeleting } = useDeleteAsset();

  // State quản lý tìm kiếm nội bộ và modal xác nhận xóa an toàn
  const [internalSearch, setInternalSearch] = useState<string>("");
  const [assetToDelete, setAssetToDelete] = useState<AssetViewModel | null>(null);

  const effectiveSearchTerm = (externalSearchTerm || internalSearch).trim().toLowerCase();

  // Lọc dữ liệu theo từ khóa tìm kiếm (Doherty Threshold < 400ms - Phản hồi tức thì)
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!effectiveSearchTerm) return data.items;
    return data.items.filter(
      (item) =>
        item.title.toLowerCase().includes(effectiveSearchTerm) ||
        item.description.toLowerCase().includes(effectiveSearchTerm) ||
        item.typeLabel.toLowerCase().includes(effectiveSearchTerm)
    );
  }, [data?.items, effectiveSearchTerm]);

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

  const getBadgeStyle = (type: AssetType) => {
    switch (type) {
      case "CRYPTO":
        return "bg-[#FBF7EE] text-[#B88E4C] border-[#E8DCC6]";
      case "CREDENTIAL":
        return "bg-[#E5EDE8] text-[#0B291E] border-[#A2C4AF]";
      case "DOCUMENT":
        return "bg-[#EFECE6] text-[#14241C] border-[#DCD9D0]";
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
        className="bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-6 space-y-4"
      >
        <div className="h-10 bg-[#EFECE6] rounded-[14px] w-1/3 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#EFECE6] rounded-[16px] animate-pulse" />
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
        className="bg-[#FAF9F5] border border-[#FECACA] rounded-[24px] p-8 text-center space-y-4 shadow-sm"
      >
        <div className="w-12 h-12 rounded-[16px] bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626] mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#14241C]">Không thể tải danh sách tài sản số</h3>
          <p className="text-xs text-[#66786E] mt-1 max-w-sm mx-auto leading-relaxed">
            Đã xảy ra lỗi kết nối với máy chủ mã hóa hoặc chứng thực phiên làm việc.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          className="min-h-[44px] rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-semibold px-6 shadow-sm focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
        >
          Thử Lại Ngay
        </Button>
      </div>
    );
  }

  // 3. Trạng thái Empty (Khi chưa có tài sản nào)
  if (data.items.length === 0) {
    return (
      <div className="bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-12 text-center space-y-4 shadow-[0_2px_12px_rgba(11,41,30,0.04)]">
        <div className="w-16 h-16 rounded-[20px] bg-[#E5EDE8] text-[#0B291E] flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#14241C]">Kho Di Sản Chưa Có Tài Sản Nào</h3>
          <p className="text-xs sm:text-sm text-[#66786E] max-w-md mx-auto mt-1 leading-relaxed">
            Hãy bắt đầu bảo vệ ví tiền mã hóa, tài khoản số hoặc tài liệu mật bằng mã hóa cấp quân sự AES-256-GCM.
          </p>
        </div>
        <Button
          onClick={onOpenCreateModal}
          className="min-h-[44px] rounded-[20px] bg-[#0B291E] hover:bg-[#133E2F] text-white font-bold text-xs px-6 py-3 shadow-[0_4px_16px_rgba(11,41,30,0.2)] flex items-center gap-2 mx-auto focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
        >
          <Plus className="w-4 h-4 text-[#B88E4C]" />
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
          <Search className="w-4 h-4 text-[#A8A295] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Tìm kiếm tài sản trong kho..."
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            className="h-11 pl-10 pr-9 bg-[#FAF9F5] border-[#DCD9D0] focus:border-[#B88E4C] rounded-[16px] text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            aria-label="Tìm kiếm tài sản trong kho"
          />
          {internalSearch && (
            <button
              onClick={() => setInternalSearch("")}
              aria-label="Xóa nội dung tìm kiếm"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#66786E] hover:text-[#14241C] absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-[#66786E] font-medium self-end sm:self-center">
          Hiển thị <span className="font-bold text-[#0B291E]">{filteredItems.length}</span> / {data.items.length} tài sản
        </div>
      </div>

      {/* Kết quả tìm kiếm rỗng */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-[#14241C]">Không tìm thấy tài sản khớp với "{effectiveSearchTerm}"</p>
          <p className="text-xs text-[#66786E]">Vui lòng kiểm tra lại từ khóa hoặc xóa bộ lọc tìm kiếm.</p>
          <Button
            variant="outline"
            onClick={() => setInternalSearch("")}
            className="min-h-[44px] rounded-[16px] border-[#DCD9D0] text-xs font-semibold mt-2"
          >
            Xóa Tìm Kiếm
          </Button>
        </div>
      ) : (
        <div className="bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(11,41,30,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" aria-label="Bảng danh sách tài sản số">
              <thead>
                <tr className="border-b border-[#E8E5DD] bg-[#EFECE6]/70 text-[#66786E] text-[11px] font-bold uppercase tracking-wider">
                  <th scope="col" className="py-4 px-6">Tài Sản Số</th>
                  <th scope="col" className="py-4 px-4">Loại Tài Sản</th>
                  <th scope="col" className="py-4 px-4">Người Thừa Kế</th>
                  <th scope="col" className="py-4 px-4">Phân Mảnh Khóa</th>
                  <th scope="col" className="py-4 px-4">Ngày Niêm Phong</th>
                  <th scope="col" className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DD] text-xs font-medium">
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
                        <div className="w-10 h-10 rounded-[12px] bg-[#EFECE6] border border-[#DCD9D0] flex items-center justify-center shrink-0 group-hover:border-[#B88E4C] transition-colors">
                          {getAssetIcon(asset.assetType)}
                        </div>
                        <div>
                          <span className="font-bold text-[#14241C] text-sm block group-hover:text-[#0B291E]">
                            {asset.title}
                          </span>
                          <span className="text-[11px] text-[#66786E] truncate max-w-xs block">
                            {asset.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-4 px-4">
                      <Badge
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getBadgeStyle(
                          asset.assetType
                        )}`}
                      >
                        {asset.typeLabel}
                      </Badge>
                    </td>

                    {/* Beneficiaries Count */}
                    <td className="py-4 px-4 text-[#14241C]">
                      <span className="font-bold text-[#0B291E]">{asset.beneficiaryCount}</span> người
                    </td>

                    {/* Shamir Threshold */}
                    <td className="py-4 px-4 font-mono text-[11px] text-[#B88E4C]">
                      {asset.shamirThresholdText}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-[#66786E] text-[11px]">
                      {asset.createdAtFormatted}
                    </td>

                    {/* Actions with >= 44px Touch Target (WCAG 2.1 AA) */}
                    <td
                      className="py-4 px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => onSelectAsset(asset)}
                          aria-label={`Xem chi tiết tài sản ${asset.title}`}
                          className="min-h-[44px] px-3.5 rounded-[12px] text-xs text-[#0B291E] hover:bg-[#E5EDE8] flex items-center gap-1.5 font-semibold focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
                        >
                          <Eye className="w-4 h-4 text-[#B88E4C]" />
                          <span>Xem</span>
                        </Button>

                        <Button
                          variant="ghost"
                          disabled={isDeleting}
                          onClick={() => setAssetToDelete(asset)}
                          aria-label={`Xóa tài sản ${asset.title}`}
                          className="min-h-[44px] px-3 rounded-[12px] text-xs text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#DC2626]"
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

