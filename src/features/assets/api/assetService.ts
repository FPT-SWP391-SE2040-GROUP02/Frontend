import { APP_MESSAGES } from "@/shared/constants";

/** Legacy contracts retained for callers; no fixture or simulated successful operation. */

// TODO: Integrate only after matching the official Backend DTOs and permission rules.

// Input/output: typed signatures below; no fixture fallback.

// Steps: confirm contract, validate schema, call service, publish confirmed result through hooks.

// API/library: existing official services, Zod and TanStack Query; do not invent endpoints.

// Edges: auth failures, missing resources, version conflicts and duplicate writes must remain errors.

import type { AssetItemDto, AssetVaultStats, CreateAssetRequest } from "../model/asset.types";

import type { ApiResponse, PaginatedList, PaginationParams } from "@/shared/types";

/**
 * Lấy danh sách tài sản số có phân trang và lọc theo loại
 * @param params Tham số phân trang (pageIndex, pageSize, searchTerm, sortColumn...)
 * @returns Promise chứa PaginatedList<AssetItemDto>
 */
export async function getAssets(
  _params?: PaginationParams & {
    assetType?: string;
  },
): Promise<PaginatedList<AssetItemDto>> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Lấy chi tiết một tài sản số theo ID
 * @param id Định danh tài sản
 * @returns Promise chứa AssetItemDto
 */
export async function getAssetDetail(_id: string): Promise<AssetItemDto> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Tạo mới tài sản số vào kho di sản
 * @param payload Dữ liệu tạo tài sản đã mã hóa Zero-Knowledge
 * @returns Promise chứa ApiResponse<AssetItemDto>
 */
export async function createAsset(
  _payload: CreateAssetRequest,
): Promise<ApiResponse<AssetItemDto>> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Xóa một tài sản số khỏi kho
 * @param id Định danh tài sản cần xóa
 * @returns Promise ApiResponse
 */
export async function deleteAsset(_id: string): Promise<ApiResponse<null>> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Lấy số liệu thống kê kho tài sản
 * @returns Promise AssetVaultStats
 */
export async function getVaultStats(): Promise<AssetVaultStats> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

export const assetService = {
  getAssets,
  getAssetDetail,
  createAsset,
  deleteAsset,
  getVaultStats,
};
