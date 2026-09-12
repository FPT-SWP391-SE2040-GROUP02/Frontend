// ==============================================================================
// SWP391 - LegacyVault: Digital Asset Mock Data Fixtures
// Dữ liệu mẫu phục vụ phát triển giao diện độc lập không phụ thuộc Backend
// ==============================================================================

import type { PaginatedList } from "@/shared/types";
import { STATUS } from "@/shared/constants";
import {
  ASSET_CATEGORY,
  ASSET_DATA_TYPE,
  PROPERTY_TYPE,
  type AssetDto,
  type AssetViewModel,
} from "./asset.types";

/**
 * @description Danh sách DTO mẫu trả về từ Backend API.
 */
export const MOCK_ASSET_DTOS: AssetDto[] = [
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    vaultId: "v1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    category: ASSET_CATEGORY.CRYPTO,
    dataType: ASSET_DATA_TYPE.SEED_PHRASE,
    title: "Ví MetaMask Chính (Ethereum & Polygon)",
    encryptedCiphertext: "U2FsdGVkX1+vupppZmm+MQ==",
    initializationVector: "a1b2c3d4e5f60718",
    authTag: "9f8e7d6c5b4a392817",
    propertyType: PROPERTY_TYPE.SEPARATE_PROPERTY,
    status: STATUS.ACTIVE,
    createdAt: "2026-03-01T10:30:00Z",
    updatedAt: "2026-03-05T14:20:00Z",
  },
  {
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    vaultId: "v1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    category: ASSET_CATEGORY.CREDENTIAL,
    dataType: ASSET_DATA_TYPE.WEB_ACCOUNT,
    title: "Tài khoản Google Workspace Quản Trị",
    encryptedCiphertext: "U2FsdGVkX19kjas8d9ashd==",
    initializationVector: "b2c3d4e5f6a70819",
    authTag: "8e7d6c5b4a39281706",
    propertyType: PROPERTY_TYPE.SEPARATE_PROPERTY,
    status: STATUS.ACTIVE,
    createdAt: "2026-03-02T08:15:00Z",
  },
  {
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    vaultId: "v1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    category: ASSET_CATEGORY.DOCUMENT,
    dataType: ASSET_DATA_TYPE.PDF_CONTRACT,
    title: "Hợp đồng Sở hữu Bất động sản Vinhomes",
    encryptedCiphertext: "U2FsdGVkX1+9a8sd7f6a5s==",
    initializationVector: "c3d4e5f6a7b80920",
    authTag: "7d6c5b4a39281706f5",
    propertyType: PROPERTY_TYPE.COMMON_PROPERTY,
    status: STATUS.ACTIVE,
    createdAt: "2026-03-03T16:45:00Z",
  },
];

/**
 * @description Danh sách ViewModel mẫu đã chuẩn hóa sẵn cho UI hiển thị ngay.
 */
export const MOCK_ASSET_VIEW_MODELS: AssetViewModel[] = [
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    vaultId: "v1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    category: ASSET_CATEGORY.CRYPTO,
    categoryLabel: "Tiền mã hóa & Web3",
    dataType: ASSET_DATA_TYPE.SEED_PHRASE,
    dataTypeLabel: "Cụm từ khôi phục (Seed Phrase)",
    title: "Ví MetaMask Chính (Ethereum & Polygon)",
    isEncrypted: true,
    encryptedData: {
      ciphertext: "U2FsdGVkX1+vupppZmm+MQ==",
      initializationVector: "a1b2c3d4e5f60718",
      authTag: "9f8e7d6c5b4a392817",
    },
    propertyType: PROPERTY_TYPE.SEPARATE_PROPERTY,
    propertyTypeLabel: "Tài sản riêng",
    status: STATUS.ACTIVE,
    formattedCreatedAt: "01/03/2026 10:30",
  },
  {
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    vaultId: "v1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    category: ASSET_CATEGORY.CREDENTIAL,
    categoryLabel: "Tài khoản & Mật khẩu",
    dataType: ASSET_DATA_TYPE.WEB_ACCOUNT,
    dataTypeLabel: "Tài khoản Web / Email",
    title: "Tài khoản Google Workspace Quản Trị",
    isEncrypted: true,
    encryptedData: {
      ciphertext: "U2FsdGVkX19kjas8d9ashd==",
      initializationVector: "b2c3d4e5f6a70819",
      authTag: "8e7d6c5b4a39281706",
    },
    propertyType: PROPERTY_TYPE.SEPARATE_PROPERTY,
    propertyTypeLabel: "Tài sản riêng",
    status: STATUS.ACTIVE,
    formattedCreatedAt: "02/03/2026 08:15",
  },
  {
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    vaultId: "v1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    category: ASSET_CATEGORY.DOCUMENT,
    categoryLabel: "Tài liệu mật & Di chúc",
    dataType: ASSET_DATA_TYPE.PDF_CONTRACT,
    dataTypeLabel: "Hợp đồng & Văn bản số",
    title: "Hợp đồng Sở hữu Bất động sản Vinhomes",
    isEncrypted: true,
    encryptedData: {
      ciphertext: "U2FsdGVkX1+9a8sd7f6a5s==",
      initializationVector: "c3d4e5f6a7b80920",
      authTag: "7d6c5b4a39281706f5",
    },
    propertyType: PROPERTY_TYPE.COMMON_PROPERTY,
    propertyTypeLabel: "Tài sản chung",
    status: STATUS.ACTIVE,
    formattedCreatedAt: "03/03/2026 16:45",
  },
];

/**
 * @description Dữ liệu phân trang mẫu khớp chuẩn C# PaginatedList<T>.
 */
export const MOCK_PAGINATED_ASSETS: PaginatedList<AssetViewModel> = {
  items: MOCK_ASSET_VIEW_MODELS,
  totalCount: 3,
  pageIndex: 1,
  pageSize: 10,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};
