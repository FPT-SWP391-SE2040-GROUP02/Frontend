import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { KeyRound, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";

/**
 * @description Thuộc tính cấu hình cho OtpVerificationModal component.
 */
export interface OtpVerificationModalProps {
  /** Trạng thái mở modal */
  isOpen: boolean;
  /** Hàm callback đóng modal */
  onClose: () => void;
  /** Email nhận mã OTP */
  email?: string;
  /** Callback khi xác thực mã OTP thành công */
  onVerifySuccess?: () => void;
}

/**
 * @description Modal nhập mã xác thực OTP 6 số bảo vệ 2 lớp (2FA).
 *
 * @param {OtpVerificationModalProps} props Thuộc tính component
 * @returns {React.JSX.Element} Modal nhập OTP
 *
 * @example
 * ```tsx
 * <OtpVerificationModal
 *   isOpen={isOtpOpen}
 *   onClose={() => setIsOtpOpen(false)}
 *   email="owner@legacyvault.io"
 *   onVerifySuccess={() => alert("Xác thực 2FA thành công!")}
 * />
 * ```
 */
export function OtpVerificationModal({
  isOpen,
  onClose,
  email = "owner@legacyvault.io",
  onVerifySuccess,
}: OtpVerificationModalProps) {
  const [otpCode, setOtpCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  /**
   * @description Gửi mã OTP xác thực
   */
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg("Vui lòng nhập đầy đủ 6 chữ số mã OTP.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg("");

    // TODO: 1. Gọi API xác thực OTP: POST /api/v1/auth/otp/verify
    // TODO: 2. Khi thành công gọi onVerifySuccess?.()
    setTimeout(() => {
      setIsVerifying(false);
      onVerifySuccess?.();
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#fafaf7] dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f] p-6 sm:p-7 rounded-3xl text-center">
        <DialogHeader className="border-b border-[#e2ebd9] dark:border-[#193a28] pb-3 text-center sm:text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mx-auto flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-serif font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            Xác Thực Bảo Mật 2 Lớp (2FA)
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5b6f5f] dark:text-[#9bb39f]">
            Mã OTP 6 số đã được gửi đến email <strong>{email}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerifyOtp} className="py-4 space-y-4">
          <div className="space-y-1.5">
            <Input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="1 2 3 4 5 6"
              className="text-center font-mono text-xl tracking-[0.5em] h-12 rounded-xl bg-white dark:bg-[#081a11] border-[#d8e3d2] dark:border-[#1e422f] font-bold"
              autoFocus
            />
            {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
          </div>

          <div className="flex items-center justify-between text-xs text-[#586c5c] dark:text-[#a0b8a4]">
            <span>Không nhận được mã?</span>
            <button
              type="button"
              onClick={() => alert("Đã gửi lại mã OTP mới!")}
              className="text-[var(--heritage-gold,#b88e4c)] hover:underline font-semibold"
            >
              Gửi lại mã
            </button>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#e2ebd9] dark:border-[#193a28]">
            <Button variant="outline" type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-xs">
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isVerifying || otpCode.length !== 6}
              className="gap-2 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white text-xs h-10 px-5 rounded-xl font-bold"
            >
              {isVerifying ? "Đang đối soát mã..." : "Xác Nhận Đăng Nhập"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
