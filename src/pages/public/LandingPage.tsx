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
} from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";

/**
 * @description Trang chủ dành cho khách vãng lai (Public Guest Landing Page).
 * Giới thiệu tổng quan hệ sinh thái Két Di Sản Số LegacyVault, cơ chế Dead Man's Switch và tuân thủ Điều 644 BLDS.
 *
 * @returns {React.JSX.Element} Màn hình Landing Page
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] dark:bg-[#071710] text-[#1a2e22] dark:text-[#e5ede8] selection:bg-[#c5a059]/30">
      {/* 1. Header / Navbar Công Khai */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#071710]/85 border-b border-[#e5eddfe0] dark:border-[#163625]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Tên Thương Hiệu */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-[var(--heritage-primary,#0b291e)] dark:bg-[#103829] text-[var(--heritage-gold,#f6d483)] font-serif font-bold text-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              LV
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-wider text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4] block">
                LEGACYVAULT
              </span>
              <span className="text-[10px] tracking-widest text-[#718675] dark:text-[#90a894] uppercase block font-semibold">
                Két Di Sản Số Mật Mã Học
              </span>
            </div>
          </Link>

          {/* Menu Điều Hướng Nhanh */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#445b4c] dark:text-[#b4cbba]">
            <a href="#giai-phap" className="hover:text-[var(--heritage-primary,#0b291e)] dark:hover:text-[#f6d483] transition-colors">
              Giải Pháp
            </a>
            <a href="#dms-pulse" className="hover:text-[var(--heritage-primary,#0b291e)] dark:hover:text-[#f6d483] transition-colors">
              Dead Man's Switch
            </a>
            <a href="#phap-ly" className="hover:text-[var(--heritage-primary,#0b291e)] dark:hover:text-[#f6d483] transition-colors">
              Pháp Lý Điều 644
            </a>
            <a href="#quy-trinh" className="hover:text-[var(--heritage-primary,#0b291e)] dark:hover:text-[#f6d483] transition-colors">
              Quy Trình Bàn Giao
            </a>
          </nav>

          {/* Cụm Nút CTA */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-xs font-bold text-[#0b291e] dark:text-[#e4efe6]">
              <Link to={ROUTES.AUTH.LOGIN}>Đăng Nhập</Link>
            </Button>
            <Button
              asChild
              className="bg-[var(--heritage-primary,#0b291e)] hover:bg-[#153f2f] dark:bg-[#d4af37] dark:hover:bg-[#c19d2d] dark:text-[#0b291e] text-white font-bold text-xs rounded-xl px-4 py-2 shadow-sm"
            >
              <Link to={ROUTES.AUTH.REGISTER} className="flex items-center gap-1.5">
                <span>Khởi Tạo Két</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-gradient-to-b from-[#fafaf7] via-[#f1f6ef] to-[#fafaf7] dark:from-[#071710] dark:via-[#092217] dark:to-[#071710]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          {/* Badge Thông Báo */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#b88e4c]" />
            <span>Chuẩn Bàn Giao Di Sản Số & Pháp Lý Thừa Kế Đầu Tiên Tại Việt Nam</span>
          </div>

          {/* Heading Chính */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4] leading-[1.15] tracking-tight">
            Bảo Vệ Trọn Vẹn Di Sản Số <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#99732e] via-[#c5a059] to-[#8d6722] dark:from-[#f6d483] dark:to-[#c5a059]">
              Trao Gửi Thế Hệ Mai Sau
            </span>
          </h1>

          {/* Đoạn Mô Tả Phụ */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#4d6655] dark:text-[#a6c2ad] leading-relaxed">
            Nền tảng lưu trữ mật mã học Zero-Knowledge bảo vệ tài sản số (Crypto, mật khẩu, tài liệu di nguyện), kết hợp cơ chế kiểm tra sinh tồn <strong>Dead Man's Switch (Pulse)</strong> và bàn giao tuân thủ <strong>Điều 644 Bộ luật Dân sự</strong>.
          </p>

          {/* Cụm CTA Nổi Bật */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto h-12 px-8 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143f2e] text-white font-bold text-sm rounded-2xl shadow-md flex items-center gap-2"
            >
              <Link to={ROUTES.AUTH.REGISTER}>
                <span>Bắt Đầu Khởi Tạo Két Di Sản</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto h-12 px-6 border-[#cbdac5] dark:border-[#1d4530] text-[#0b291e] dark:text-[#f3f7f4] font-bold text-sm rounded-2xl bg-white dark:bg-[#0c2217]"
            >
              <a href="#quy-trinh">Tìm Hiểu Cơ Chế 3 Bước</a>
            </Button>
          </div>

          {/* 3 Cam Kết Bảo Mật */}
          <div className="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#0c2318]/70 border border-[#dce8d7] dark:border-[#183d29] flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#0b291e] dark:text-[#f3f7f4]">Mã Hóa Client-side</p>
                <p className="text-[11px] text-[#637d6a] dark:text-[#8ea995]">AES-256 GCM Zero-Knowledge</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#0c2318]/70 border border-[#dce8d7] dark:border-[#183d29] flex items-center gap-3">
              <KeyRound className="w-8 h-8 text-[#b88e4c] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#0b291e] dark:text-[#f3f7f4]">WebAuthn Passkey</p>
                <p className="text-[11px] text-[#637d6a] dark:text-[#8ea995]">Đăng nhập FaceID/Vân tay FIDO2</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#0c2318]/70 border border-[#dce8d7] dark:border-[#183d29] flex items-center gap-3">
              <Scale className="w-8 h-8 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#0b291e] dark:text-[#f3f7f4]">Chuẩn Pháp Lý BLDS</p>
                <p className="text-[11px] text-[#637d6a] dark:text-[#8ea995]">Phân bổ hợp pháp Điều 644</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Bốn Trụ Cột Đột Phá */}
      <section id="giai-phap" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            Hệ Sinh Thái Di Sản Số Toàn Diện
          </h2>
          <p className="text-xs sm:text-sm text-[#546e5b] dark:text-[#9db7a3]">
            Giải quyết triệt để bài toán thất lạc tài sản số và tranh chấp di chúc khi có sự cố bất khả kháng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Trụ cột 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dbe6d7] dark:border-[#1c402d] space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#0b291e] dark:text-[#f3f7f4]">
              Két Lưu Trữ Mật Mã
            </h3>
            <p className="text-xs text-[#526b5a] dark:text-[#95af9b] leading-relaxed">
              Lưu trữ an toàn Private Key ví Crypto, mật mã tài khoản ngân hàng, tài liệu di chúc video với mã hóa AES-256 phía client.
            </p>
          </div>

          {/* Trụ cột 2 */}
          <div id="dms-pulse" className="p-6 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dbe6d7] dark:border-[#1c402d] space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-[#b88e4c]">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#0b291e] dark:text-[#f3f7f4]">
              Dead Man's Switch
            </h3>
            <p className="text-xs text-[#526b5a] dark:text-[#95af9b] leading-relaxed">
              Cơ chế Pulse gửi tín hiệu định kỳ. Nếu không nhận phản hồi sau thời gian ân hạn, két sẽ tự kích hoạt quy trình bàn giao.
            </p>
          </div>

          {/* Trụ cột 3 */}
          <div id="phap-ly" className="p-6 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dbe6d7] dark:border-[#1c402d] space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#0b291e] dark:text-[#f3f7f4]">
              Pháp Lý Điều 644
            </h3>
            <p className="text-xs text-[#526b5a] dark:text-[#95af9b] leading-relaxed">
              Thuật toán tự động tính toán kỷ phần bắt buộc cho cha mẹ, vợ chồng, con chưa thành niên, đảm bảo di chúc không bị vô hiệu.
            </p>
          </div>

          {/* Trụ cột 4 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dbe6d7] dark:border-[#1c402d] space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#0b291e] dark:text-[#f3f7f4]">
              Giám Hộ Công Chứng
            </h3>
            <p className="text-xs text-[#526b5a] dark:text-[#95af9b] leading-relaxed">
              Hồ sơ đòi di sản phải kèm Giấy chứng tử được Công chứng viên xác thực trên Notary Portal trước khi mở khóa tài sản.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Quy Trình Bàn Giao 3 Bước */}
      <section id="quy-trinh" className="py-20 bg-[#f2f7ef] dark:bg-[#0a1e14] border-y border-[#dce8d8] dark:border-[#143924]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold tracking-widest text-[#99732e] dark:text-[#f6d483] uppercase">
              Cơ Chế Vận Hành Minh Bạch
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
              Quy Trình 3 Bước Bàn Giao Di Sản
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dae7d6] dark:border-[#1c422f] space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[var(--heritage-primary,#0b291e)] text-[var(--heritage-gold,#f6d483)] font-serif font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="font-serif font-bold text-sm text-[#0b291e] dark:text-[#f3f7f4]">
                Thiết Lập Két & Người Thừa Kế
              </h4>
              <p className="text-xs text-[#536e5b] dark:text-[#95af9c] leading-relaxed">
                Chủ di sản nạp danh mục tài sản, chỉ định người giám hộ (Executor) và tỷ lệ phân bổ cho người thừa kế (Beneficiary).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dae7d6] dark:border-[#1c422f] space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#b88e4c] text-white font-serif font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="font-serif font-bold text-sm text-[#0b291e] dark:text-[#f3f7f4]">
                Duy Trì Nhịp Pulse Sinh Tồn
              </h4>
              <p className="text-xs text-[#536e5b] dark:text-[#95af9c] leading-relaxed">
                Hệ thống gửi thông báo định kỳ. Chủ két chỉ cần 1 cú chạm để xác nhận vẫn an toàn (I am alive).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dae7d6] dark:border-[#1c422f] space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-serif font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="font-serif font-bold text-sm text-[#0b291e] dark:text-[#f3f7f4]">
                Xác Thực & Giải Ngân Hợp Pháp
              </h4>
              <p className="text-xs text-[#536e5b] dark:text-[#95af9c] leading-relaxed">
                Khi kích hoạt bàn giao, Công chứng viên duyệt pháp lý và giải phóng khóa mã hóa cho người thừa kế thụ hưởng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call To Action Cuối Trang */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
          Sẵn Sàng Bảo Vệ Di Sản Cho Gia Đình Bạn?
        </h2>
        <p className="text-xs sm:text-sm text-[#4e6757] dark:text-[#9bb5a1] max-w-xl mx-auto">
          Chỉ mất 2 phút để khởi tạo két di sản số an toàn bảo mật chuẩn quốc tế.
        </p>
        <div className="pt-2">
          <Button
            size="lg"
            asChild
            className="h-12 px-8 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2e] dark:bg-[#d4af37] dark:text-[#0b291e] text-white font-bold text-sm rounded-2xl shadow-md"
          >
            <Link to={ROUTES.AUTH.REGISTER}>Khởi Tạo Két Di Sản Miễn Phí</Link>
          </Button>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-[#e2ece0] dark:border-[#163625] bg-white/60 dark:bg-[#06140e] py-8 text-center text-xs text-[#6e8573] dark:text-[#8ea894]">
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
