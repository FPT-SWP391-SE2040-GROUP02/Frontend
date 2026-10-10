import type { AssetType } from "@/entities/asset/model/asset.types";
export type * from "@/entities/asset/model/asset.types";

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
