// ==============================================================================
// SWP391 - LegacyVault: AssetStatsWidget UI Component
// Thẻ thống kê 4 chỉ số tài sản số chuẩn Luxury UI Kit Heritage Forest & Champagne Gold
// ==============================================================================

import { Shield, Coins, KeyRound, FileText, Lock } from "lucide-react";
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
 * @description Component hiển thị 4 thẻ thống kê tài sản số với bố cục Grid 4 cột cân đối,
 * viền mạ vàng nhẹ, icon màu sắc đặc trưng và bóng đổ sang trọng.
 *
 * @param {AssetStatsWidgetProps} props Props chứa mảng assets
 * @returns {React.JSX.Element} Grid 4 thẻ stat
 *
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stat 1: Tổng tài sản */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-xs hover:border-[#B88E4C]/50 transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tổng Tài Sản Đã Lưu
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/10 dark:bg-emerald-500/10 flex items-center justify-center text-primary dark:text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 my-3">
          <span className="text-3xl font-bold tracking-tight text-foreground">{totalAssets}</span>
          <span className="text-xs text-muted-foreground font-medium">mục di sản</span>
        </div>
        <div className="pt-2 border-t border-border/40 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
          <Lock className="w-3 h-3" />
          <span>100% Mã hóa AES-256</span>
        </div>
      </div>

      {/* Stat 2: Tiền mã hóa & Web3 */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-xs hover:border-[#B88E4C]/50 transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tiền Mã Hóa & Web3
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#B88E4C]/15 flex items-center justify-center text-[#B88E4C]">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 my-3">
          <span className="text-3xl font-bold tracking-tight text-[#B88E4C]">{cryptoCount}</span>
          <span className="text-xs text-muted-foreground font-medium">ví & seed phrase</span>
        </div>
        <div className="pt-2 border-t border-border/40 text-xs text-[#88672F] dark:text-[#E8DCC6]">
          <span>Ethereum, Bitcoin, Solana</span>
        </div>
      </div>

      {/* Stat 3: Tài khoản & Mật khẩu */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-xs hover:border-[#B88E4C]/50 transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tài Khoản & Mật Khẩu
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/10 dark:bg-emerald-500/10 flex items-center justify-center text-primary dark:text-emerald-400">
            <KeyRound className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 my-3">
          <span className="text-3xl font-bold tracking-tight text-foreground">{credentialCount}</span>
          <span className="text-xs text-muted-foreground font-medium">tài khoản</span>
        </div>
        <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground">
          <span>Email, Cloud & Server SSH</span>
        </div>
      </div>

      {/* Stat 4: Tài liệu mật & Di chúc */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-xs hover:border-[#B88E4C]/50 transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tài Liệu Mật & PDF
          </span>
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 my-3">
          <span className="text-3xl font-bold tracking-tight text-foreground">{documentCount}</span>
          <span className="text-xs text-muted-foreground font-medium">tệp tin</span>
        </div>
        <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground">
          <span>Hợp đồng & Văn bản pháp lý</span>
        </div>
      </div>
    </div>
  );
}
