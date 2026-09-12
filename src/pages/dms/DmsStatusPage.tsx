import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  DmsHeartbeatCard, 
  DmsConfigModal, 
  DmsPingHistoryModal 
} from "@/features/dms";
import { 
  Shield, 
  BookOpen, 
  Scale, 
  ChevronRight, 
  Info, 
  Radio, 
  Bell, 
  Lock 
} from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @file DmsStatusPage.tsx
 * @description Màn hình tổng quan Nhịp Sinh Tồn Dead Man's Switch (DMS Status & Heartbeat Hub).
 * Tuân thủ Master UI Kit và Design System của LegacyVault.
 */

export const DmsStatusPage: React.FC = () => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#EFECE6] text-[#14241C] flex flex-col font-sans">
      {/* Top Navigation Bar */}
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

          {/* Breadcrumb Pill */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs bg-[#EFECE6] px-3 py-1.5 rounded-full border border-[#DCD9D0]">
            <Link to={ROUTES.HOME} className="text-[#66786E] hover:text-[#0B291E]">
              Trang Chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <span className="font-semibold text-[#0B291E]">Dead Man's Switch</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.BILLING.PLANS}
            className="text-xs font-semibold text-[#66786E] hover:text-[#0B291E] px-3 py-1.5 rounded-[16px] hover:bg-[#EFECE6] transition-colors"
          >
            Bảng Giá
          </Link>
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="text-xs font-bold text-white bg-[#0B291E] hover:bg-[#133E2F] px-4 py-2 rounded-[16px] shadow-sm transition-all"
          >
            Đăng Nhập
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Page Title Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 text-[#059669] animate-pulse" />
            <span>Giao thức kiểm tra sinh tồn mật mã học 24/7</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#0B291E] tracking-tight mb-2">
            Trung Tâm Nhịp Sinh Tồn (Dead Man's Switch)
          </h1>
          <p className="text-sm sm:text-base text-[#66786E] max-w-3xl leading-relaxed">
            Hệ thống tự động giám sát tín hiệu hoạt động định kỳ của bạn. Nếu quá hạn và không nhận được phản hồi sau thời gian ân hạn, quy trình mở khóa và bàn giao di sản số sẽ được kích hoạt an toàn cho Người thừa kế hợp pháp.
          </p>
        </div>

        {/* Master UI Kit Component #2: Live Heartbeat Card */}
        <DmsHeartbeatCard
          onOpenConfig={() => setIsConfigOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />

        {/* Master UI Kit Component #5: Hộp Cảnh Báo Tuân Thủ Pháp Luật (Điều 644/612/630 BLDS) */}
        <div className="p-6 rounded-[20px] bg-[#FFFBEB] border border-[#FDE68A] shadow-[0_2px_12px_rgba(217,119,6,0.06)] relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[12px] bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309] shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#92400E]">
                  Quy Chuẩn Pháp Lý & Hiệu Lực Kích Hoạt (Điều 612 & Điều 630 Bộ luật Dân sự 2015)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#78350F] leading-relaxed">
                Theo quy định pháp luật Việt Nam, việc chuyển giao tài sản số và di chúc điện tử chỉ có hiệu lực pháp lý khi có sự kiện tử vong được xác lập bằng <strong>Giấy chứng tử điện tử</strong> hoặc phán quyết của Tòa án có thẩm quyền. Giao thức Dead Man's Switch đóng vai trò <em>công cụ dự phòng kỹ thuật</em> kích hoạt quy trình thẩm tra hồ sơ công chứng (Legal Notary Verification) trước khi giải mã kho khóa riêng.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-[#B45309]">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Điều 644: Quyền thừa kế không phụ thuộc nội dung di chúc
                </span>
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Điều 612: Di sản bao gồm tài sản số có giá trị pháp lý
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Protocol 3-Pillars Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] shadow-[0_2px_8px_rgba(11,41,30,0.04)]">
            <div className="w-10 h-10 rounded-[12px] bg-[#E5EDE8] flex items-center justify-center text-[#0B291E] mb-4">
              <Radio className="w-5 h-5 text-[#059669]" />
            </div>
            <h4 className="text-base font-bold text-[#14241C] mb-2">
              1. Nhịp Ping Định Kỳ (Pulse)
            </h4>
            <p className="text-xs text-[#66786E] leading-relaxed">
              Bạn có thể xác nhận sự hiện diện chỉ bằng 1 chạm qua Web, Email link hoặc Telegram Bot được mã hóa an toàn.
            </p>
          </div>

          <div className="p-6 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] shadow-[0_2px_8px_rgba(11,41,30,0.04)]">
            <div className="w-10 h-10 rounded-[12px] bg-[#FBF7EE] flex items-center justify-center text-[#B88E4C] mb-4">
              <Bell className="w-5 h-5 text-[#B88E4C]" />
            </div>
            <h4 className="text-base font-bold text-[#14241C] mb-2">
              2. Cảnh Báo Khẩn Đa Kênh
            </h4>
            <p className="text-xs text-[#66786E] leading-relaxed">
              Trước khi bước vào thời gian ân hạn, hệ thống tự động gửi tin nhắn SMS, gọi điện AI Voice và cảnh báo người thân được ủy quyền.
            </p>
          </div>

          <div className="p-6 bg-[#FAF9F5] border border-[#DCD9D0] rounded-[20px] shadow-[0_2px_8px_rgba(11,41,30,0.04)]">
            <div className="w-10 h-10 rounded-[12px] bg-[#EFECE6] flex items-center justify-center text-[#0B291E] mb-4">
              <Lock className="w-5 h-5 text-[#0B291E]" />
            </div>
            <h4 className="text-base font-bold text-[#14241C] mb-2">
              3. Phân Mảnh Khóa Shamir
            </h4>
            <p className="text-xs text-[#66786E] leading-relaxed">
              Kho di sản chỉ được giải phóng khi kết hợp đủ số lượng mảnh khóa mật mã học (k out of n Shamir's Secret Sharing) và xác thực tư pháp.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#FAF9F5] border-t border-[#DCD9D0] py-6 px-4 text-center text-xs text-[#66786E] mt-auto">
        <p>© 2026 LegacyVault Protocol. Nền tảng Két Di Sản Số Mật Mã Học & Bàn Giao Pháp Lý Chuẩn FPT SWP391.</p>
      </footer>

      {/* Modals */}
      <DmsConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      <DmsPingHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
