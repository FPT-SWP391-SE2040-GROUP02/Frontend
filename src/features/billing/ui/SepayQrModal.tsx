import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Check, Copy, Loader2, QrCode, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import type { PaymentOrder } from "../model/billing.types";
import { usePollPaymentStatus } from "../model/useBilling";

/**
 * @description Thuộc tính cấu hình cho SepayQrModal component.
 */
export interface SepayQrModalProps {
  /** Thông tin đơn hàng thanh toán SePay */
  order: PaymentOrder | null;
  /** Trạng thái mở modal */
  isOpen: boolean;
  /** Callback đóng modal */
  onClose: () => void;
  /** Callback khi thanh toán thành công */
  onPaymentSuccess?: () => void;
}

/**
 * @description Modal thanh toán tự động qua cổng SePay VietQR (Napas 247).
 * Tự động polling trạng thái giao dịch và xác thực thành công khi nhận Webhook từ ngân hàng.
 *
 * @param {SepayQrModalProps} props Thuộc tính component
 * @returns {React.JSX.Element} Modal VietQR SePay
 */
export function SepayQrModal({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}: SepayQrModalProps) {
  const [copiedContent, setCopiedContent] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 phút đếm ngược

  // Polling trạng thái thanh toán từ SePay
  const { data: paymentStatus } = usePollPaymentStatus(order?.orderId, isOpen);

  useEffect(() => {
    if (paymentStatus?.isPaid) {
      onPaymentSuccess?.();
    }
  }, [paymentStatus, onPaymentSuccess]);

  // Đếm ngược 15 phút
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(900);
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!order) return null;

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text: string, type: "content" | "amount" | "account") => {
    navigator.clipboard.writeText(text);
    if (type === "content") {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } else if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const isPaid = paymentStatus?.isPaid;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-6 bg-[var(--surface,#FAF9F5)] border border-[#DDD8CB] dark:border-[#1E432F] rounded-[16px] shadow-xl">
        <DialogHeader className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-[var(--gold-light,#FBF7EE)] border border-[var(--gold-border,#E8DCC6)] text-[var(--gold,#B88E4C)] mx-auto flex items-center justify-center mb-1">
            <QrCode className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
            {isPaid ? "Thanh Toán Thành Công!" : "Thanh Toán SePay VietQR"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--text-muted,#66786E)]">
            {isPaid
              ? "Két di sản của bạn đã được nâng cấp hạn mức thành công."
              : "Quét mã QR bằng ứng dụng ngân hàng để kích hoạt dịch vụ tự động."}
          </DialogDescription>
        </DialogHeader>

        {isPaid ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#059669] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
                Mã đơn hàng: #{order.orderCode}
              </p>
              <p className="text-xs text-[var(--text-muted,#66786E)]">
                Số tiền: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.amount)}
              </p>
            </div>
            <Button
              type="button"
              onClick={onClose}
              className="w-full rounded-[20px] bg-[var(--primary,#0B291E)] text-white font-[550] text-xs h-10"
            >
              Hoàn Tất & Xem Két Di Sản
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Khung Mã QR VietQR */}
            <div className="p-4 rounded-[12px] bg-white dark:bg-[#071710] border border-[#DDD8CB] dark:border-[#1E432F] flex flex-col items-center justify-center shadow-xs">
              <div className="relative w-48 h-48 bg-white p-2 rounded-[8px] flex items-center justify-center border border-[#EBE7DD]">
                {order.qrCodeUrl ? (
                  <img src={order.qrCodeUrl} alt="VietQR SePay" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[var(--text-muted,#66786E)] gap-2">
                    <QrCode className="w-12 h-12 text-[#B88E4C]" />
                    <span>Mã QR VietQR Napas 247</span>
                  </div>
                )}
              </div>

              {/* Đếm ngược 15 phút */}
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#D97706]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mã QR hết hạn trong: {formatMinutes(timeLeft)}</span>
              </div>
            </div>

            {/* Bảng thông tin chuyển khoản có nút copy */}
            <div className="p-3.5 rounded-[10px] bg-[var(--bg-canvas,#EFECE6)] dark:bg-[#071710] border border-[#DCD9D0] dark:border-[#1E432F] space-y-2 text-xs">
              {/* Ngân hàng */}
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted,#66786E)]">Ngân hàng:</span>
                <span className="font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
                  {order.bankName} ({order.bankCode})
                </span>
              </div>

              {/* Số tài khoản */}
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted,#66786E)]">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4]">
                    {order.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.accountNumber, "account")}
                    className="p-1 text-[var(--gold,#B88E4C)] hover:text-[var(--gold-hover,#A07839)]"
                    aria-label="Sao chép số tài khoản"
                  >
                    {copiedAccount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Chủ tài khoản */}
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted,#66786E)]">Chủ tài khoản:</span>
                <span className="font-bold text-[var(--primary,#0B291E)] dark:text-[#F3F7F4] uppercase">
                  {order.accountName}
                </span>
              </div>

              {/* Số tiền */}
              <div className="flex justify-between items-center border-t border-[#D5D0C3] dark:border-[#1E432F] pt-2">
                <span className="text-[var(--text-muted,#66786E)] font-bold">Số tiền:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-[#059669]">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.amount.toString(), "amount")}
                    className="p-1 text-[var(--gold,#B88E4C)] hover:text-[var(--gold-hover,#A07839)]"
                    aria-label="Sao chép số tiền"
                  >
                    {copiedAmount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Nội dung chuyển khoản */}
              <div className="flex justify-between items-center bg-white dark:bg-[#0C2217] p-2 rounded-[6px] border border-[var(--gold-border,#E8DCC6)]">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[var(--text-muted,#66786E)] font-bold uppercase block">
                    Nội dung chuyển khoản (Bắt buộc):
                  </span>
                  <span className="font-mono font-bold text-xs text-[var(--primary,#0B291E)] dark:text-[#F6D483] block">
                    {order.transferContent}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => copyToClipboard(order.transferContent, "content")}
                  className="gap-1 text-[10.5px]"
                >
                  {copiedContent ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedContent ? "Đã copy" : "Copy"}</span>
                </Button>
              </div>
            </div>

            {/* Trạng thái chờ Webhook */}
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted,#66786E)] pt-1">
              <div className="pulse-dot" />
              <span>Hệ thống đang tự động nhận diện thanh toán thời gian thực...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
