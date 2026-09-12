import { useState } from "react";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { PasskeyEnrollModal } from "@/features/auth/ui/PasskeyEnrollModal";
import { ShieldCheck, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Màn hình Đăng nhập tài khoản (LoginPage).
 * Thiết kế theo phong cách Heritage Sanctuary kết hợp minh họa bảo mật và form đăng nhập Passkey/Mật khẩu.
 *
 * @returns {React.JSX.Element} Màn hình đăng nhập
 */
export function LoginPage() {
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#fafaf6] dark:bg-[#07160f] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo & Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--heritage-primary,#0b291e)] text-[var(--heritage-gold,#f6d483)] font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-sm">
            LV
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            Đăng Nhập Két Di Sản
          </h1>
          <p className="text-xs text-[#5a705e] dark:text-[#9bb3a0]">
            Không gian lưu trữ mật mã học an toàn cho di sản số của bạn
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dce6d8] dark:border-[#1d402f] shadow-sm flex flex-col items-center">
          <LoginForm onPasskeyClick={() => setIsPasskeyModalOpen(true)} />
        </div>

        {/* Chuyển sang đăng ký */}
        <p className="text-xs text-[#627766] dark:text-[#8fa894]">
          Chưa có tài khoản két di sản?{" "}
          <Link
            to={ROUTES.AUTH.REGISTER}
            className="font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#d4af37] underline underline-offset-2"
          >
            Đăng ký tài khoản chính chủ
          </Link>
        </p>

        {/* Security badge */}
        <div className="inline-flex items-center gap-1.5 text-[11px] text-[#556b59] dark:text-[#90ab94]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Mã hóa Client-side AES-256 GCM · Không lưu mật khẩu thô</span>
        </div>
      </div>

      {/* Modal Passkey */}
      <PasskeyEnrollModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
      />
    </div>
  );
}
