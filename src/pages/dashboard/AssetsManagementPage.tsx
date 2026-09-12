import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Plus, 
  ChevronRight, 
  Lock, 
  Filter, 
  Radio, 
  KeyRound, 
  Bitcoin, 
  FileText 
} from "lucide-react";
import { Button } from "@/shared/ui";
import { ROUTES } from "@/shared/config/routes.config";
import { 
  AssetTable, 
  AssetStatsWidget, 
  CreateAssetModal, 
  AssetDetailModal 
} from "@/features/assets";
import type { AssetViewModel } from "@/features/assets";

/**
 * @file AssetsManagementPage.tsx
 * @description Màn hình Quản lý Kho Tài Sản Số (Digital Asset Vault Management).
 * Áp dụng Master UI Kit Heritage Forest & Champagne Gold.
 */
export const AssetsManagementPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetViewModel | null>(null);

  const filterTabs = [
    { label: "Tất Cả", value: "ALL", icon: Filter },
    { label: "Ví Tiền Mã Hóa", value: "CRYPTO", icon: Bitcoin },
    { label: "Tài Khoản Số", value: "CREDENTIAL", icon: KeyRound },
    { label: "Tài Liệu Mật", value: "DOCUMENT", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#EFECE6] text-[#14241C] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#DCD9D0] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C] shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-[#0B291E] tracking-tight">
              Legacy<span className="text-[#B88E4C]">Vault</span>
            </span>
          </Link>

          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs bg-[#EFECE6] px-3 py-1.5 rounded-full border border-[#DCD9D0]">
            <Link to={ROUTES.HOME} className="text-[#66786E] hover:text-[#0B291E]">
              Trang Chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <span className="text-[#66786E]">Quản Trị Két</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <span className="font-semibold text-[#0B291E]">Kho Tài Sản Số</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.DMS.ROOT}
            className="text-xs font-semibold text-[#66786E] hover:text-[#0B291E] px-3 py-1.5 rounded-[16px] hover:bg-[#EFECE6] flex items-center gap-1.5 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-[#059669]" />
            <span>Dead Man's Switch</span>
          </Link>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-4 py-2 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-[#B88E4C]" />
            <span>Thêm Tài Sản</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Action Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] text-xs font-semibold mb-2">
              <Lock className="w-3.5 h-3.5 text-[#0B291E]" />
              <span>Giao thức mã hóa đầu cuối Zero-Knowledge (Client-side)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B291E] tracking-tight">
              Kho Lưu Trữ Tài Sản Số (Digital Asset Vault)
            </h1>
            <p className="text-xs sm:text-sm text-[#66786E] mt-1">
              Quản lý ví tiền mã hóa, tài khoản số và tài liệu mật được bảo vệ bằng phân mảnh khóa Shamir (k out of n).
            </p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-12 px-6 rounded-[20px] bg-[#0B291E] hover:bg-[#133E2F] text-white font-bold text-xs shadow-[0_4px_16px_rgba(11,41,30,0.2)] flex items-center gap-2 self-start sm:self-center transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4 text-[#B88E4C]" />
            <span>Niêm Phong Tài Sản Mới</span>
          </Button>
        </div>

        {/* Stats Widget */}
        <AssetStatsWidget />

        {/* Filter Pills Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedFilter(tab.value)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#0B291E] text-white border-[#0B291E] shadow-sm"
                    : "bg-[#FAF9F5] text-[#66786E] border-[#DCD9D0] hover:border-[#B88E4C] hover:text-[#0B291E]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#B88E4C]" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Assets Table */}
        <AssetTable
          selectedType={selectedFilter}
          onSelectAsset={(asset) => setSelectedAsset(asset)}
          onOpenCreateModal={() => setIsCreateOpen(true)}
        />
      </main>

      {/* Modals */}
      <CreateAssetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />

      {/* Footer */}
      <footer className="bg-[#FAF9F5] border-t border-[#DCD9D0] py-6 px-4 text-center text-xs text-[#66786E] mt-auto">
        <p>© 2026 LegacyVault Protocol. Nền tảng Két Di Sản Số Mật Mã Học Chuẩn FPT SWP391.</p>
      </footer>
    </div>
  );
};
