import type { AssetType } from "../asset.types";
import type { AssetStrategy } from "./assetStrategy.interface";
import { cryptoStrategy } from "./cryptoStrategy";
import { credentialStrategy } from "./credentialStrategy";
import { documentStrategy } from "./documentStrategy";

/**
 * @file assetStrategyMap.ts
 * @description Registry Map ánh xạ từng loại tài sản với Strategy tương ứng (Design Pattern 1).
 * Tuân thủ Open/Closed Principle: Khi có loại tài sản mới (NFT, Social Media), chỉ cần thêm Strategy mà không sửa UI cũ.
 */
export const assetStrategyMap: Record<AssetType, AssetStrategy> = {
  CRYPTO: cryptoStrategy,
  CREDENTIAL: credentialStrategy,
  DOCUMENT: documentStrategy,
};

/**
 * Lấy Strategy tương ứng với loại tài sản
 * @param type Loại tài sản số
 * @returns Strategy triển khai
 */
export function getAssetStrategy(type: AssetType): AssetStrategy {
  const strategy = assetStrategyMap[type];
  if (!strategy) {
    throw new Error(`Chưa đăng ký AssetStrategy cho loại tài sản: ${type}`);
  }
  return strategy;
}

/**
 * Danh sách toàn bộ Strategy phục vụ giao diện Tabs / Dropdown chọn loại
 */
export const availableAssetStrategies: AssetStrategy[] = [
  cryptoStrategy,
  credentialStrategy,
  documentStrategy,
];
