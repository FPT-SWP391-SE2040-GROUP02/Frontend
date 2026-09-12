// ==============================================================================
// SWP391 - LegacyVault: Asset Strategy Registry Map (Strategy Pattern)
// Điều phối và truy xuất chiến lược xử lý tài sản tương ứng động
// Loại bỏ hoàn toàn switch-case phân nhánh ở UI (Open/Closed Principle)
// ==============================================================================

import { ASSET_CATEGORY, type AssetCategory } from "@/entities/asset";
import type { AssetStrategy } from "./assetStrategy.interface";
import { CryptoStrategy } from "./cryptoStrategy";
import { CredentialStrategy } from "./credentialStrategy";
import { DocumentStrategy } from "./documentStrategy";

/**
 * @description Bản đồ Registry ánh xạ trực tiếp từng Danh mục tài sản tới Strategy tương ứng.
 */
export const assetStrategyMap: Record<AssetCategory, AssetStrategy<unknown>> = {
  [ASSET_CATEGORY.CRYPTO]: new CryptoStrategy() as AssetStrategy<unknown>,
  [ASSET_CATEGORY.CREDENTIAL]: new CredentialStrategy() as AssetStrategy<unknown>,
  [ASSET_CATEGORY.DOCUMENT]: new DocumentStrategy() as AssetStrategy<unknown>,
};

/**
 * @description Hàm helper lấy chiến lược xử lý tài sản theo danh mục.
 * @param {AssetCategory} category Danh mục tài sản (CRYPTO, CREDENTIAL, DOCUMENT)
 * @returns {AssetStrategy<unknown>} Chiến lược xử lý tương ứng
 * @throws {Error} Ném lỗi nếu danh mục chưa được đăng ký trong hệ thống
 * @example
 * ```ts
 * const strategy = getAssetStrategy(ASSET_CATEGORY.CRYPTO);
 * strategy.renderFormFields(control, errors);
 * ```
 */
export function getAssetStrategy(category: AssetCategory): AssetStrategy<unknown> {
  const strategy = assetStrategyMap[category];
  if (!strategy) {
    throw new Error(`Chiến lược xử lý cho danh mục tài sản [${category}] chưa được đăng ký trong hệ thống.`);
  }
  return strategy;
}


export * from "./assetStrategy.interface";
export * from "./cryptoStrategy";
export * from "./credentialStrategy";
export * from "./documentStrategy";
