import type { AssetType } from "./asset.types";
/** @description Nhãn loại tài sản dùng chung cho adapter và Strategy. */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  CRYPTO: "Ví Tiền Mã Hóa (Crypto)",
  CREDENTIAL: "Tài Khoản Số (Credentials)",
  DOCUMENT: "Tài Liệu Số (Documents)",
};
