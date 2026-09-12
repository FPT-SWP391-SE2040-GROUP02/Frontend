import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  HeartPulse,
  Scale,
  Users,
  Eye,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  KeyRound,
  FileCheck,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { LiveDmsPulseCard } from "@/shared/ui/LiveDmsPulseCard";
import { MaskedKeyDisplay } from "@/shared/ui/MaskedKeyDisplay";
import { ComplianceCallout } from "@/shared/ui/ComplianceCallout";
import { LegalDropzone } from "@/shared/ui/LegalDropzone";

/**
 * @description Trang chủ dành cho khách vãng lai (Public Guest Landing Page).
 * Thiết kế chuẩn 100% theo Master UI Kit (Heritage Forest & Champagne Gold).
 *
 * @returns {React.JSX.Element} Màn hình Landing Page
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas,#EFECE6)] dark:bg-[#071710] text-[var(--text-main,#14241C)] dark:text-[#E5EDE8] selection:bg-[var(--gold,#B88E4C)]/30 font-sans">
      {/* 1. Header / Navbar Công Khai */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF9F5]/90 dark:bg-[#071710]/90 border-b border-[#DCD9D0] dark:border-[#163625]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Tên Thương Hiệu */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-[14px] bg-[var(--primary,#0B291E)] text-[var(--gold,#B88E4C)] font-bold text-xl flex items-center justify-center shadow-[0_3px_10px_rgba(11,41,30,0.2)] group-hover:scale-105 transition-transform duration-200">
              LV
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider text-[var(--primary,#0B291E)] dark:text-[#F3F7F4] block">
                LEGACYVAULT
              </span>
              <span className="text-[10px] tracking-widest text-[var(--text-muted,#66786E)] dark:text-[#90A894] uppercase block font-semibold">
                Két Di Sản Số Mật Mã Học
              </span>
            </div>
          </Link>

          {/* Menu Điều Hướng Nhanh */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-[550] text-[var(--text-muted,#66786E)] dark:text-[#B4CBBA]">
            <a href="#giai-phap" className="hover:text-[var(--primary,#0B291E)] dark:hover:text-[#F6D483] transition-colors">
              Giải Pháp
            </a>
            <a href="#dms-pulse" className="hover:text-[var(--primary,#0B291E)] dark:hover:text-[#F6D483] transition-colors">
              Dead Man's Switch
            </a>
            <a href="#phap-ly" className="hover:text-[var(--primary,#0B291E)] dark:hover:text-[#F6D483] transition-colors">
              Pháp Lý Điều 644
            </a>
            <a href="#ui-kit-demo" className="hover:text-[var(--primary,#0B291E)] dark:hover:text-[#F6D483] transition-colors">
              Giao Diện Mẫu
            </a>
          </nav>

          {/* Cụm Nút CTA */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-xs font-[550]">
              <Link to={ROUTES.AUTH.LOGIN}>Đăng Nhập</Link>
            </Button>
            <Button asChild className="rounded-[20px] shadow-[0_3px_10px_rgba(11,41,30,0.2)]">
              <Link to={ROUTES.AUTH.REGISTER} className="flex items-center gap-1.5">
                <span>Khởi Tạo Két</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7">
          {/* Badge Thông Báo */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[20px] bg-[var(--primary-light,#E5EDE8)] dark:bg-emerald-950/60 border border-[#C9D9CE] dark:border-emerald-800 text-[var(--primary,#0B291E)] dark:text-emerald-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold,#B88E4C)]" />
            <span>Master UI Kit Heritage Forest & Champagne Gold Architecture</span>
          </div>

          {/* Heading Chính */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4] leading-[1.15] tracking-tight">
            Bảo Vệ Trọn Vẹn Di Sản Số <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8D6722] via-[#B88E4C] to-[#6E5018] dark:from-[#F6D483] dark:to-[#C5A059]">
              Trao Gửi Thế Hệ Mai Sau
            </span>
          </h1>

          {/* Đoạn Mô Tả Phụ */}
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-[var(--text-muted,#66786E)] dark:text-[#A6C2AD] leading-relaxed font-medium">
            Nền tảng ủy thác di sản số mật mã học Zero-Knowledge bảo vệ an toàn Private Key, tài liệu và tài sản số, kết hợp cơ chế kiểm tra sinh tồn <strong>Dead Man's Switch (Pulse)</strong> và tuân thủ chặt chẽ <strong>Điều 644 Bộ luật Dân sự</strong>.
          </p>

          {/* Cụm CTA Nổi Bật */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto rounded-[20px] px-8 bg-[var(--primary,#0B291E)] hover:bg-[var(--primary-hover,#133E2F)] text-white font-[550] shadow-[0_4px_14px_rgba(11,41,30,0.25)]"
            >
              <Link to={ROUTES.AUTH.REGISTER} className="flex items-center gap-2">
                <span>Khởi Tạo Két Di Sản Miễn Phí</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto rounded-[20px] px-6 bg-[var(--surface,#FAF9F5)] text-[var(--text-main,#14241C)] border-[#DDD8CB] font-[550]"
            >
              <a href="#ui-kit-demo">Trải Nghiệm 5 Component Cốt Lõi</a>
            </Button>
          </div>

          {/* 3 Cam Kết Bảo Mật */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-[12px] bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#183D29] flex items-center gap-3 shadow-[var(--shadow-raised)]">
              <div className="w-10 h-10 rounded-[8px] bg-[var(--primary-light,#E5EDE8)] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[var(--primary,#0B291E)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">Mã Hóa Client-side</p>
                <p className="text-[11px] text-[var(--text-muted,#66786E)]">AES-256 GCM Zero-Knowledge</p>
              </div>
            </div>
            <div className="p-4 rounded-[12px] bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#183D29] flex items-center gap-3 shadow-[var(--shadow-raised)]">
              <div className="w-10 h-10 rounded-[8px] bg-[var(--gold-light,#FBF7EE)] border border-[var(--gold-border,#E8DCC6)] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-[var(--gold,#B88E4C)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">WebAuthn Passkey</p>
                <p className="text-[11px] text-[var(--text-muted,#66786E)]">FaceID/Vân tay FIDO2</p>
              </div>
            </div>
            <div className="p-4 rounded-[12px] bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#183D29] flex items-center gap-3 shadow-[var(--shadow-raised)]">
              <div className="w-10 h-10 rounded-[8px] bg-[var(--primary-light,#E5EDE8)] flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-[var(--primary,#0B291E)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">Chuẩn Pháp Lý BLDS</p>
                <p className="text-[11px] text-[var(--text-muted,#66786E)]">Phân bổ hợp pháp Điều 644</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Bốn Trụ Cột Đột Phá */}
      <section id="giai-phap" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
            Hệ Sinh Thái Di Sản Số Toàn Diện
          </h2>
          <p className="text-xs text-[var(--text-muted,#66786E)]">
            Thiết kế giao diện xúc giác Heritage Sanctuary mang lại sự trang trọng và an tâm tuyệt đối.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-[12px] bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#1C402D] space-y-3 shadow-[var(--shadow-raised)]">
            <div className="w-10 h-10 rounded-[8px] bg-[var(--primary-light,#E5EDE8)] flex items-center justify-center text-[var(--primary,#0B291E)]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              Két Lưu Trữ Mật Mã
            </h3>
            <p className="text-[11.5px] text-[var(--text-muted,#66786E)] leading-relaxed">
              Lưu trữ an toàn Private Key ví Crypto, mật mã tài khoản, video di nguyện với mã hóa AES-256 phía client.
            </p>
          </div>

          <div id="dms-pulse" className="p-5 rounded-[12px] bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#1C402D] space-y-3 shadow-[var(--shadow-raised)]">
            <div className="w-10 h-10 rounded-[8px] bg-[var(--gold-light,#FBF7EE)] border border-[var(--gold-border,#E8DCC6)] flex items-center justify-center text-[var(--gold,#B88E4C)]">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              Dead Man's Switch
            </h3>
            <p className="text-[11.5px] text-[var(--text-muted,#66786E)] leading-relaxed">
              Cơ chế Pulse gửi tín hiệu định kỳ. Nếu không nhận phản hồi sau thời gian ân hạn, két sẽ kích hoạt bàn giao.
            </p>
          </div>

          <div id="phap-ly" className="p-5 rounded-[12px] bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#1C402D] space-y-3 shadow-[var(--shadow-raised)]">
            <div className="w-10 h-10 rounded-[8px] bg-[var(--primary-light,#E5EDE8)] flex items-center justify-center text-[var(--primary,#0B291E)]">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              Pháp Lý Điều 644
            </h3>
            <p className="text-[11.5px] text-[var(--text-muted,#66786E)] leading-relaxed">
              Tự động tính toán kỷ phần bắt buộc cho cha mẹ già, con nhỏ, đảm bảo di chúc không bị tranh chấp vô hiệu.
            </p>
          </div>

          <div className="p-5 rounded-[12px] bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#1C402D] space-y-3 shadow-[var(--shadow-raised)]">
            <div className="w-10 h-10 rounded-[8px] bg-[var(--primary-light,#E5EDE8)] flex items-center justify-center text-[var(--primary,#0B291E)]">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              Giám Hộ Công Chứng
            </h3>
            <p className="text-[11.5px] text-[var(--text-muted,#66786E)] leading-relaxed">
              Hồ sơ đòi di sản được Công chứng viên thẩm định và đối soát Giấy chứng tử số trước khi giải phóng khóa mã.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Trình Diễn 5 Thành Phần Master UI Kit */}
      <section id="ui-kit-demo" className="py-16 bg-[#FAF9F5] dark:bg-[#0A1E14] border-y border-[#DCD9D0] dark:border-[#143924]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10.5px] font-bold tracking-widest text-[var(--gold,#B88E4C)] uppercase">
              Quy Chuẩn UI Kit Chuẩn Mực
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              Bộ 5 Thành Phần Nghiệp Vụ Đặc Thù (Master UI Kit)
            </h2>
          </div>

          {/* Stepper 4 bước pháp lý */}
          <div className="bg-[var(--bg-canvas,#EFECE6)] dark:bg-[#071710] p-4 sm:p-6 rounded-[12px] border border-[#DDD8CB] dark:border-[#1C422F]">
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted,#66786E)] font-bold mb-4 text-center sm:text-left">
              4-Step Legal Protocol Stepper
            </div>
            <div className="stepper-wrap flex justify-around items-center">
              <div className="step-item flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-[var(--primary,#0B291E)] text-white text-xs font-bold flex items-center justify-center">
                  ✓
                </div>
                <span className="text-[10.5px] text-[var(--text-muted,#66786E)] font-semibold">1. Asset Vault</span>
              </div>
              <div className="step-item active flex flex-col items-center gap-1 relative">
                <div className="hidden sm:block absolute -top-8 bg-[var(--primary,#0B291E)] text-white text-[9.5px] px-2 py-0.5 rounded-[4px] whitespace-nowrap">
                  Current: Heirs & Directives
                </div>
                <div className="w-7 h-7 rounded-full bg-[var(--primary,#0B291E)] text-white text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <span className="text-[10.5px] text-[var(--primary,#0B291E)] font-bold">2. Heirs & Rules</span>
              </div>
              <div className="step-item flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-[#0C2217] border border-[#B8B2A4] text-xs font-bold text-[var(--text-muted,#66786E)] flex items-center justify-center">
                  3
                </div>
                <span className="text-[10.5px] text-[var(--text-muted,#66786E)] font-medium">3. Notary Review</span>
              </div>
              <div className="step-item flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-[#0C2217] border border-[#B8B2A4] text-xs font-bold text-[var(--text-muted,#66786E)] flex items-center justify-center">
                  4
                </div>
                <span className="text-[10.5px] text-[var(--text-muted,#66786E)] font-medium">4. Smart Seal</span>
              </div>
            </div>
          </div>

          {/* Grid các Component UI Kit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Masked Key */}
            <MaskedKeyDisplay
              secretKey="0x7F9A2C8B31E4092D89A1B2C3D4E5F6A7"
              seedPhrase={["ocean", "vintage", "shield", "legacy", "glacier", "timber"]}
            />

            {/* 2. Live DMS */}
            <LiveDmsPulseCard
              timeLeft="45 Days : 14 Hours Left"
              sealHash="8f4b2a9c1e3d5f7a9b0c2e4f6a8d0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e"
              onImAlive={() => alert("Nhịp tim kiểm tra sinh tồn đã được cập nhật an toàn!")}
            />

            {/* 3. Dropzone */}
            <LegalDropzone
              title="Kéo thả bản scan Giấy chứng tử số"
              subtitle="Hỗ trợ PDF, JPG, PNG (Tối đa 5MB)"
              sealLabel="🔒 Tự động đóng dấu băm SHA-256"
            />

            {/* 4. Compliance Callout */}
            <ComplianceCallout
              title="⚖️ Cảnh báo pháp lý: Thừa kế Điều 644 BLDS 2015"
              description="Kế hoạch phân bổ cần chỉ định kỷ phần bắt buộc cho cha mẹ già hoặc con chưa thành niên để đảm bảo không bị tuyên vô hiệu."
            />
          </div>
        </div>
      </section>

      {/* 5. Call To Action Cuối Trang */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4 sm:px-6 space-y-5">
        <h2 className="text-2xl sm:text-4xl font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
          Sẵn Sàng Bảo Vệ Di Sản Cho Gia Đình Bạn?
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted,#66786E)] max-w-xl mx-auto font-medium">
          Khởi tạo két di sản số an toàn bảo mật chuẩn mật mã học và pháp lý Việt Nam.
        </p>
        <div className="pt-2">
          <Button
            size="lg"
            asChild
            className="rounded-[20px] px-8 bg-[var(--primary,#0B291E)] hover:bg-[var(--primary-hover,#133E2F)] text-white font-[550] shadow-[0_4px_14px_rgba(11,41,30,0.25)]"
          >
            <Link to={ROUTES.AUTH.REGISTER}>Khởi Tạo Két Di Sản Miễn Phí</Link>
          </Button>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-[#DCD9D0] dark:border-[#163625] bg-[#FAF9F5] dark:bg-[#06140E] py-8 text-center text-xs text-[var(--text-muted,#66786E)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 LegacyVault. Dự án đồ án kỹ thuật phần mềm SWP391 - ĐH FPT.</p>
          <div className="flex items-center gap-6 font-semibold">
            <Link to={ROUTES.AUTH.LOGIN} className="hover:underline">Đăng Nhập</Link>
            <Link to={ROUTES.AUTH.REGISTER} className="hover:underline">Đăng Ký</Link>
            <a href="#giai-phap" className="hover:underline">Giải Pháp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
