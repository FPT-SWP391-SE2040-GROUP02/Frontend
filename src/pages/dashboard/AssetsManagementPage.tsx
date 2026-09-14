import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Shield, 
  Plus, 
  ChevronRight, 
  Lock, 
  Filter, 
  Radio, 
  KeyRound, 
  Bitcoin, 
  FileText, 
  Scale, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/shared/ui";
import { ROUTES } from "@/shared/config/routes.config";
import { 
  AssetTable, 
  AssetStatsWidget, 
  CreateAssetModal, 
  AssetDetailModal,
  useVaultStats,
  useAssets,
} from "@/features/assets";
import type { AssetViewModel } from "@/features/assets";
import { AppHeader } from "@/widgets";

/**
 * @file AssetsManagementPage.tsx
 * @description Màn hình Quản lý Kho Tài Sản Số (Digital Asset Vault Management).
 * Áp dụng URL Search Params (React Router) thay vì useState cục bộ cho bộ lọc và modal.
 * Áp dụng 5 Trụ Cột UI/UX Quốc Tế (NN/g 10 Usability Heuristics, WCAG 2.1 AA, 8pt Grid, 60-30-10, Laws of UX).
 */
export const AssetsManagementPage: React.FC = () => {
  // Quản lý Filter và Modal qua URL Search Params thay vì useState cục bộ
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFilter = searchParams.get("filter") || "ALL";
  const isCreateOpen = searchParams.get("modal") === "create";
  const selectedAssetId = searchParams.get("assetId");

  // Server State qua React Query
  const { data: assetsData } = useAssets({
    assetType: selectedFilter === "ALL" ? undefined : selectedFilter,
  });
  const selectedAsset = assetsData?.items.find((a) => a.id === selectedAssetId) || null;

  // Lấy dữ liệu thống kê từ React Query
  const { data: stats } = useVaultStats();

  const handleFilterChange = (filter: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (filter === "ALL") {
        next.delete("filter");
      } else {
        next.set("filter", filter);
      }
      return next;
    });
  };

  const handleOpenCreateModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("modal", "create");
      return next;
    });
  };

  const handleCloseCreateModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("modal");
      return next;
    });
  };

  const handleSelectAsset = (asset: AssetViewModel) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("assetId", asset.id);
      return next;
    });
  };

  const handleCloseDetailModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("assetId");
      return next;
    });
  };

  const filterTabs = [
    { 
      label: "Tất Cả", 
      value: "ALL", 
      icon: Filter, 
      count: stats ? stats.totalAssets : undefined 
    },
    { 
      label: "Ví Tiền Mã Hóa", 
      value: "CRYPTO", 
      icon: Bitcoin, 
      count: stats ? stats.cryptoCount : undefined 
    },
    { 
      label: "Tài Khoản Số", 
      value: "CREDENTIAL", 
      icon: KeyRound, 
      count: stats ? stats.credentialCount : undefined 
    },
    { 
      label: "Tài Liệu Mật", 
      value: "DOCUMENT", 
      icon: FileText, 
      count: stats ? stats.documentCount : undefined 
    },
  ];

  return (
    <div className="min-h-screen bg-[#EFECE6] text-[#14241C] flex flex-col font-sans">
      {/* Master AppHeader tích hợp Role Switcher & Demo Mode */}
      <AppHeader />

      {/* Main Container - 8pt Spacing Grid (32px / py-8) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Action Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] text-xs font-semibold mb-2">
              <Lock className="w-3.5 h-3.5 text-[#0B291E]" />
              <span>Giao thức mã hóa đầu cuối Zero-Knowledge (Client-side AES-256-GCM)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B291E] tracking-tight">
              Kho Lưu Trữ Tài Sản Số (Digital Asset Vault)
            </h1>
            <p className="text-xs sm:text-sm text-[#66786E] mt-1.5 leading-relaxed max-w-2xl">
              Quản lý ví tiền mã hóa, tài khoản số và tài liệu mật được bảo vệ bằng cơ chế chia sẻ bí mật Shamir (k out of n), chuyển giao theo quy trình pháp lý định trước.
            </p>
          </div>

          <Button
            onClick={handleOpenCreateModal}
            className="min-h-[48px] px-6 rounded-[20px] bg-[#0B291E] hover:bg-[#133E2F] text-white font-bold text-xs shadow-[0_4px_16px_rgba(11,41,30,0.2)] flex items-center gap-2 self-start sm:self-center transition-all hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            <Plus className="w-4 h-4 text-[#B88E4C]" />
            <span>Niêm Phong Tài Sản Mới</span>
          </Button>
        </div>

        {/* Stats Widget */}
        <AssetStatsWidget />

        {/* Legal In-Context Callout Box (NN/g Heuristic #10: Help & Documentation) */}
        <section 
          aria-label="Căn cứ pháp lý di sản số"
          className="p-5 sm:p-6 rounded-[22px] bg-[#FAF9F5] border border-[#E8DCC6] shadow-[0_2px_12px_rgba(184,142,76,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-center text-[#B88E4C] shrink-0 mt-0.5">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-[#14241C]">
                  Cơ Sở Pháp Lý Quản Lý Di Sản Số (Điều 612 Bộ Luật Dân Sự 2015)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5EDE8] text-[#0B291E] border border-[#A2C4AF]">
                  BLDS 2015
                </span>
              </div>
              <p className="text-xs text-[#66786E] mt-1 leading-relaxed max-w-3xl">
                Tài sản số, khóa bí mật ví điện tử và tài khoản dữ liệu được bảo vệ quyền tài sản theo pháp luật Việt Nam. Mọi nội dung niêm phong đều gắn liền với chữ ký số ECDSA P-256 và bằng chứng tính toàn vẹn SHA-256 phục vụ đối soát công chứng.
              </p>
            </div>
          </div>

          <a
            href="https://thuvienphapluat.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#B88E4C] hover:text-[#A07839] flex items-center gap-1 shrink-0 px-3 py-2 rounded-[12px] hover:bg-[#FBF7EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            <span>Tra cứu quy định</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </section>

        {/* Filter Pills Toolbar with >= 44px Touch Targets & Item Counts (Laws of UX: Hick's Law) */}
        <section aria-label="Bộ lọc phân loại tài sản" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleFilterChange(tab.value)}
                  className={`min-h-[44px] px-4 py-2.5 rounded-[16px] text-xs font-bold border transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#B88E4C] focus-visible:outline-none ${
                    isActive
                      ? "bg-[#0B291E] text-white border-[#0B291E] shadow-sm"
                      : "bg-[#FAF9F5] text-[#66786E] border-[#DCD9D0] hover:border-[#B88E4C] hover:text-[#0B291E]"
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#B88E4C]" : ""}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive 
                          ? "bg-[#133E2F] text-[#B88E4C]" 
                          : "bg-[#EFECE6] text-[#66786E]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Assets Table Component */}
          <AssetTable
            selectedType={selectedFilter}
            onSelectAsset={handleSelectAsset}
            onOpenCreateModal={handleOpenCreateModal}
          />
        </section>
      </main>

      {/* Modals */}
      <CreateAssetModal
        isOpen={isCreateOpen}
        onClose={handleCloseCreateModal}
      />

      <AssetDetailModal
        asset={selectedAsset}
        onClose={handleCloseDetailModal}
      />

      {/* Footer */}
      <footer className="bg-[#FAF9F5] border-t border-[#DCD9D0] py-6 px-4 text-center text-xs text-[#66786E] mt-auto">
        <p>© 2026 LegacyVault Protocol. Nền tảng Két Di Sản Số Mật Mã Học & Bàn Giao Pháp Lý Chuẩn FPT SWP391.</p>
      </footer>
    </div>
  );
};
