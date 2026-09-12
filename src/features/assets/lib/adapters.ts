import type {
  AssetItemDto,
  AssetViewModel,
  CreateAssetFormValues,
  CreateAssetRequest,
} from "../model/asset.types";
import { getAssetStrategy } from "../model/strategies/assetStrategyMap";

/**
 * @file adapters.ts
 * @description Design Pattern 2: Adapter Pattern chuyển đổi giữa Backend DTO <-> UI ViewModel.
 * Ngăn chặn UI nhận trực tiếp Raw DTO phức tạp hoặc thiếu trường hiển thị.
 */

/**
 * Chuyển đổi từ Raw DTO (nhận từ C# API) sang ViewModel (cho Component UI)
 * @param dto DTO thô từ Backend
 * @returns ViewModel đã được chuẩn hóa ngày tháng, nhãn hiển thị và định dạng
 */
export function toViewModel(dto: AssetItemDto): AssetViewModel {
  const strategy = getAssetStrategy(dto.assetType);

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
    typeLabel: strategy.label,
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

/**
 * Chuyển đổi từ dữ liệu Form nhập liệu sang Payload gửi lên Backend API
 * @param form Dữ liệu thu thập từ Form tạo mới
 * @returns Payload Request chuẩn bị gửi qua mạng
 */
export function toCreatePayload(form: CreateAssetFormValues): CreateAssetRequest {
  const strategy = getAssetStrategy(form.assetType);
  const encryptedPayload = strategy.preparePayload(form.specificData);

  return {
    title: form.title,
    assetType: form.assetType,
    description: form.description,
    encryptedPayload,
    beneficiaryIds: form.beneficiaryIds,
    shamirThreshold: form.shamirThreshold,
    shamirTotalShares: form.shamirTotalShares,
  };
}
