/**
 * @file asset.types.ts
 * @description Định nghĩa các kiểu dữ liệu, DTO và ViewModel cho hệ thống Quản lý Kho Tài Sản Số (Digital Asset Vault).
 */

/**
 * Các loại tài sản số được hỗ trợ trong giao thức LegacyVault
 */
export type AssetType = "CRYPTO" | "CREDENTIAL" | "DOCUMENT";

/**
 * Trạng thái niêm phong của tài sản trong kho
 */
export type AssetStatus = "ACTIVE" | "LOCKED" | "TRANSFERRED";

/**
 * Cấu trúc gói tin mã hóa đầu cuối (Zero-Knowledge Client-side Encryption Payload)
 */
export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyDerivationSalt: string;
}

/**
 * DTO dữ liệu thô nhận từ Backend API C#
 */
export interface AssetItemDto {
  id: string;
  vaultId: string;
  title: string;
  assetType: AssetType;
  description?: string;
  status: AssetStatus;
  beneficiaryCount: number;
  shamirThreshold: number;
  shamirTotalShares: number;
  encryptedPayload: EncryptedPayload;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * ViewModel chuẩn hóa cho tầng hiển thị UI
 */
export interface AssetViewModel {
  id: string;
  title: string;
  assetType: AssetType;
  typeLabel: string;
  description: string;
  status: AssetStatus;
  statusLabel: string;
  beneficiaryCount: number;
  shamirThresholdText: string;
  createdAtFormatted: string;
  rawPayload: EncryptedPayload;
  metadata?: Record<string, unknown>;
}

/**
 * Form values tạo tài sản mới
 */
export interface CreateAssetFormValues {
  title: string;
  assetType: AssetType;
  description?: string;
  beneficiaryIds: string[];
  shamirThreshold: number;
  shamirTotalShares: number;
  // Dữ liệu đặc thù theo từng Strategy (Crypto / Credential / Document)
  specificData: Record<string, unknown>;
}

/**
 * Request gửi lên API Backend C# để lưu tài sản
 */
export interface CreateAssetRequest {
  title: string;
  assetType: AssetType;
  description?: string;
  encryptedPayload: EncryptedPayload;
  beneficiaryIds: string[];
  shamirThreshold: number;
  shamirTotalShares: number;
}

/**
 * Thống kê tổng quan kho tài sản
 */
export interface AssetVaultStats {
  totalAssets: number;
  cryptoCount: number;
  credentialCount: number;
  documentCount: number;
  assignedBeneficiariesCount: number;
  vaultStatus: "ACTIVE" | "SEALED" | "AWAITING_LEGAL_PROOF";
}
