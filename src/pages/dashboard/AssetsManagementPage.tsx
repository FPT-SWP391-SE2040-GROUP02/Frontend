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
  useVaultStats 
} from "@/features/assets";
import type { AssetViewModel } from "@/features/assets";

/**
 * @file AssetsManagementPage.tsx
 * @description Màn hình Quản lý Kho Tài Sản Số (Digital Asset Vault Management).
 * Áp dụng 5 Trụ Cột UI/UX Quốc Tế (NN/g 10 Usability Heuristics, WCAG 2.1 AA, 8pt Grid, 60-30-10, Laws of UX).
 */
export const AssetsManagementPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetViewModel | null>(null);

  // Lấy dữ liệu thống kê để hiển thị số lượng theo từng danh mục trên filter pill (Heuristic #6: Recognition rather than Recall)
  const { data: stats } = useVaultStats();

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
      {/* Top Header - WCAG Touch Target compliant navigation */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#DCD9D0] px-4 sm:px-8 py-3 flex items-center justify-between shadow-[0_2px_12px_rgba(11,41,30,0.03)]">
        <div className="flex items-center gap-6">
          <Link 
            to={ROUTES.HOME} 
            className="flex items-center gap-2.5 rounded-[14px] p-1.5 focus-visible:ring-2 focus-visible:ring-[#B88E4C] focus-visible:outline-none"
            aria-label="LegacyVault Trang Chủ"
          >
            <div className="w-10 h-10 rounded-[14px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C] shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-[#0B291E] tracking-tight">
              Legacy<span className="text-[#B88E4C]">Vault</span>
            </span>
          </Link>

          {/* Breadcrumbs (Tactile pill styling) */}
          <nav 
            aria-label="Breadcrumb"
            className="hidden md:flex items-center gap-2 text-xs bg-[#EFECE6] px-3.5 py-2 rounded-full border border-[#DCD9D0]"
          >
            <Link 
              to={ROUTES.HOME} 
              className="text-[#66786E] hover:text-[#0B291E] font-medium transition-colors focus-visible:underline"
            >
              Trang Chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <span className="text-[#66786E] font-medium">Quản Trị Két</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <span className="font-bold text-[#0B291E]">Kho Tài Sản Số</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.DMS.ROOT}
            className="min-h-[44px] text-xs font-bold text-[#66786E] hover:text-[#0B291E] px-4 py-2 rounded-[16px] hover:bg-[#EFECE6] flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[#059669]"
            aria-label="Chuyển đến trang Dead Man's Switch"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse" />
            <Radio className="w-4 h-4 text-[#059669]" />
            <span className="hidden sm:inline">Dead Man's Switch</span>
          </Link>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="min-h-[44px] rounded-[18px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-5 shadow-sm flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            <Plus className="w-4 h-4 text-[#B88E4C]" />
            <span>Thêm Tài Sản</span>
          </Button>
        </div>
      </header>

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
            onClick={() => setIsCreateOpen(true)}
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
                  onClick={() => setSelectedFilter(tab.value)}
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
            onSelectAsset={(asset) => setSelectedAsset(asset)}
            onOpenCreateModal={() => setIsCreateOpen(true)}
          />
        </section>
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
        <p>© 2026 LegacyVault Protocol. Nền tảng Két Di Sản Số Mật Mã Học & Bàn Giao Pháp Lý Chuẩn FPT SWP391.</p>
      </footer>
    </div>
  );
};
