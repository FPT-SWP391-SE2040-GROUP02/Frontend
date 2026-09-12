import { useState } from "react";
import { ArrowLeft, CreditCard, Download, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { BillingHistoryTable } from "@/features/billing/ui/BillingHistoryTable";
import { InvoiceDetailModal } from "@/features/billing/ui/InvoiceDetailModal";
import type { Invoice } from "@/features/billing/model/billing.types";
import { useInvoices } from "@/features/billing/model/useBilling";

/**
 * Danh sách hóa đơn mẫu ban đầu
 */
const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-0089",
    planName: "Di Sản Gia Đình (Family Vault)",
    amount: 199000,
    paymentMethod: "SePay VietQR (MBBank)",
    status: "PAID",
    issuedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    pdfUrl: "/invoices/INV-2026-0089.pdf",
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-0012",
    planName: "Két Cơ Bản (Starter)",
    amount: 0,
    paymentMethod: "Miễn phí",
    status: "PAID",
    issuedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    pdfUrl: "/invoices/INV-2026-0012.pdf",
  },
];

/**
 * @description Màn hình Lịch Sử Hóa Đơn & Giao Dịch (BillingHistoryPage).
 *
 * @returns {React.JSX.Element} Màn hình lịch sử hóa đơn
 */
export function BillingHistoryPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const { data: serverInvoices } = useInvoices();
  const invoices = serverInvoices && serverInvoices.length > 0 ? serverInvoices : MOCK_INVOICES;

  const handleViewInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas,#EFECE6)] dark:bg-[#071710] text-[var(--text-main,#14241C)] dark:text-[#E5EDE8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header & Tiêu đề */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#DCD9D0] dark:border-[#163625] pb-6">
          <div className="space-y-1 text-center sm:text-left">
            <Link
              to={ROUTES.BILLING.PLANS}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted,#66786E)] hover:text-[var(--primary,#0B291E)] font-semibold mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Bảng Giá</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              Lịch Sử Giao Dịch & Hóa Đơn Điện Tử
            </h1>
            <p className="text-xs text-[var(--text-muted,#66786E)]">
              Quản lý toàn bộ hóa đơn thanh toán gói Két Di Sản và chứng từ VAT
            </p>
          </div>

          <Button asChild className="rounded-[20px] text-xs font-[550]">
            <Link to={ROUTES.BILLING.PLANS}>Nâng Cấp Gói Dịch Vụ</Link>
          </Button>
        </div>

        {/* Bảng lịch sử hóa đơn */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              Danh Sách Hóa Đơn Đã Phát Hành ({invoices.length})
            </span>
          </div>

          <BillingHistoryTable
            invoices={invoices}
            onViewInvoice={handleViewInvoice}
          />
        </div>
      </div>

      {/* Modal Chi tiết Hóa đơn */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
