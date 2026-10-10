import { useState } from "react";
import { Sparkles, ShieldCheck, ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "cn";
import { PricingCard } from "@/features/billing/ui/PricingCard";
import { SepayQrModal } from "@/features/billing/ui/SepayQrModal";
import type { PricingPlan, PaymentOrder } from "@/features/billing/model/billing.types";

/**
 * Danh sách các gói dịch vụ chuẩn SRS 3.11.0 (Luồng 1A & 4G)
 */
const SRS_PLANS: PricingPlan[] = [
  // Gói Chủ sở hữu di sản (Owner)
  {
    id: "plan-owner-free",
    tier: "OWNER_FREE",
    category: "OWNER",
    name: "Owner Free",
    price: 0,
    billingCycle: "lifetime",
    cycleText: "vĩnh viễn",
    description: "Lưu trữ cá nhân và điểm danh DMS, không thiết lập di sản.",
    features: [
      "Tối đa 3 tài sản số niêm phong",
      "Dung lượng lưu trữ: 20 MB",
      "Mã hóa AES-256-GCM Envelope Encryption",
      "Nhịp sinh tồn định kỳ DMS 30 - 90 ngày",
      "Không hỗ trợ kích hoạt Kế hoạch Di sản",
    ],
    storageLimitMb: 20,
    maxAssets: 3,
    allowEstatePlan: false,
    allowPdfExport: false,
  },
  {
    id: "plan-legacy-xs",
    tier: "LEGACY_XS",
    category: "OWNER",
    name: "Legacy XS",
    price: 199000,
    billingCycle: "365_days",
    cycleText: "365 ngày",
    description: "Kế hoạch di sản tiêu chuẩn, thẩm định chứng tử và bàn giao toàn diện.",
    features: [
      "Tối đa 20 tài sản số đưa vào di sản",
      "Dung lượng lưu trữ: 200 MB",
      "Gán người nhận trực tiếp & Tự gom kho bàn giao",
      "Chỉ định Người thực thi (Executor) & Giám sát",
      "Thẩm định Giấy chứng tử Verifier độc lập",
      "Quy trình cứu hộ AliveClaim 2 bước",
    ],
    storageLimitMb: 200,
    maxAssets: 20,
    allowEstatePlan: true,
    allowPdfExport: false,
  },
  {
    id: "plan-legacy-xs-max",
    tier: "LEGACY_XS_MAX",
    category: "OWNER",
    name: "Legacy XS Max",
    price: 399000,
    billingCycle: "365_days",
    cycleText: "365 ngày",
    description: "Đầy đủ quyền năng di sản, thẩm định ưu tiên và xuất PDF Kế hoạch di sản.",
    isPopular: true,
    features: [
      "Tối đa 50 tài sản số đưa vào di sản",
      "Dung lượng lưu trữ: 500 MB",
      "Tất cả tính năng của gói Legacy XS",
      "Xuất PDF Kế hoạch Di Sản kèm tem băm SHA-256",
      "Hỗ trợ chuyển quyền 1:1 nguyên kho bàn giao",
      "Ưu tiên thẩm định hồ sơ công chứng viên số",
    ],
    storageLimitMb: 500,
    maxAssets: 50,
    allowEstatePlan: true,
    allowPdfExport: true,
  },
  // Gói Kho cá nhân Người thụ hưởng (Beneficiary / Recipient)
  {
    id: "plan-recipient-free",
    tier: "RECIPIENT_FREE",
    category: "RECIPIENT",
    name: "Kho Cá Nhân Free",
    price: 0,
    billingCycle: "lifetime",
    cycleText: "vĩnh viễn",
    description: "Dành cho người thụ hưởng lưu trữ tài sản di sản nhận được trong hạn mức cơ bản.",
    features: [
      "Tối đa 2 tài sản di sản đã tiếp nhận",
      "Dung lượng lưu trữ: 20 MB",
      "Truy cập và tải về nội dung giải mã bảo mật",
      "Lưu trữ cá nhân không phụ thuộc kho chung",
    ],
    storageLimitMb: 20,
    maxAssets: 2,
  },
  {
    id: "plan-recipient-plus",
    tier: "RECIPIENT_PLUS",
    category: "RECIPIENT",
    name: "Kho Cá Nhân Plus",
    price: 49000,
    billingCycle: "30_days",
    cycleText: "30 ngày",
    description: "Mở rộng dung lượng kho cá nhân lưu trữ toàn bộ tài sản di sản tiếp nhận được.",
    isPopular: true,
    features: [
      "Tối đa 10 tài sản di sản đã tiếp nhận",
      "Dung lượng lưu trữ: 200 MB",
      "Tải về tốc độ cao không giới hạn băng thông",
      "Lưu trữ dài hạn nội dung di sản giá trị cao",
    ],
    storageLimitMb: 200,
    maxAssets: 10,
  },
];

/**
 * @description Màn hình Bảng Giá & Nâng Cấp Gói Két Di Sản (PricingPlansPage).
 * Tích hợp cổng thanh toán tự động VietQR SePay theo Master UI Kit.
 *
 * @returns {React.JSX.Element} Màn hình bảng giá
 */
export function PricingPlansPage() {
  const [selectedCategory, setSelectedCategory] = useState<"OWNER" | "RECIPIENT">("OWNER");
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);


  const handleSelectPlan = (plan: PricingPlan) => {
    // Gói miễn phí không cần sinh mã QR
    if (plan.price === 0) {
      alert(`Bạn đang sử dụng gói ${plan.name} Miễn Phí!`);
      return;
    }

    // Khởi tạo đơn hàng thanh toán SePay VietQR (chuẩn Napas 247)
    const mockOrder: PaymentOrder = {
      orderId: `ORD-${Date.now()}`,
      orderCode: `LV${Math.floor(100000 + Math.random() * 900000)}`,
      amount: plan.price,
      status: "PENDING",
      qrCodeUrl: `https://qr.sepay.vn/img?acc=0987654321&bank=MB&amount=${plan.price}&des=LV${Math.floor(100000 + Math.random() * 900000)}`,
      accountNumber: "0987654321",
      accountName: "CONG TY CP CONG NGHE DI SAN SO LEGACYVAULT",
      bankCode: "MB",
      bankName: "MBBank - Ngân hàng Quân Đội",
      transferContent: `LV${Math.floor(100000 + Math.random() * 900000)}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setSelectedOrder(mockOrder);
    setIsQrModalOpen(true);
  };

  const displayedPlans = SRS_PLANS.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas,#EFECE6)] dark:bg-[#071710] text-[var(--text-main,#14241C)] dark:text-[#E5EDE8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header điều hướng & Tiêu đề */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#DCD9D0] dark:border-[#163625] pb-6">
          <div className="space-y-1 text-center sm:text-left">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted,#66786E)] hover:text-[var(--primary,#0B291E)] font-semibold mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Trang Chủ</span>
            </Link>
            <h1 className="text-2xl sm:text-4xl font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              Gói Dịch Vụ & Biểu Phí Di Sản Số
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted,#66786E)]">
              Mã hóa niêm phong Envelope Encryption AES-256-GCM · Thẩm định chứng tử pháp lý · Bảo mật Zero-Knowledge
            </p>
          </div>

          <Link
            to={ROUTES.BILLING.HISTORY}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-[20px] text-xs font-[550] shadow-xs shrink-0 flex items-center gap-2 px-4 py-2 whitespace-nowrap")}
          >
            <CreditCard className="w-4 h-4 text-[var(--gold,#B88E4C)] shrink-0" />
            <span className="whitespace-nowrap">Lịch Sử Hóa Đơn</span>
          </Link>
        </div>

        {/* Tab chuyển đổi Đối tượng dịch vụ chuẩn SRS 3.11.0 */}
        <div className="flex justify-center">
          <div className="inline-flex bg-[#E5E1D6] dark:bg-[#0E261A] p-1.5 rounded-[16px] border border-[#D5D0C3] dark:border-[#1E432F] shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedCategory("OWNER")}
              className={`px-6 py-2.5 text-xs font-bold rounded-[12px] transition-all flex items-center gap-2 ${
                selectedCategory === "OWNER"
                  ? "bg-[var(--surface,#FAF9F5)] text-[var(--primary,#0B291E)] shadow-xs"
                  : "text-[var(--text-muted,#66786E)] hover:text-[var(--text-main,#14241C)]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--gold,#B88E4C)]" />
              <span>Chủ Sở Hữu Két (Lập Kế Hoạch Di Sản)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("RECIPIENT")}
              className={`px-6 py-2.5 text-xs font-bold rounded-[12px] transition-all flex items-center gap-2 ${
                selectedCategory === "RECIPIENT"
                  ? "bg-[var(--surface,#FAF9F5)] text-[var(--primary,#0B291E)] shadow-xs"
                  : "text-[var(--text-muted,#66786E)] hover:text-[var(--text-main,#14241C)]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span>Người Thụ Hưởng (Kho Cá Nhân Nhận Di Sản)</span>
            </button>
          </div>
        </div>

        {/* Lưới các gói dịch vụ Pricing Cards */}
        <div className={`grid grid-cols-1 ${selectedCategory === "OWNER" ? "md:grid-cols-3" : "md:grid-cols-2 max-w-4xl mx-auto"} gap-6 pt-2`}>
          {displayedPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={plan.billingCycle === "365_days" ? "yearly" : plan.billingCycle === "30_days" ? "monthly" : "lifetime"}
              onSelectPlan={handleSelectPlan}
              isCurrentPlan={plan.id === "plan-owner-free" && selectedCategory === "OWNER"}
            />
          ))}
        </div>

        {/* Banner Cam kết bảo mật & SePay VietQR */}
        <div className="p-6 rounded-[16px] bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#1E432F] shadow-[var(--shadow-raised)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[var(--gold-light,#FBF7EE)] border border-[var(--gold-border,#E8DCC6)] flex items-center justify-center text-[var(--gold,#B88E4C)] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
                Thanh Toán Tự Động 24/7 Qua Cổng SePay VietQR
              </p>
              <p className="text-[var(--text-muted,#66786E)]">
                Kích hoạt tài khoản tức thì sau 3 giây quét mã QR Napas 247 · Xuất hóa đơn điện tử VAT tự động.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted,#66786E)]">
            <span>NAPAS 247</span>
            <span>·</span>
            <span>SEPAY WEBHOOK</span>
            <span>·</span>
            <span>MBBANK</span>
          </div>
        </div>
      </div>

      {/* Modal Quét Mã SePay VietQR */}
      <SepayQrModal
        order={selectedOrder}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onPaymentSuccess={() => {
          alert("Chúc mừng! Đơn hàng của bạn đã thanh toán thành công qua SePay!");
        }}
      />
    </div>
  );
}
