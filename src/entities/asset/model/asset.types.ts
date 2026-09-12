// ==============================================================================
// SWP391 - LegacyVault: Digital Asset Entity Types & DTOs
// Tương thích chuẩn C# ASP.NET Core 8 Backend & Feature-Sliced Design (FSD)
// ==============================================================================

import type { Status } from "@/shared/constants";

/**
 * @description Danh mục phân loại tài sản số trong hệ thống LegacyVault.
 */
export const ASSET_CATEGORY = {
  CRYPTO: "CRYPTO",
  CREDENTIAL: "CREDENTIAL",
  DOCUMENT: "DOCUMENT",
} as const;

/** Kiểu dữ liệu cho danh mục tài sản */
export type AssetCategory = (typeof ASSET_CATEGORY)[keyof typeof ASSET_CATEGORY];

/**
 * @description Loại dữ liệu chi tiết của từng danh mục tài sản số.
 */
export const ASSET_DATA_TYPE = {
  // Crypto
  SEED_PHRASE: "SEED_PHRASE",
  PRIVATE_KEY: "PRIVATE_KEY",
  WALLET_ADDRESS: "WALLET_ADDRESS",
  
  // Credential
  WEB_ACCOUNT: "WEB_ACCOUNT",
  SERVER_SSH: "SERVER_SSH",
  API_KEY: "API_KEY",
  
  // Document
  PDF_CONTRACT: "PDF_CONTRACT",
  LEGAL_DEED: "LEGAL_DEED",
  ENCRYPTED_NOTE: "ENCRYPTED_NOTE",
} as const;

/** Kiểu dữ liệu cho loại tài sản cụ thể */
export type AssetDataType = (typeof ASSET_DATA_TYPE)[keyof typeof ASSET_DATA_TYPE];

/**
 * @description Loại quyền sở hữu tài sản di sản.
 */
export const PROPERTY_TYPE = {
  SEPARATE_PROPERTY: "SEPARATE_PROPERTY",
  COMMON_PROPERTY: "COMMON_PROPERTY",
} as const;

/** Kiểu dữ liệu cho loại quyền sở hữu */
export type PropertyType = (typeof PROPERTY_TYPE)[keyof typeof PROPERTY_TYPE];

/**
 * @description Cấu trúc dữ liệu đã được mã hóa ở Client-side (AES-GCM-256).
 */
export interface EncryptedPayload {
  /** Chuỗi văn bản mật mã đã được mã hóa */
  ciphertext: string;
  /** Vector khởi tạo (Initialization Vector - 12/16 bytes hex/base64) */
  initializationVector: string;
  /** Thẻ xác thực tính toàn vẹn (Authentication Tag - 16 bytes hex/base64) */
  authTag: string;
}

/**
 * @description DTO phản hồi từ Backend C# ASP.NET Core (Entity: DigitalAssets).
 */
export interface AssetDto {
  /** Khóa chính định danh tài sản (GUID) */
  id: string;
  /** Khóa ngoại liên kết tới Kho lưu trữ chứa tài sản */
  vaultId: string;
  /** Danh mục tài sản (CRYPTO, CREDENTIAL, DOCUMENT) */
  category: AssetCategory;
  /** Loại dữ liệu cụ thể (SEED_PHRASE, WEB_ACCOUNT...) */
  dataType: AssetDataType;
  /** Tiêu đề/Tên gợi nhớ của tài sản */
  title: string;
  /** Chuỗi mã hóa nội dung nhạy cảm */
  encryptedCiphertext: string;
  /** Vector khởi tạo dùng để giải mã */
  initializationVector: string;
  /** Thẻ xác thực tính toàn vẹn */
  authTag: string;
  /** Loại quyền sở hữu tài sản (Tài sản riêng / Tài sản chung) */
  propertyType: PropertyType;
  /** Trạng thái của tài sản */
  status: Status;
  /** Thời điểm tạo bản ghi */
  createdAt: string;
  /** Thời điểm cập nhật lần cuối */
  updatedAt?: string;
}

/**
 * @description DTO gửi lên Backend để tạo mới một tài sản số.
 */
export interface CreateAssetRequest {
  /** Khóa ngoại của Kho lưu trữ */
  vaultId: string;
  /** Danh mục tài sản */
  category: AssetCategory;
  /** Loại dữ liệu cụ thể */
  dataType: AssetDataType;
  /** Tiêu đề tài sản */
  title: string;
  /** Nội dung mã hóa */
  encryptedCiphertext: string;
  /** Vector khởi tạo */
  initializationVector: string;
  /** Thẻ xác thực */
  authTag: string;
  /** Loại quyền sở hữu */
  propertyType: PropertyType;
}

/**
 * @description DTO gửi lên Backend để cập nhật thông tin tài sản số.
 */
export interface UpdateAssetRequest {
  /** Tiêu đề tài sản */
  title?: string;
  /** Danh mục tài sản */
  category?: AssetCategory;
  /** Loại dữ liệu cụ thể */
  dataType?: AssetDataType;
  /** Nội dung mã hóa mới (nếu có cập nhật bí mật) */
  encryptedCiphertext?: string;
  /** Vector khởi tạo mới */
  initializationVector?: string;
  /** Thẻ xác thực mới */
  authTag?: string;
  /** Loại quyền sở hữu */
  propertyType?: PropertyType;
  /** Trạng thái tài sản */
  status?: Status;
}

/**
 * @description UI ViewModel chuẩn hóa hiển thị trên giao diện người dùng.
 */
export interface AssetViewModel {
  /** ID tài sản */
  id: string;
  /** ID kho lưu trữ */
  vaultId: string;
  /** Danh mục hiển thị */
  category: AssetCategory;
  /** Nhãn danh mục tiếng Việt thân thiện */
  categoryLabel: string;
  /** Loại dữ liệu */
  dataType: AssetDataType;
  /** Nhãn loại dữ liệu tiếng Việt */
  dataTypeLabel: string;
  /** Tiêu đề tài sản */
  title: string;
  /** Đã được mã hóa an toàn chưa */
  isEncrypted: boolean;
  /** Payload mã hóa */
  encryptedData: EncryptedPayload;
  /** Loại quyền sở hữu */
  propertyType: PropertyType;
  /** Nhãn quyền sở hữu tiếng Việt */
  propertyTypeLabel: string;
  /** Trạng thái */
  status: Status;
  /** Ngày tạo định dạng DD/MM/YYYY */
  formattedCreatedAt: string;
}
