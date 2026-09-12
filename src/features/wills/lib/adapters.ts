import type { 
  WillItemDto, 
  WillViewModel, 
  CreateWillFormValues, 
  CreateWillRequest 
} from "../model/will.types";

/**
 * @file adapters.ts
 * @description Design Pattern 2: Adapter Pattern chuyển đổi giữa Backend DTO <-> UI ViewModel cho Di chúc số.
 * Đảm bảo tầng UI không nhận trực tiếp Raw DTO phức tạp hoặc thiếu trường đã chuẩn hóa hiển thị.
 */

/**
 * Chuyển đổi từ Raw DTO (nhận từ C# API) sang ViewModel (cho Component UI)
 * @param dto DTO thô từ Backend
 * @returns ViewModel đã được chuẩn hóa ngày tháng, nhãn hiển thị và định dạng
 */
export function toWillViewModel(dto: WillItemDto): WillViewModel {
  const statusLabels: Record<string, string> = {
    DRAFT: "Bản Thảo",
    SEALED: "Đã Niêm Phong Mật Mã",
    PROBATE_AWAITING: "Chờ Công Chứng Viên",
    EXECUTED: "Đã Bàn Giao Thừa Kế",
    REVOKED: "Đã Thu Hồi",
  };

  const formattedDate = new Date(dto.createdAt).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const sealedDate = dto.seal?.sealedAt 
    ? new Date(dto.seal.sealedAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    : undefined;

  const hash = dto.affidavitProof?.sha256Hash || "";
  const affidavitHashShort = hash.length > 12 
    ? `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}` 
    : hash;

  return {
    id: dto.id,
    title: dto.title,
    declarationNotes: dto.declarationNotes || "Không có ghi chú thêm",
    status: dto.status,
    statusLabel: statusLabels[dto.status] || dto.status,
    assetCount: dto.selectedAssetIds?.length || 0,
    selectedAssetIds: dto.selectedAssetIds || [],
    allocations: dto.allocations || [],
    beneficiaryCount: dto.allocations?.length || 0,
    hasAffidavit: Boolean(dto.affidavitProof && dto.affidavitProof.isConfirmed),
    affidavitHashShort,
    isSealed: dto.status === "SEALED",
    sealedAtFormatted: sealedDate,
    createdAtFormatted: formattedDate,
  };
}

/**
 * Chuyển đổi từ dữ liệu Form nhập liệu sang Payload Request gửi lên C# API
 * @param form Dữ liệu thu thập từ Stepper 4 bước
 * @returns Payload Request chuẩn bị gửi qua mạng
 */
export function toCreateWillPayload(form: CreateWillFormValues): CreateWillRequest {
  return {
    title: form.title,
    declarationNotes: form.declarationNotes,
    selectedAssetIds: form.selectedAssetIds,
    allocations: form.allocations,
    affidavitProof: form.affidavitProof,
  };
}
