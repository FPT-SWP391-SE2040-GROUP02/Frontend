import React from "react";
import { 
  Lock, 
  Trash2, 
  Eye, 
  AlertCircle, 
  Plus, 
  Bitcoin, 
  KeyRound, 
  FileText 
} from "lucide-react";
import { Button, Badge } from "@/shared/ui";
import { useAssets, useDeleteAsset } from "../model/useAssets";
import type { AssetViewModel, AssetType } from "../model/asset.types";

/**
 * @file AssetTable.tsx
 * @description Bảng danh sách tài sản số trong kho di sản với đầy đủ 4 trạng thái (Loading, Error, Empty, Success).
 */

interface AssetTableProps {
  onSelectAsset: (asset: AssetViewModel) => void;
  onOpenCreateModal: () => void;
  selectedType?: string;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  onSelectAsset,
  onOpenCreateModal,
  selectedType,
}) => {
  const { data, isLoading, isError, refetch } = useAssets(
    selectedType && selectedType !== "ALL" ? { assetType: selectedType } : undefined
  );
  const { mutate: deleteAsset, isPending: isDeleting } = useDeleteAsset();

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

  // 1. Trạng thái Loading (Skeleton)
  if (isLoading) {
    return (
      <div className="bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-6 space-y-4">
        <div className="h-8 bg-[#EFECE6] rounded-md w-1/4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#EFECE6] rounded-[14px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 2. Trạng thái Error
  if (isError || !data) {
    return (
      <div className="bg-[#FAF9F5] border border-[#FECACA] rounded-[24px] p-8 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-[#DC2626] mx-auto" />
        <h3 className="text-base font-bold text-[#14241C]">Không thể tải danh sách tài sản</h3>
        <p className="text-xs text-[#66786E]">Đã xảy ra lỗi kết nối với máy chủ. Vui lòng thử lại.</p>
        <Button
          onClick={() => refetch()}
          className="rounded-[16px] bg-[#0B291E] text-white text-xs font-semibold px-4 py-2"
        >
          Thử Lại
        </Button>
      </div>
    );
  }

  // 3. Trạng thái Empty
  if (data.items.length === 0) {
    return (
      <div className="bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-12 text-center space-y-4 shadow-[0_2px_12px_rgba(11,41,30,0.04)]">
        <div className="w-14 h-14 rounded-[20px] bg-[#E5EDE8] text-[#0B291E] flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#14241C]">Kho Di Sản Chưa Có Tài Sản Nào</h3>
          <p className="text-xs sm:text-sm text-[#66786E] max-w-md mx-auto mt-1 leading-relaxed">
            Hãy bắt đầu bảo vệ ví tiền mã hóa, tài khoản số hoặc tài liệu mật bằng mã hóa cấp quân sự AES-256-GCM.
          </p>
        </div>
        <Button
          onClick={onOpenCreateModal}
          className="rounded-[20px] bg-[#0B291E] hover:bg-[#133E2F] text-white font-bold text-xs px-6 py-3 shadow-[0_4px_16px_rgba(11,41,30,0.2)] flex items-center gap-2 mx-auto"
        >
          <Plus className="w-4 h-4 text-[#B88E4C]" />
          Thêm Tài Sản Đầu Tiên
        </Button>
      </div>
    );
  }

  // 4. Trạng thái Success
  return (
    <div className="bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(11,41,30,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E8E5DD] bg-[#EFECE6]/60 text-[#66786E] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-4 px-6">Tài Sản Số</th>
              <th className="py-4 px-4">Loại Tài Sản</th>
              <th className="py-4 px-4">Người Thừa Kế</th>
              <th className="py-4 px-4">Phân Mảnh Khóa</th>
              <th className="py-4 px-4">Ngày Niêm Phong</th>
              <th className="py-4 px-6 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E5DD] text-xs font-medium">
            {data.items.map((asset) => (
              <tr
                key={asset.id}
                className="hover:bg-[#FAF7EE]/60 transition-colors group cursor-pointer"
                onClick={() => onSelectAsset(asset)}
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

                {/* Actions */}
                <td
                  className="py-4 px-6 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectAsset(asset)}
                      className="h-8 px-2.5 rounded-[10px] text-xs text-[#0B291E] hover:bg-[#E5EDE8] flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#B88E4C]" />
                      <span>Xem</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa tài sản "${asset.title}"?`)) {
                          deleteAsset(asset.id);
                        }
                      }}
                      className="h-8 px-2.5 rounded-[10px] text-xs text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
