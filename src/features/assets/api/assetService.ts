// ==============================================================================
// SWP391 - LegacyVault: Digital Asset API Service
// Sử dụng createBaseService chuẩn FSD & SOLID (DRY) kết nối C# ASP.NET Core
// ==============================================================================

import { createBaseService, type BaseService } from "@/shared/api";
import type { PaginationParams } from "@/shared/types";
import type {
  AssetDto,
  CreateAssetRequest,
  UpdateAssetRequest,
} from "@/entities/asset";

/**
 * @description Tham số lọc danh sách tài sản số.
 */
export interface AssetFilterParams extends PaginationParams {
  /** Lọc theo ID kho lưu trữ */
  vaultId?: string;
  /** Lọc theo danh mục tài sản (CRYPTO, CREDENTIAL, DOCUMENT) */
  category?: string;
  /** Lọc theo loại quyền sở hữu */
  propertyType?: string;
}

/**
 * @description Service thực hiện các thao tác CRUD với tài sản số thông qua API.
 * Endpoint: `/digital-assets`
 */
export const assetService: BaseService<
  AssetDto,
  CreateAssetRequest,
  UpdateAssetRequest,
  AssetFilterParams
> = createBaseService<
  AssetDto,
  CreateAssetRequest,
  UpdateAssetRequest,
  AssetFilterParams
>({
  endpoint: "/digital-assets",
});
