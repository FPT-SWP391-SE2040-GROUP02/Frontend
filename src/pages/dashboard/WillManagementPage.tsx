import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Scale, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/shared/ui";
import { ROUTES } from "@/shared/config/routes.config";
import { WillTable, WillDetailModal, useWills, type WillViewModel } from "@/features/wills";
import { AppHeader } from "@/widgets";

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
  const totalBeneficiaries =
    willsData?.items.reduce((sum, w) => sum + (w.beneficiaryCount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-heritage-surface text-heritage-text flex flex-col font-sans">
      {/* Master AppHeader tích hợp Role Switcher & Demo Mode */}
      <AppHeader />

      {/* Main Container */}
      <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-4 py-5 sm:px-6 lg:py-6 space-y-6">
        {/* Banner */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] text-xs font-semibold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#059669]" />
              <span>Chứng thư di chúc số ký mật mã học ECDSA P-256 & Băm SHA-256</span>
            </div>
            <h1 className="text-2xl font-bold text-heritage-primary tracking-normal">
              Quản Lý Bản Di Chúc Số (Digital Wills & Testaments)
            </h1>
            <p className="text-xs sm:text-sm text-[#66786E] mt-1.5 leading-relaxed max-w-2xl">
              Danh mục các bản di chúc điện tử định đoạt tài sản số, bảo vệ quyền thừa kế của người
              thụ hưởng theo quy định Bộ Luật Dân Sự 2015.
            </p>
          </div>

          <Button
            onClick={() => navigate(ROUTES.WILLS.NEW)}
            className="min-h-11 w-full sm:w-auto justify-self-start px-4 rounded-lg bg-heritage-primary hover:bg-[#133E2F] text-white font-semibold text-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-heritage-gold"
          >
            <Plus className="w-4 h-4 text-[#B88E4C]" />
            <span>Khởi Tạo Bản Di Chúc Mới</span>
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 [&>div]:min-w-0 [&>div]:rounded-lg [&>div]:p-4 [&>div]:gap-3 [&>div>div:last-child]:shrink-0">
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
                <span className="text-3xl font-black text-[#B88E4C]">{totalBeneficiaries}</span>
                <span className="text-xs font-semibold text-[#14241C]">người thụ hưởng</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-[16px] bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-center text-[#B88E4C]">
              <Scale className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <section
            aria-label="Căn cứ pháp lý di chúc điện tử"
            className="min-w-0 border-t border-heritage-border pt-6 space-y-4 lg:order-2 lg:col-span-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6"
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
                  Bản di chúc số trên LegacyVault đáp ứng đầy đủ điều kiện về hình thức và nội dung
                  theo Điều 630 BLDS, kết hợp video tuyên thệ minh mẫn 15s và chữ ký số định danh để
                  đảm bảo tính pháp lý khi chuyển giao cho Công chứng viên đối soát.
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
          <div className="min-w-0 lg:order-1 lg:col-span-8">
            <WillTable
              onSelectWill={(will) => setSelectedWill(will)}
              onOpenCreateWizard={() => navigate(ROUTES.WILLS.NEW)}
            />
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <WillDetailModal will={selectedWill} onClose={() => setSelectedWill(null)} />

      {/* Footer */}
      <footer className="bg-[#FAF9F5] border-t border-[#DCD9D0] py-6 px-4 text-center text-xs text-[#66786E] mt-auto">
        <p>
          © 2026 LegacyVault Protocol. Nền tảng Két Di Sản Số Mật Mã Học & Bàn Giao Pháp Lý Chuẩn
          FPT SWP391.
        </p>
      </footer>
    </div>
  );
};
