import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  Plus, 
  ChevronRight, 
  FileText, 
  Scale, 
  CheckCircle2, 
  Radio, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/shared/ui";
import { ROUTES } from "@/shared/config/routes.config";
import {
  WillTable,
  WillDetailModal,
  useWills,
  type WillViewModel,
} from "@/features/wills";

/**
 * @file WillManagementPage.tsx
 * @description Màn hình Quản Lý Danh Sách Bản Di Chúc Số (Digital Will Management).
 * Áp dụng đầy đủ 5 Trụ cột UI/UX Quốc tế và Master UI Kit Heritage Forest & Champagne Gold.
 */

export const WillManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: willsData } = useWills();
  const [selectedWill, setSelectedWill] = useState<WillViewModel | null>(null);

  const totalWills = willsData?.items.length || 0;
  const sealedWills = willsData?.items.filter((w) => w.status === "SEALED").length || 0;
  const totalBeneficiaries = willsData?.items.reduce(
    (sum, w) => sum + (w.beneficiaryCount || 0),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-[#EFECE6] text-[#14241C] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#DCD9D0] px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 rounded-[14px] p-1.5 focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            aria-label="LegacyVault Trang Chủ"
          >
            <div className="w-10 h-10 rounded-[14px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C] shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-[#0B291E] tracking-tight">
              Legacy<span className="text-[#B88E4C]">Vault</span>
            </span>
          </Link>

          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center gap-2 text-xs bg-[#EFECE6] px-3.5 py-2 rounded-full border border-[#DCD9D0]"
          >
            <Link to={ROUTES.HOME} className="text-[#66786E] hover:text-[#0B291E]">
              Trang Chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <span className="text-[#66786E]">Quản Trị Két</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <span className="font-bold text-[#0B291E]">Di Chúc Số</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.DASHBOARD.ASSETS}
            className="min-h-[44px] text-xs font-semibold text-[#66786E] hover:text-[#0B291E] px-4 py-2 rounded-[16px] hover:bg-[#EFECE6] flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            <span>Kho Tài Sản Số</span>
          </Link>

          <Button
            onClick={() => navigate(ROUTES.WILLS.NEW)}
            className="min-h-[44px] rounded-[18px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-5 shadow-sm flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            <Plus className="w-4 h-4 text-[#B88E4C]" />
            <span>Lập Di Chúc Mới</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] text-xs font-semibold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>Chứng thư di chúc số ký mật mã học ECDSA P-256 & Băm SHA-256</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B291E] tracking-tight">
              Quản Lý Bản Di Chúc Số (Digital Wills & Testaments)
            </h1>
            <p className="text-xs sm:text-sm text-[#66786E] mt-1.5 leading-relaxed max-w-2xl">
              Danh mục các bản di chúc điện tử định đoạt tài sản số, bảo vệ quyền thừa kế của người thụ hưởng theo quy định Bộ Luật Dân Sự 2015.
            </p>
          </div>

          <Button
            onClick={() => navigate(ROUTES.WILLS.NEW)}
            className="min-h-[48px] px-6 rounded-[20px] bg-[#0B291E] hover:bg-[#133E2F] text-white font-bold text-xs shadow-[0_4px_16px_rgba(11,41,30,0.2)] flex items-center gap-2 self-start sm:self-center transition-all hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            <Plus className="w-4 h-4 text-[#B88E4C]" />
            <span>Khởi Tạo Bản Di Chúc Mới</span>
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#66786E] uppercase tracking-wider">
                Tổng Bản Di Chúc
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#0B291E]">{totalWills}</span>
                <span className="text-xs font-semibold text-[#0B291E] bg-[#E5EDE8] px-2 py-0.5 rounded-full">
                  bản ghi
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-[16px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C]">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#66786E] uppercase tracking-wider">
                Đã Niêm Phong Mật Mã
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#059669]">{sealedWills}</span>
                <span className="text-xs font-semibold text-[#059669] bg-[#E5EDE8] px-2 py-0.5 rounded-full">
                  ECDSA P-256
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-[16px] bg-[#E5EDE8] flex items-center justify-center text-[#059669]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#66786E] uppercase tracking-wider">
                Người Thừa Kế Đã Gán
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#B88E4C]">
                  {totalBeneficiaries}
                </span>
                <span className="text-xs font-semibold text-[#14241C]">người thụ hưởng</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-[16px] bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-center text-[#B88E4C]">
              <Scale className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Legal In-Context Callout Box */}
        <section
          aria-label="Căn cứ pháp lý di chúc điện tử"
          className="p-5 sm:p-6 rounded-[22px] bg-[#FAF9F5] border border-[#E8DCC6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-center text-[#B88E4C] shrink-0 mt-0.5">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-[#14241C]">
                  Giá Trị Pháp Lý Của Di Chúc Điện Tử (Điều 630 & 644 BLDS 2015)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5EDE8] text-[#0B291E]">
                  BLDS 2015
                </span>
              </div>
              <p className="text-xs text-[#66786E] mt-1 leading-relaxed max-w-3xl">
                Bản di chúc số trên LegacyVault đáp ứng đầy đủ điều kiện về hình thức và nội dung theo Điều 630 BLDS, kết hợp video tuyên thệ minh mẫn 15s và chữ ký số định danh để đảm bảo tính pháp lý khi chuyển giao cho Công chứng viên đối soát.
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

        {/* Wills Table */}
        <WillTable
          onSelectWill={(will) => setSelectedWill(will)}
          onOpenCreateWizard={() => navigate(ROUTES.WILLS.NEW)}
        />
      </main>

      {/* Detail Modal */}
      <WillDetailModal
        will={selectedWill}
        onClose={() => setSelectedWill(null)}
      />

      {/* Footer */}
      <footer className="bg-[#FAF9F5] border-t border-[#DCD9D0] py-6 px-4 text-center text-xs text-[#66786E] mt-auto">
        <p>© 2026 LegacyVault Protocol. Nền tảng Két Di Sản Số Mật Mã Học & Bàn Giao Pháp Lý Chuẩn FPT SWP391.</p>
      </footer>
    </div>
  );
};
