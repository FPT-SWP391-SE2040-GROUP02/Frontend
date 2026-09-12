import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { FileText, Download, CheckCircle2, Building, Calendar, CreditCard } from "lucide-react";
import type { Invoice } from "../model/billing.types";

/**
 * @description Thuộc tính cấu hình cho InvoiceDetailModal component.
 */
export interface InvoiceDetailModalProps {
  /** Dữ liệu hóa đơn */
  invoice: Invoice | null;
  /** Trạng thái mở modal */
  isOpen: boolean;
  /** Callback đóng modal */
  onClose: () => void;
}

/**
 * @description Modal hiển thị chi tiết hóa đơn điện tử VAT / E-Invoice dịch vụ Két Di Sản.
 *
 * @param {InvoiceDetailModalProps} props Thuộc tính component
 * @returns {React.JSX.Element} Modal chi tiết hóa đơn
 */
export function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
}: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-6 bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#1E432F] rounded-[16px] shadow-xl">
        <DialogHeader className="text-center space-y-1">
          <div className="w-11 h-11 rounded-full bg-[var(--primary-light,#E5EDE8)] text-[var(--primary,#0B291E)] mx-auto flex items-center justify-center mb-1">
            <FileText className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
            Hóa Đơn Điện Tử #{invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--text-muted,#66786E)]">
            Hóa đơn dịch vụ ủy thác và bảo mật Két Di Sản Số
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Thông tin đơn vị cung cấp */}
          <div className="p-3.5 rounded-[10px] bg-[var(--bg-canvas,#EFECE6)] dark:bg-[#071710] border border-[#DCD9D0] dark:border-[#1E432F] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
              <Building className="w-3.5 h-3.5 text-[var(--gold,#B88E4C)]" />
              <span>CÔNG TY CỔ PHẦN CÔNG NGHỆ DI SẢN SỐ LEGACYVAULT</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted,#66786E)]">
              Mã số thuế: 0109988776 · Khu CNC Hòa Lạc, Hà Nội
            </p>
          </div>

          {/* Chi tiết đơn hàng */}
          <div className="space-y-2 border-y border-[#EBE7DD] dark:border-[#1E432F] py-3">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted,#66786E)]">Tên gói dịch vụ:</span>
              <span className="font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
                {invoice.planName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted,#66786E)]">Phương thức:</span>
              <span className="font-semibold text-[var(--text-main,#14241C)] dark:text-[#E5EDE8]">
                {invoice.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted,#66786E)]">Thời gian phát hành:</span>
              <span className="text-[var(--text-main,#14241C)] dark:text-[#E5EDE8]">
                {new Date(invoice.issuedAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#EBE7DD] dark:border-[#1E432F]">
              <span className="font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">Tổng thanh toán:</span>
              <span className="font-bold text-base text-[#059669]">
                {formatCurrency(invoice.amount)}
              </span>
            </div>
          </div>

          {/* Nút tải PDF */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-[20px] text-xs h-9"
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={() => alert("Đang chuẩn bị file PDF hóa đơn...")}
              className="flex-1 rounded-[20px] bg-[var(--primary,#0B291E)] text-white text-xs h-9 font-[550] flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Hóa Đơn PDF</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
