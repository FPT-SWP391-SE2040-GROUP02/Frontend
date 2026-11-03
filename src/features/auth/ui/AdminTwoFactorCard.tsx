import React, { useState, useRef, useEffect } from "react";
import { useTwoFactorVerify } from "../model/useAuth";
import { Button } from "@/shared/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { twoFactorSchema } from "../model/auth.schema";
import { getTwoFactorErrorMessage, isTwoFactorChallengeLost } from "../lib/twoFactorFeedback";
import { recoveryCodeSchema } from "../model/twoFactor.schema";
import { twoFactorChallengeMemory } from "../model/twoFactorChallenge";
import { Input } from "@/shared/ui/input";
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
  // Thử thách chỉ có trong RAM của tab; không có thì bước này không thể hoàn tất.
  const [hasChallenge] = useState(() => twoFactorChallengeMemory.get() !== null);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recovery, setRecovery] = useState("");
  const challengeLost = !hasChallenge || (isError && isTwoFactorChallengeLost(error));

  // Tự động focus ô đầu tiên khi mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /**
   * @description Xử lý thay đổi từng chữ số và tự động focus ô kế tiếp
   */
  const handleDigitChange = (index: number, value: string): void => {
    const clean = value.replace(/\D/g, "");
    // Autofill OTP của điện thoại/trình quản lý mật khẩu điền cả mã vào một ô: chia sang các ô sau.
    if (clean.length >= 3) {
      const updated = [...digits];
      for (let offset = 0; offset < clean.length && index + offset < 6; offset += 1)
        updated[index + offset] = clean[offset];
      setDigits(updated);
      inputRefs.current[Math.min(index + clean.length, 5)]?.focus();
      return;
    }
    const cleanChar = clean.slice(-1);
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

    const updated = Array.from({ length: 6 }, (_, index) => pasted[index] ?? "");
    setDigits(updated);

    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  /**
   * @description Nộp mã TOTP 6 số hoặc mã khôi phục; BE là nơi quyết định hạn, lượt thử và replay.
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (challengeLost || isPending) return;
    const code = useRecovery ? recovery.trim() : digits.join("");
    const valid = useRecovery
      ? recoveryCodeSchema.safeParse(code).success
      : twoFactorSchema.safeParse({ code }).success;
    if (!valid) return;
    verify2Fa(code, {
      onSuccess: ({ user }) => {
        if (onSuccess) onSuccess();
        else navigate(user.role === "ADMIN" ? ROUTES.ADMIN.ROOT : ROUTES.DASHBOARD.ROOT);
      },
      onError: () => {
        setDigits(["", "", "", "", "", ""]);
        setRecovery("");
        if (!useRecovery) inputRefs.current[0]?.focus();
      },
    });
  };

  const isComplete = useRecovery
    ? recoveryCodeSchema.safeParse(recovery.trim()).success
    : digits.every((d) => d !== "");

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

      {!hasChallenge && !isError && (
        <p role="alert" className="text-sm text-[#9B1C1C]">
          Chưa có phiên xác thực. Hãy đăng nhập bằng mật khẩu hoặc Google trước, rồi nhập mã tại
          đây.
        </p>
      )}
      {/* Thông báo lỗi nếu mã sai */}
      {isError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#9B1C1C] text-xs"
        >
          {getTwoFactorErrorMessage(error)}
        </div>
      )}

      {/* Form 6 ô số OTP */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {useRecovery ? (
          <div className="space-y-1.5">
            <label htmlFor="two-factor-recovery" className="text-xs font-semibold text-[#0F1A16]">
              Mã khôi phục
            </label>
            <Input
              id="two-factor-recovery"
              value={recovery}
              onChange={(e) => setRecovery(e.target.value)}
              disabled={isPending || challengeLost}
              autoComplete="off"
              placeholder="XXXXXX-XXXXXX"
              maxLength={13}
              className="h-11 rounded-xl bg-white border-[#D5D0C3] font-mono tracking-wider"
            />
            <p className="text-[11px] text-[#6B6B66]">
              Mỗi mã khôi phục chỉ dùng được một lần, không phân biệt hoa thường.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                disabled={isPending || challengeLost}
                autoComplete={idx === 0 ? "one-time-code" : "off"}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl bg-white border border-[#D5D0C3] focus:border-[#0A281E] focus:outline-none focus:ring-2 focus:ring-[#0A281E]/10 transition-all text-[#0F1A16] shadow-sm"
                aria-label={`Chữ số thứ ${idx + 1}`}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setUseRecovery((value) => !value);
            setRecovery("");
          }}
          className="min-h-11 text-xs font-semibold text-[#0A281E] underline"
        >
          {useRecovery ? "Dùng mã từ ứng dụng xác thực" : "Dùng mã khôi phục"}
        </button>

        {/* Nút bấm Xác nhận */}
        <Button
          type="submit"
          disabled={challengeLost || !isComplete || isPending}
          className="w-full h-11 rounded-xl bg-[#0A281E] hover:bg-[#133E2F] text-[#FAFAF6] text-xs font-semibold shadow-md transition-all disabled:opacity-50"
        >
          {isPending ? "Đang xác thực..." : "Xác nhận"}
        </Button>
      </form>

      {/* Hộp thoại thông tin bảo mật phiên quản trị 15 phút */}
      <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E5DF] flex items-center gap-3 text-xs text-[#6B6B66]">
        <ShieldAlert className="w-4 h-4 text-[#B88E4C] flex-shrink-0" />
        <span>Mã chỉ dùng được một lần và thử thách đăng nhập hết hạn sau 5 phút.</span>
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
