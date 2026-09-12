import type {
  AssetItemDto,
  CreateAssetRequest,
  AssetVaultStats,
} from "../model/asset.types";
import type { PaginatedList, PaginationParams, ApiResponse } from "@/shared/types";

/**
 * @file assetService.ts
 * @description Tầng dịch vụ giao tiếp API cho module Quản Lý Tài Sản Số (Asset Management).
 * Tuân thủ Rule 7 (Scaffold with TODO) và Rule 8 (JSDoc chuẩn chỉ).
 */

const ASSETS_ENDPOINT = "/assets";

function safeEncodePayload(data: unknown): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

/**
 * Lấy danh sách tài sản số có phân trang và lọc theo loại
 * @param params Tham số phân trang (pageIndex, pageSize, searchTerm, sortColumn...)
 * @returns Promise chứa PaginatedList<AssetItemDto>
 */
export async function getAssets(
  params?: PaginationParams & { assetType?: string }
): Promise<PaginatedList<AssetItemDto>> {
  // TODO: [Developer Step]
  // 1. Gọi GET /assets qua axiosClient kèm query params
  // 2. Map dữ liệu trả về theo PaginatedList<AssetItemDto>
  const mockItems: AssetItemDto[] = [
    {
      id: "ast_01",
      vaultId: "vlt_01",
      title: "Ví Lạnh Bitcoin & Ethereum Gia Tộc",
      assetType: "CRYPTO",
      description: "Chứa 2.5 BTC và 30 ETH dự phòng tại ví cứng Ledger Nano X",
      status: "ACTIVE",
      beneficiaryCount: 2,
      shamirThreshold: 2,
      shamirTotalShares: 3,
      encryptedPayload: {
        ciphertext: safeEncodePayload({
          network: "ETHEREUM (ERC-20)",
          walletAddress: "0x71C865768268571a82fD859345D181d1392b7D3",
          seedPhrase: "abandon amount liar amount expire adjust cage candy arch gather drum bullet",
          privateKey: "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f360888",
        }),
        iv: "sample_iv",
        authTag: "sample_auth_tag",
        keyDerivationSalt: "sample_salt",
      },
      createdAt: "2026-08-15T08:30:00Z",
      updatedAt: "2026-09-01T10:00:00Z",
    },
    {
      id: "ast_02",
      vaultId: "vlt_01",
      title: "Tài Khoản AWS Cloud & Domain Công Ty",
      assetType: "CREDENTIAL",
      description: "Tài khoản Root AWS quản lý hạ tầng Cloud và cụm cơ sở dữ liệu",
      status: "ACTIVE",
      beneficiaryCount: 1,
      shamirThreshold: 2,
      shamirTotalShares: 3,
      encryptedPayload: {
        ciphertext: safeEncodePayload({
          serviceName: "Amazon Web Services (AWS Root)",
          serviceUrl: "https://signin.aws.amazon.com/console",
          username: "root-admin@legacyvault.vn",
          password: "AwsRootMasterPassword2026!@#",
          twoFactorBackupCodes: "88912304 99120485 11029482 77102938",
        }),
        iv: "sample_iv",
        authTag: "sample_auth_tag",
        keyDerivationSalt: "sample_salt",
      },
      createdAt: "2026-08-20T14:15:00Z",
      updatedAt: "2026-08-20T14:15:00Z",
    },
    {
      id: "ast_03",
      vaultId: "vlt_01",
      title: "Sổ Đỏ Bất Động Sản Biệt Thự Thảo Điền",
      assetType: "DOCUMENT",
      description: "Giấy chứng nhận quyền sử dụng đất số GCN-QD-2024-889123 tại TP. Thủ Đức",
      status: "ACTIVE",
      beneficiaryCount: 2,
      shamirThreshold: 2,
      shamirTotalShares: 3,
      encryptedPayload: {
        ciphertext: safeEncodePayload({
          documentCategory: "REAL_ESTATE_CERTIFICATE",
          identifierNumber: "GCN-QD-2024-889123",
          notes: "Bản gốc lưu tại Két sắt ngân hàng Vietcombank chi nhánh Tân Bình. Hợp đồng ủy quyền công chứng số 102/2025/CC.",
        }),
        iv: "sample_iv",
        authTag: "sample_auth_tag",
        keyDerivationSalt: "sample_salt",
      },
      createdAt: "2026-09-02T09:00:00Z",
      updatedAt: "2026-09-02T09:00:00Z",
    },
  ];

  return {
    items: mockItems,
    totalCount: mockItems.length,
    pageIndex: params?.pageIndex || 1,
    pageSize: params?.pageSize || 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

/**
 * Lấy chi tiết một tài sản số theo ID
 * @param id Định danh tài sản
 * @returns Promise chứa AssetItemDto
 */
export async function getAssetDetail(id: string): Promise<AssetItemDto> {
  // TODO: [Developer Step] Gọi GET /assets/{id} qua axiosClient
  const list = await getAssets();
  const item = list.items.find((x) => x.id === id);
  if (!item) {
    throw new Error(`Không tìm thấy tài sản có ID: ${id}`);
  }
  return item;
}

/**
 * Tạo mới tài sản số vào kho di sản
 * @param payload Dữ liệu tạo tài sản đã mã hóa Zero-Knowledge
 * @returns Promise chứa ApiResponse<AssetItemDto>
 */
export async function createAsset(
  payload: CreateAssetRequest
): Promise<ApiResponse<AssetItemDto>> {
  // TODO: [Developer Step] Gọi POST /assets
  const newAsset: AssetItemDto = {
    id: `ast_${Date.now()}`,
    vaultId: "vlt_01",
    title: payload.title,
    assetType: payload.assetType,
    description: payload.description,
    status: "ACTIVE",
    beneficiaryCount: payload.beneficiaryIds.length,
    shamirThreshold: payload.shamirThreshold,
    shamirTotalShares: payload.shamirTotalShares,
    encryptedPayload: payload.encryptedPayload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    message: "Đã thêm và niêm phong tài sản số thành công!",
    data: newAsset,
  };
}

/**
 * Xóa một tài sản số khỏi kho
 * @param id Định danh tài sản cần xóa
 * @returns Promise ApiResponse
 */
export async function deleteAsset(id: string): Promise<ApiResponse<null>> {
  // TODO: [Developer Step] Gọi DELETE /assets/{id}
  return {
    success: true,
    message: `Đã xóa tài sản ${id} thành công`,
    data: null,
  };
}

/**
 * Lấy số liệu thống kê kho tài sản
 * @returns Promise AssetVaultStats
 */
export async function getVaultStats(): Promise<AssetVaultStats> {
  // TODO: [Developer Step] Gọi GET /assets/stats
  return {
    totalAssets: 3,
    cryptoCount: 1,
    credentialCount: 1,
    documentCount: 1,
    assignedBeneficiariesCount: 3,
    vaultStatus: "ACTIVE",
  };
}

export const assetService = {
  getAssets,
  getAssetDetail,
  createAsset,
  deleteAsset,
  getVaultStats,
};
