import React from "react";
import { Shield, Bitcoin, KeyRound, FileText, Users } from "lucide-react";
import { useVaultStats } from "../model/useAssets";

/**
 * @file AssetStatsWidget.tsx
 * @description Widget thống kê tổng quan kho tài sản số theo Master UI Kit.
 */
export const AssetStatsWidget: React.FC = () => {
  const { data: stats, isLoading } = useVaultStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Stat 1: Total Assets */}
      <div className="p-5 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] shadow-[0_2px_8px_rgba(11,41,30,0.04)] flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#66786E] uppercase tracking-wider">
            Tổng Tài Sản Số Đã Niêm Phong
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-[#0B291E]">
              {stats.totalAssets}
            </span>
            <span className="text-xs font-semibold text-[#059669] bg-[#E5EDE8] px-2 py-0.5 rounded-full">
              AES-256-GCM
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-[16px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C] shadow-sm">
          <Shield className="w-6 h-6" />
        </div>
      </div>

      {/* Stat 2: Breakdown Categories */}
      <div className="p-5 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] shadow-[0_2px_8px_rgba(11,41,30,0.04)] flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#66786E] uppercase tracking-wider">
            Phân Loại Tài Sản
          </span>
          <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-[#14241C]">
            <span className="flex items-center gap-1 text-[#B88E4C]">
              <Bitcoin className="w-3.5 h-3.5" /> {stats.cryptoCount} Crypto
            </span>
            <span className="text-[#A8A295]">•</span>
            <span className="flex items-center gap-1 text-[#0B291E]">
              <KeyRound className="w-3.5 h-3.5" /> {stats.credentialCount} Pass
            </span>
            <span className="text-[#A8A295]">•</span>
            <span className="flex items-center gap-1 text-[#66786E]">
              <FileText className="w-3.5 h-3.5" /> {stats.documentCount} Doc
            </span>
          </div>
        </div>
      </div>

      {/* Stat 3: Beneficiaries & Shamir */}
      <div className="p-5 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] shadow-[0_2px_8px_rgba(11,41,30,0.04)] flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#66786E] uppercase tracking-wider">
            Người Thụ Hưởng Đã Gán
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-[#B88E4C]">
              {stats.assignedBeneficiariesCount}
            </span>
            <span className="text-xs font-semibold text-[#14241C]">
              người thừa kế hợp pháp
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-[16px] bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-center text-[#B88E4C]">
          <Users className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
