// ==============================================================================
// SWP391 - LegacyVault: AssetStatsWidget UI Component
// Thẻ thống kê 4 chỉ số tài sản số chuẩn Luxury UI Kit Heritage Forest
// ==============================================================================

import { Shield, Coins, KeyRound, FileText } from "lucide-react";
import type { AssetViewModel } from "@/entities/asset";
import { ASSET_CATEGORY } from "@/entities/asset";

/**
 * @description Props cho AssetStatsWidget.
 */
export interface AssetStatsWidgetProps {
  /** Danh sách tài sản để tính toán các chỉ số */
  assets?: AssetViewModel[];
}

/**
 * @description Component hiển thị 4 thẻ thống kê tài sản số: Tổng tài sản, Crypto, Tài khoản, Tài liệu mật.
 * @param {AssetStatsWidgetProps} props Props chứa mảng assets
 * @returns {React.JSX.Element} Grid 4 thẻ stat
 * @example
 * ```tsx
 * <AssetStatsWidget assets={assets} />
 * ```
 */
export function AssetStatsWidget({ assets = [] }: AssetStatsWidgetProps) {
  const totalAssets = assets.length;
  const cryptoCount = assets.filter((a) => a.category === ASSET_CATEGORY.CRYPTO).length;
  const credentialCount = assets.filter((a) => a.category === ASSET_CATEGORY.CREDENTIAL).length;
  const documentCount = assets.filter((a) => a.category === ASSET_CATEGORY.DOCUMENT).length;

  return (
    <div className="stats">
      {/* Stat 1: Tổng tài sản */}
      <div className="card stat">
        <div className="stat-top">
          <span>Tổng Tài Sản Đã Lưu</span>
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className="stat-value">
          <strong>{totalAssets}</strong>
          <span>mục</span>
        </div>
        <div className="stat-bottom">
          <span className="text-green">● 100% Mã hóa AES-256</span>
        </div>
      </div>

      {/* Stat 2: Tiền mã hóa & Web3 */}
      <div className="card stat">
        <div className="stat-top">
          <span>Tiền Mã Hóa & Web3</span>
          <Coins className="w-4 h-4 text-gold" />
        </div>
        <div className="stat-value">
          <strong className="text-[#B88E4C]">{cryptoCount}</strong>
          <span>ví / seed</span>
        </div>
        <div className="stat-bottom">
          <span className="text-gold">Ethereum, Bitcoin, Solana</span>
        </div>
      </div>

      {/* Stat 3: Tài khoản & Mật khẩu */}
      <div className="card stat">
        <div className="stat-top">
          <span>Tài Khoản & Mật Khẩu</span>
          <KeyRound className="w-4 h-4 text-primary" />
        </div>
        <div className="stat-value">
          <strong>{credentialCount}</strong>
          <span>tài khoản</span>
        </div>
        <div className="stat-bottom">
          <span>Email, Cloud & Server</span>
        </div>
      </div>

      {/* Stat 4: Tài liệu mật & Di chúc */}
      <div className="card stat">
        <div className="stat-top">
          <span>Tài Liệu Mật & PDF</span>
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="stat-value">
          <strong>{documentCount}</strong>
          <span>tập tin</span>
        </div>
        <div className="stat-bottom">
          <span>Hợp đồng & Văn bản pháp lý</span>
        </div>
      </div>
    </div>
  );
}
