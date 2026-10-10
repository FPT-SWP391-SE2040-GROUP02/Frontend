import React, { useState, useRef, useEffect } from "react";
import { useTwoFactorVerify } from "../model/useAuth";
import { Button } from "@/shared/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Thuộc tính cấu hình cho component Xác thực hai bước Admin.
 */
export interface AdminTwoFactorCardProps {
  /** Callback tùy chọn khi xác thực hoàn tất */
  onSuccess?: () => void;
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Giao diện Xác thực hai bước TOTP cho tài khoản Quản trị (Mockup 7 - XacThucHaiBuoc.dc.html).
 * Bao gồm 6 ô nhập mã OTP tự động chuyển tiếp tiêu điểm, hỗ trợ dán mã và cảnh báo phiên 15 phút.
 *
 * @param {AdminTwoFactorCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Card xác thực 2 bước
 */
export function AdminTwoFactorCard({ onSuccess, className = "" }: AdminTwoFactorCardProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { mutate: verify2Fa, isPending, isError, error } = useTwoFactorVerify();

  // Tự động focus ô đầu tiên khi mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /**
   * @description Xử lý thay đổi từng chữ số và tự động focus ô kế tiếp
   */
  const handleDigitChange = (index: number, value: string): void => {
    const cleanChar = value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = cleanChar;
    setDigits(updated);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * @description Xử lý phím Backspace để lùi ô focus
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * @description Xử lý dán (Paste) toàn bộ chuỗi 6 ký tự số
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setDigits(updated);

    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  /**
   * @description Xử lý nộp mã 6 số
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) return;

    // TODO: [P0][AUTH-07] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Hoàn thiện challenge TOTP Admin trước khi cấp phiên đầy đủ.
    // 2. [INPUT & OUTPUT]: challengeId + code giữ số 0 đầu -> credential hoặc retry/expiry từ BE.
    // 3. [CÁC BƯỚC]: Chốt POST /auth/2fa/verify; dùng RHF/Zod; gửi challenge đúng phiên; validate response; cập nhật RAM/Redux; điều hướng khi server cho phép.
    // 4. [HÀM / THƯ VIỆN]: useTwoFactorVerify, React Hook Form, Zod, accessTokenSchema, ROUTES.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không suy ra challengeId từ email; hạn/lượt thử/replay do BE; paste ngắn phải xóa ô cũ; không cấp quyền Admin chỉ từ UI.
    verify2Fa(
      { code },
      {
        onSuccess: () => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate(ROUTES.ADMIN.ROOT);
          }
        },
        onError: () => {
          setDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        },
      },
    );
  };

  const isComplete = digits.every((d) => d !== "");

  return (
    <div className={`w-full space-y-6 text-left ${className}`}>
      {/* Tiêu đề & Diễn giải */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#0F1A16]">
          Xác thực hai bước
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66] leading-relaxed">
          Mở ứng dụng xác thực (Google Authenticator / Authy) và nhập mã 6 chữ số hiện trên màn
          hình.
        </p>
      </div>

      {/* Thông báo lỗi nếu mã sai */}
      {isError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#9B1C1C] text-xs"
        >
          {error?.message || "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại."}
        </div>
      )}

      {/* Form 6 ô số OTP */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl bg-white border border-[#D5D0C3] focus:border-[#0A281E] focus:outline-none focus:ring-2 focus:ring-[#0A281E]/10 transition-all text-[#0F1A16] shadow-sm"
              aria-label={`Chữ số thứ ${idx + 1}`}
            />
          ))}
        </div>

        {/* Nút bấm Xác nhận */}
        <Button
          type="submit"
          disabled={!isComplete || isPending}
          className="w-full h-11 rounded-xl bg-[#0A281E] hover:bg-[#133E2F] text-[#FAFAF6] text-xs font-semibold shadow-md transition-all disabled:opacity-50"
        >
          {isPending ? "Đang xác thực..." : "Xác nhận"}
        </Button>
      </form>

      {/* Hộp thoại thông tin bảo mật phiên quản trị 15 phút */}
      <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E5DF] flex items-center gap-3 text-xs text-[#6B6B66]">
        <ShieldAlert className="w-4 h-4 text-[#B88E4C] flex-shrink-0" />
        <span>Phiên quản trị tự kết thúc sau 15 phút không hoạt động để bảo vệ hệ thống.</span>
      </div>

      {/* Quay lại đăng nhập */}
      <div className="pt-4 border-t border-[#E5E5DF] text-center">
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="inline-flex items-center gap-1.5 text-xs text-[#0A281E] font-bold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại đăng nhập</span>
        </Link>
      </div>
    </div>
  );
}
