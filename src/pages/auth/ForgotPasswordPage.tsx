import { ForgotPasswordForm } from "@/features/auth/ui/ForgotPasswordForm";

/**
 * @description Màn hình Quên mật khẩu & Khôi phục tài khoản (ForgotPasswordPage).
 *
 * @returns {React.JSX.Element} Màn hình quên mật khẩu
 */
export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#fafaf6] dark:bg-[#07160f] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--heritage-primary,#0b291e)] text-[var(--heritage-gold,#f6d483)] font-bold text-2xl flex items-center justify-center mx-auto shadow-sm">
            LV
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--heritage-primary,#0b291e)] dark:text-[#f3f7f4]">
            Khôi Phục Mật Khẩu
          </h1>
          <p className="text-xs text-[#5a705e] dark:text-[#9bb39f]">
            Nhập email đã đăng ký để bắt đầu quy trình khôi phục an toàn
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c2217] border border-[#dce6d8] dark:border-[#1d402f] shadow-sm flex flex-col items-center">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
