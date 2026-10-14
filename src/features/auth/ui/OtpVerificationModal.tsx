import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { OTP_PREVIEW_CONTENT as content } from "../model/otpPreview.constants";

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
  /** Callback dành cho tích hợp BE; không được gọi trong preview. */
  onVerifySuccess?: () => void;
}

/**
 * @description Modal xem trước nhập OTP; chỉ kiểm tra định dạng, không xác thực tài khoản.
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
 * />
 * ```
 */
export function OtpVerificationModal({ isOpen, onClose, email = "" }: OtpVerificationModalProps) {
  const [otpCode, setOtpCode] = useState<string>("");
  const [isFormatValid, setIsFormatValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  /** @description Xóa dữ liệu OTP trong RAM trước khi yêu cầu đóng modal. */
  const handleClose = (): void => {
    setOtpCode("");
    setErrorMsg("");
    setIsFormatValid(false);
    onClose();
  };

  /**
   * @description Kiểm tra định dạng OTP trong bản xem trước.
   * @param e Sự kiện submit form.
   */
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: [P3][AUTH-12] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Chốt mục đích OTP trước khi nối modal legacy.
    // 2. [INPUT & OUTPUT]: Challenge/purpose + code -> kết quả BE đúng phiên.
    // 3. [CÁC BƯỚC]: Sau AUTH-02 xác nhận OTP còn trong phạm vi và route; schema/service/mutation; giữ preview tách biệt; chỉ gọi callback sau kết quả server.
    // 4. [HÀM / THƯ VIỆN]: React Hook Form/Zod, TanStack Query, service Auth.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không dùng một OTP tùy ý cho mọi tác vụ; không thay challenge TOTP Admin; timeout/replay/attempt limit do BE; không log OTP.
    setIsFormatValid(false);

    if (!/^\d{6}$/.test(otpCode)) {
      setErrorMsg(content.invalid);
      return;
    }

    setErrorMsg("");
    setIsFormatValid(true);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-md bg-[#fafaf7] dark:bg-[#0c2217] border-[#d8e3d2] dark:border-[#1e422f] p-6 sm:p-7 rounded-3xl text-center">
        <DialogHeader className="border-b border-[#e2ebd9] dark:border-[#193a28] pb-3 text-center sm:text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mx-auto flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5b6f5f] dark:text-[#9bb39f]">
            {content.description}
            {email && (
              <span>
                {" "}
                {content.emailContext} {email}.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerifyOtp} className="py-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="verification-otp" className="sr-only">
              {content.label}
            </label>
            <Input
              id="verification-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-invalid={Boolean(errorMsg)}
              aria-describedby={errorMsg ? "verification-otp-error" : undefined}
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(event) => {
                setOtpCode(event.target.value.replace(/\D/g, ""));
                setIsFormatValid(false);
              }}
              placeholder={content.placeholder}
              className="text-center font-mono text-xl tracking-[0.5em] h-12 rounded-xl bg-white dark:bg-[#081a11] border-[#d8e3d2] dark:border-[#1e422f] font-bold"
              autoFocus
            />
            {errorMsg && (
              <p
                id="verification-otp-error"
                role="alert"
                className="text-xs text-red-500 font-medium"
              >
                {errorMsg}
              </p>
            )}

            {isFormatValid && (
              <p role="status" className="text-xs text-emerald-700">
                {content.valid}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[#586c5c] dark:text-[#a0b8a4]">
            <span>{content.resendHint}</span>
            <button
              type="button"
              disabled
              className="text-[var(--heritage-gold,#b88e4c)] hover:underline font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {content.resend}
            </button>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#e2ebd9] dark:border-[#193a28]">
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              className="h-10 px-4 rounded-xl text-xs"
            >
              {content.cancel}
            </Button>
            <Button
              type="submit"
              className="gap-2 bg-[var(--heritage-primary,#0b291e)] hover:bg-[#143e2d] text-white text-xs h-10 px-5 rounded-xl font-bold"
            >
              {content.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
