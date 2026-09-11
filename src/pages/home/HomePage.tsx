import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { ROUTES } from "@/shared/config/routes.config";
import {
  ShieldCheck,
  Lock,
  ScrollText,
  Clock,
  ArrowRight,
  Scale,
  KeyRound,
  FileText,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

/**
 * @description Trang chủ giới thiệu nền tảng LegacyVault — Hệ thống Quản lý Tài sản số & Bàn giao Di sản số.
 * Phản ánh chính xác tầm nhìn Legal-Tech, tuân thủ Bộ luật Dân sự 2015 và Luật Giao dịch điện tử 2023.
 */
export function HomePage() {
  return (
    <div className="space-y-16 py-4 pb-20">
      {/* 1. Hero Section */}
      <section className="text-center space-y-6 pt-10 md:pt-16 max-w-4xl mx-auto px-4">
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="gap-2 py-1.5 px-4 text-xs font-semibold bg-[var(--gold-light,#fbf7ee)] dark:bg-[#1f1c13] text-[#7d5d28] dark:text-[var(--gold,#d4af37)] border-[var(--gold-border,#e8dcc6)] dark:border-[#423c28] rounded-full shadow-xs"
          >
            <Scale className="h-3.5 w-3.5" />
            Căn cứ Pháp lý: Bộ luật Dân sự 2015 & Luật Giao dịch điện tử 2023
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4] leading-tight">
          Bảo Vệ Tài Sản Số Trọn Đời. <br className="hidden sm:inline" />
          <span className="text-[var(--heritage-gold,#b88e4c)] dark:text-[var(--gold,#d4af37)]">
            Bàn Giao Di Sản
          </span>{" "}
          Cho Thế Hệ Mai Sau.
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[var(--text-muted,#617369)] leading-relaxed font-testament italic">
          "Giải quyết dứt điểm tình trạng tài sản số vô chủ khi qua đời với công nghệ mã hóa
          Zero-Knowledge, cơ chế giám sát sinh tồn Dead Man's Switch và quy trình thẩm định công chứng
          số hợp pháp."
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link to={ROUTES.DASHBOARD.ROOT}>
            <Button
              size="lg"
              className="gap-2.5 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#133e2f] text-white shadow-md px-6 py-5.5 text-sm font-semibold rounded-xl transition-all"
            >
              <span>🏛️</span> Vào Két Sắt Di Sản <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={ROUTES.AUTH.LOGIN}>
            <Button
              size="lg"
              variant="outline"
              className="px-6 py-5.5 text-sm font-semibold rounded-xl border-[#e2e8e3] hover:bg-[var(--primary-light,#ebf3ee)] hover:text-[var(--primary,#0b291e)]"
            >
              Đăng Nhập Cổng Quản Trị
            </Button>
          </Link>
        </div>

        {/* Mini Trust Badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted,#617369)] font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> AES-256-GCM Client-Side
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Ngưỡng 2/3 Shamir Secret Sharing
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Xác thực Công chứng viên (Notary)
          </span>
        </div>
      </section>

      {/* 2. Ba Nhóm Dữ Liệu Di Sản Số (Phân định theo Điều 105 & Điều 612 BLDS) */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
            Phân Loại Di Sản Số
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
            3 Nhóm Dữ Liệu Trong Két Sắt Bảo Vệ
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted,#617369)] max-w-xl mx-auto">
            Xử lý tách bạch giữa quyền tài sản có giá trị kinh tế và quyền nhân thân theo chuẩn mực pháp
            luật dân sự.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Nhóm 1 */}
          <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] hover:shadow-md transition-all rounded-xl">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--gold-light,#fbf7ee)] text-[var(--heritage-gold,#b88e4c)] mb-3 border border-[var(--gold-border,#e8dcc6)]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="text-xs font-semibold text-[var(--heritage-gold,#b88e4c)] uppercase tracking-wider">
                Nhóm 1 · Kinh Tế
              </div>
              <CardTitle className="text-lg font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
                Di Sản Số Có Giá Trị Kinh Tế
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed text-[var(--text-muted,#617369)]">
                Ví tiền mã hóa (Multi-sig cold storage, Private keys), tài khoản thương mại điện tử, tên
                miền, bản quyền phần mềm và kênh nội dung có doanh thu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                ✓ Bàn giao quyền sở hữu & kiểm soát trực tiếp cho Người thụ hưởng.
              </div>
            </CardContent>
          </Card>

          {/* Nhóm 2 */}
          <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] hover:shadow-md transition-all rounded-xl">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--primary-light,#ebf3ee)] text-[var(--heritage-primary,#0b291e)] mb-3 border border-[#d8e4dc]">
                <ScrollText className="h-5 w-5" />
              </div>
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Nhóm 2 · Tình Cảm
              </div>
              <CardTitle className="text-lg font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
                Kỷ Vật & Ký Ức Số Gia Tộc
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed text-[var(--text-muted,#617369)]">
                Kho ảnh lưu niệm gia đình, thư từ tâm huyết dặn dò con cháu, tài liệu gia phả, nhật ký
                cá nhân và các tác phẩm sáng tạo tinh thần.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-semibold text-[var(--heritage-primary,#0b291e)] dark:text-[#c4d6cd] bg-[var(--primary-light,#ebf3ee)] dark:bg-[#133327] p-2.5 rounded-lg border border-[#d8e4dc] dark:border-[#1d3b2f]">
                ✓ Bàn giao lưu niệm cho người thân được chỉ định làm kỷ vật thừa kế.
              </div>
            </CardContent>
          </Card>

          {/* Nhóm 3 */}
          <Card className="border-[#e2e8e3] dark:border-[#1d3b2f] bg-white dark:bg-[#0a1d15] hover:shadow-md transition-all rounded-xl">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-700 mb-3 border border-red-200">
                <Lock className="h-5 w-5" />
              </div>
              <div className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                Nhóm 3 · Bảo Mật Nhân Thân
              </div>
              <CardTitle className="text-lg font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
                Dữ Liệu Bảo Vệ Đời Tư (Điều 38 BLDS)
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed text-[var(--text-muted,#617369)]">
                Tin nhắn riêng tư, tài khoản mạng xã hội cá nhân, mật khẩu nhạy cảm không muốn bất kỳ ai
                tiếp cận sau khi qua đời để bảo vệ danh dự cá nhân.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-semibold text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900/40">
                ⚡ Tự động hủy mật mã (Cryptographic Burn) — Xóa vĩnh viễn khóa giải mã.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. Quy Trình Chuyển Giao Di Sản 4 Bước Chuẩn Mực */}
      <section className="bg-white dark:bg-[#0a1d15] border border-[#e2e8e3] dark:border-[#1d3b2f] rounded-2xl p-6 sm:p-10 space-y-8 shadow-xs">
        <div className="text-center space-y-2">
          <Badge
            variant="outline"
            className="text-xs uppercase font-semibold text-[var(--heritage-gold,#b88e4c)] border-[var(--gold-border,#e8dcc6)]"
          >
            Quy Trình Pháp Lý 4 Bước
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
            Hành Trình Bàn Giao Di Sản Số Tự Động
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted,#617369)] max-w-lg mx-auto">
            Đảm bảo quyền năng tối thượng của chủ sở hữu khi còn sống và thực thi ý chí chính xác khi
            qua đời.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 p-4 rounded-xl bg-[#faf9f5] dark:bg-[#0f281f] border border-[#e8dcc6] dark:border-[#2d4d3d]">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[var(--heritage-gold,#b88e4c)]">01</span>
              <ShieldCheck className="h-5 w-5 text-[var(--heritage-primary,#0b291e)] dark:text-[#c4d6cd]" />
            </div>
            <h3 className="font-bold text-sm text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
              Khởi Tạo Két Sắt E2EE
            </h3>
            <p className="text-xs text-[var(--text-muted,#617369)] leading-relaxed">
              Dữ liệu được mã hóa đối xứng AES-256-GCM trực tiếp tại trình duyệt trước khi gửi lên máy
              chủ (Zero-Knowledge).
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-[#faf9f5] dark:bg-[#0f281f] border border-[#e8dcc6] dark:border-[#2d4d3d]">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[var(--heritage-gold,#b88e4c)]">02</span>
              <Scale className="h-5 w-5 text-[var(--heritage-primary,#0b291e)] dark:text-[#c4d6cd]" />
            </div>
            <h3 className="font-bold text-sm text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
              Rà Soát Điều 644 BLDS
            </h3>
            <p className="text-xs text-[var(--text-muted,#617369)] leading-relaxed">
              Hệ thống tự động kiểm tra tỷ lệ 2/3 suất thừa kế bắt buộc cho cha mẹ, vợ chồng và con chưa
              thành niên.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-[#faf9f5] dark:bg-[#0f281f] border border-[#e8dcc6] dark:border-[#2d4d3d]">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[var(--heritage-gold,#b88e4c)]">03</span>
              <Sparkles className="h-5 w-5 text-[var(--heritage-primary,#0b291e)] dark:text-[#c4d6cd]" />
            </div>
            <h3 className="font-bold text-sm text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
              Tuyên Thệ Minh Mẫn (Đ.630)
            </h3>
            <p className="text-xs text-[var(--text-muted,#617369)] leading-relaxed">
              Ghi hình webcam 15 giây tuyên thệ tự nguyện và ký số ECDSA lên mã băm toàn vẹn
              manifest_hash.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-[#faf9f5] dark:bg-[#0f281f] border border-[#e8dcc6] dark:border-[#2d4d3d]">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[var(--heritage-gold,#b88e4c)]">04</span>
              <Clock className="h-5 w-5 text-[var(--heritage-primary,#0b291e)] dark:text-[#c4d6cd]" />
            </div>
            <h3 className="font-bold text-sm text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
              Giám Sát DMS & Công Chứng
            </h3>
            <p className="text-xs text-[var(--text-muted,#617369)] leading-relaxed">
              Khi chủ kho mất liên lạc và Công chứng viên thẩm định Giấy chứng tử số, khóa Shamir 2/3 tự
              động giải phóng.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Bottom Call To Action */}
      <section className="text-center space-y-5 bg-[var(--primary-light,#ebf3ee)] dark:bg-[#0e241b] border border-[#d8e4dc] dark:border-[#1d3b2f] p-8 sm:p-12 rounded-2xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f6f4]">
          Sẵn Sàng Bảo Vệ Di Sản Số Của Bạn Ngay Hôm Nay?
        </h2>
        <p className="max-w-xl mx-auto text-xs sm:text-sm text-[var(--text-muted,#617369)] leading-relaxed">
          Trải nghiệm ngay bản nguyên mẫu hoạt động đầy đủ tính năng của LegacyVault trước buổi họp thẩm
          định đề tài.
        </p>
        <div className="flex justify-center pt-2">
          <Link to={ROUTES.DASHBOARD.ROOT}>
            <Button
              size="lg"
              className="gap-2 bg-[var(--heritage-gold,#b88e4c)] hover:bg-[var(--gold-hover,#a07839)] text-white shadow-md px-8 py-5.5 text-sm font-semibold rounded-xl"
            >
              <FileText className="h-4 w-4" /> Mở Bảng Điều Khiển Quản Trị
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

