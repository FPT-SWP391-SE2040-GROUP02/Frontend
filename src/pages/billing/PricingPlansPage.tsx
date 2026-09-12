import { useState } from "react";
import { Sparkles, ShieldCheck, ArrowLeft, CreditCard, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { PricingCard } from "@/features/billing/ui/PricingCard";
import { SepayQrModal } from "@/features/billing/ui/SepayQrModal";
import type { PricingPlan, PaymentOrder } from "@/features/billing/model/billing.types";
import { useCreatePaymentOrder } from "@/features/billing/model/useBilling";

/**
 * Danh sách các gói dịch vụ mẫu mặc định chuẩn Master UI Kit
 */
const MOCK_PLANS: PricingPlan[] = [
  {
    id: "plan-free",
    tier: "FREE",
    name: "Két Cơ Bản (Starter)",
    price: 0,
    billingCycle: "lifetime",
    description: "Dành cho cá nhân muốn trải nghiệm két số bảo mật và nhịp sinh tồn cơ bản.",
    features: [
      "1 Két Di Sản Cá Nhân",
      "Dung lượng lưu trữ: 1 GB",
      "Tối đa 1 người thừa kế (Beneficiary)",
      "Mã hóa Client-side AES-256 GCM",
      "Nhịp kiểm tra sinh tồn (DMS) 90 ngày",
    ],
    storageLimitGb: 1,
    maxHeirs: 1,
  },
  {
    id: "plan-family",
    tier: "FAMILY",
    name: "Di Sản Gia Đình (Family Vault)",
    price: 199000,
    billingCycle: "monthly",
    description: "Giải pháp hoàn hảo bảo vệ tài sản số và phân bổ di sản cho cả gia đình hạt nhân.",
    isPopular: true,
    features: [
      "Không giới hạn số lượng két con",
      "Dung lượng lưu trữ: 50 GB",
      "Tối đa 5 người thừa kế & 2 người giám hộ",
      "Đăng nhập sinh trắc học WebAuthn / Passkey",
      "Tự động tính toán phân bổ Điều 644 BLDS",
      "Nhịp sinh tồn tùy biến (30 / 60 / 90 ngày)",
      "Ủy thác công chứng viên số (Notary Review)",
    ],
    storageLimitGb: 50,
    maxHeirs: 5,
  },
  {
    id: "plan-lifetime",
    tier: "LIFETIME",
    name: "Di Sản Vĩnh Cửu (Lifetime Legacy)",
    price: 2490000,
    billingCycle: "lifetime",
    description: "Thanh toán 1 lần duy nhất, ủy thác trọn đời có bảo chứng công chứng viên chuyên môn.",
    features: [
      "Ủy thác lưu trữ trọn đời (Không gia hạn)",
      "Dung lượng lưu trữ: 200 GB",
      "Không giới hạn người thừa kế & giám hộ",
      "Khung video tuyên thệ minh mẫn Điều 630 BLDS",
      "Công chứng viên riêng thẩm định hồ sơ",
      "Hỗ trợ pháp lý tận nơi khi mở két",
      "Tem băm SHA-256 & ECDSA P-256 bất biến",
    ],
    storageLimitGb: 200,
    maxHeirs: 999,
  },
];

/**
 * @description Màn hình Bảng Giá & Nâng Cấp Gói Két Di Sản (PricingPlansPage).
 * Tích hợp cổng thanh toán tự động VietQR SePay theo Master UI Kit.
 *
 * @returns {React.JSX.Element} Màn hình bảng giá
 */
export function PricingPlansPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly" | "lifetime">("monthly");
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  const { mutate: createOrder, isPending } = useCreatePaymentOrder();

  const handleSelectPlan = (plan: PricingPlan) => {
    // Gói miễn phí không cần sinh mã QR
    if (plan.price === 0) {
      alert("Bạn đang sử dụng gói Két Cơ Bản Miễn Phí!");
      return;
    }

    // TODO: 1. Gọi mutation createOrder({ planId: plan.id, billingCycle })
    // TODO: 2. Nhận PaymentOrder từ Backend C# và mở SepayQrModal
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
              Gói Dịch Vụ Két Di Sản Số
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted,#66786E)]">
              Bảo vệ an toàn tài sản mật mã học và phân chia di sản hợp pháp trọn đời
            </p>
          </div>

          <Button variant="outline" asChild className="rounded-[20px] text-xs font-[550] shadow-xs shrink-0">
            <Link to={ROUTES.BILLING.HISTORY} className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
              <CreditCard className="w-4 h-4 text-[var(--gold,#B88E4C)] shrink-0" />
              <span className="whitespace-nowrap">Lịch Sử Hóa Đơn</span>
            </Link>
          </Button>
        </div>

        {/* Cụm Pill Tabs chuyển chu kỳ thanh toán */}
        <div className="flex justify-center">
          <div className="pill-tabs inline-flex bg-[#E5E1D6] dark:bg-[#0E261A] p-1 rounded-[12px] border border-[#D5D0C3] dark:border-[#1E432F]">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`pill-tab px-5 py-2 text-xs font-[550] rounded-[8px] transition-all ${
                billingCycle === "monthly"
                  ? "bg-[var(--surface,#FAF9F5)] text-[var(--primary,#0B291E)] shadow-xs font-bold"
                  : "text-[var(--text-muted,#66786E)] hover:text-[var(--text-main,#14241C)]"
              }`}
            >
              Theo Tháng
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`pill-tab px-5 py-2 text-xs font-[550] rounded-[8px] transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-[var(--surface,#FAF9F5)] text-[var(--primary,#0B291E)] shadow-xs font-bold"
                  : "text-[var(--text-muted,#66786E)] hover:text-[var(--text-main,#14241C)]"
              }`}
            >
              <span>Theo Năm</span>
              <span className="tag-pill tag-new text-[9px] py-0 px-1.5">Tiết kiệm 20%</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("lifetime")}
              className={`pill-tab px-5 py-2 text-xs font-[550] rounded-[8px] transition-all flex items-center gap-1.5 ${
                billingCycle === "lifetime"
                  ? "bg-[var(--surface,#FAF9F5)] text-[var(--primary,#0B291E)] shadow-xs font-bold"
                  : "text-[var(--text-muted,#66786E)] hover:text-[var(--text-main,#14241C)]"
              }`}
            >
              <span>Trọn Đời</span>
              <span className="tag-pill tag-beta text-[9px] py-0 px-1.5">Vĩnh Cửu</span>
            </button>
          </div>
        </div>

        {/* Lưới các gói dịch vụ Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {MOCK_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              onSelectPlan={handleSelectPlan}
              isCurrentPlan={plan.id === "plan-free"}
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
