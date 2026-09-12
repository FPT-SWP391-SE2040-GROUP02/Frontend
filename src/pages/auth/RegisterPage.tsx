import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Màn hình Đăng ký tài khoản chính chủ (RegisterPage).
 *
 * @returns {React.JSX.Element} Màn hình đăng ký
 */
export function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#fafaf6] dark:bg-[#07160f] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo & Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--heritage-primary,#0b291e)] text-[var(--heritage-gold,#f6d483)] font-bold text-2xl flex items-center justify-center mx-auto shadow-sm">
            LV
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            Đăng Ký Tài Khoản Chính Chủ
          </h1>
          <p className="text-xs text-[#5a705e] dark:text-[#9bb3a0]">
            Bảo vệ trọn vẹn di sản số và phân bổ quyền thừa kế hợp pháp
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dce6d8] dark:border-[#1d402f] shadow-sm flex flex-col items-center">
          <RegisterForm />
        </div>

        {/* Chuyển sang đăng nhập */}
        <p className="text-xs text-[#627766] dark:text-[#8fa894]">
          Đã có tài khoản két di sản?{" "}
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#d4af37] underline underline-offset-2"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
