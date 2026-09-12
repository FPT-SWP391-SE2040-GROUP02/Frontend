import { FileText, Download, CheckCircle2, RotateCcw } from "lucide-react";
import type { Invoice } from "../model/billing.types";
import { Button } from "@/shared/ui/button";

/**
 * @description Thuộc tính cấu hình cho BillingHistoryTable component.
 */
export interface BillingHistoryTableProps {
  /** Danh sách hóa đơn */
  invoices: Invoice[];
  /** Callback khi người dùng bấm xem chi tiết hóa đơn */
  onViewInvoice?: (invoice: Invoice) => void;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Bảng lịch sử hóa đơn thanh toán Két Di Sản chuẩn Master UI Kit.
 *
 * @param {BillingHistoryTableProps} props Thuộc tính component
 * @returns {React.JSX.Element} Bảng lịch sử thanh toán
 */
export function BillingHistoryTable({
  invoices,
  onViewInvoice,
  className = "",
}: BillingHistoryTableProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "PAID":
        return <span className="tag-pill tag-new text-[10.5px]">Đã thanh toán</span>;
      case "REFUNDED":
        return <span className="tag-pill tag-beta text-[10.5px]">Đã hoàn tiền</span>;
      default:
        return <span className="tag-pill tag-count text-[10.5px]">Đã hủy</span>;
    }
  };

  if (!invoices || invoices.length === 0) {
    return (
      <div className="p-8 text-center bg-[var(--surface,#FAF9F5)] rounded-[12px] border border-[#DDD8CB] dark:border-[#1E432F]">
        <FileText className="w-10 h-10 text-[var(--text-subtle,#8E9F96)] mx-auto mb-2 opacity-50" />
        <p className="text-xs font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
          Chưa có lịch sử giao dịch
        </p>
        <p className="text-[11px] text-[var(--text-muted,#66786E)] mt-0.5">
          Các giao dịch nâng cấp gói Két Di Sản sẽ xuất hiện tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-[12px] border border-[#DDD8CB] dark:border-[#1E432F] bg-[var(--surface,#FAF9F5)] shadow-xs ${className}`}>
      <table className="w-full text-left text-xs">
        <thead className="bg-[var(--bg-canvas,#EFECE6)] dark:bg-[#071710] border-b border-[#DDD8CB] dark:border-[#1E432F] text-[11px] font-bold text-[var(--text-muted,#66786E)] uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4">Mã Hóa Đơn</th>
            <th className="py-3 px-4">Gói Dịch Vụ</th>
            <th className="py-3 px-4">Số Tiền</th>
            <th className="py-3 px-4">Phương Thức</th>
            <th className="py-3 px-4">Ngày Xuất</th>
            <th className="py-3 px-4">Trạng Thái</th>
            <th className="py-3 px-4 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EBE7DD] dark:divide-[#193B28]">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-white/60 dark:hover:bg-[#0E261A] transition-colors">
              <td className="py-3.5 px-4 font-mono font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
                {inv.invoiceNumber}
              </td>
              <td className="py-3.5 px-4 font-semibold text-[var(--text-main,#14241C)] dark:text-[#E5EDE8]">
                {inv.planName}
              </td>
              <td className="py-3.5 px-4 font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
                {formatCurrency(inv.amount)}
              </td>
              <td className="py-3.5 px-4 text-[var(--text-muted,#66786E)]">
                {inv.paymentMethod}
              </td>
              <td className="py-3.5 px-4 text-[var(--text-muted,#66786E)]">
                {formatDate(inv.issuedAt)}
              </td>
              <td className="py-3.5 px-4">
                {getStatusBadge(inv.status)}
              </td>
              <td className="py-3.5 px-4 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onViewInvoice?.(inv)}
                  className="gap-1 text-[11px]"
                >
                  <Download className="w-3 h-3 text-[var(--gold,#B88E4C)]" />
                  <span>Xem Chi Tiết</span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
