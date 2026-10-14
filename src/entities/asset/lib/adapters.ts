import type { AssetItemDto, AssetViewModel } from "../model/asset.types";
import { ASSET_TYPE_LABELS } from "../model/asset.constants";
/**
 * Chuyển đổi từ Raw DTO (nhận từ C# API) sang ViewModel (cho Component UI)
 * @param dto DTO thô từ Backend
 * @returns ViewModel đã được chuẩn hóa ngày tháng, nhãn hiển thị và định dạng
 */
export function toViewModel(dto: AssetItemDto): AssetViewModel {
  const statusLabels: Record<string, string> = {
    ACTIVE: "Đang Bảo Vệ",
    LOCKED: "Đã Niêm Phong",
    TRANSFERRED: "Đã Bàn Giao",
  };

  const formattedDate = new Date(dto.createdAt).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return {
    id: dto.id,
    title: dto.title,
    assetType: dto.assetType,
    typeLabel: ASSET_TYPE_LABELS[dto.assetType],
    description: dto.description || "Không có mô tả chi tiết",
    status: dto.status,
    statusLabel: statusLabels[dto.status] || dto.status,
    beneficiaryCount: dto.beneficiaryCount || 0,
    shamirThresholdText: `${dto.shamirThreshold || 2}/${dto.shamirTotalShares || 3} Mảnh Shamir`,
    createdAtFormatted: formattedDate,
    rawPayload: dto.encryptedPayload,
    metadata: dto.metadata,
  };
}
