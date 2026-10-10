import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { linkGoogleSchema, type LinkGoogleInput } from "../model/auth.schema";
import { useLinkGoogle } from "../model/useAuth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Lock, ShieldCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Thuộc tính cho component Liên kết tài khoản Google.
 */
export interface LinkGoogleAccountCardProps {
  /** Email tài khoản Google cần liên kết */
  email?: string;
  /** Tên đầy đủ từ hồ sơ Google */
  fullName?: string;
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Giao diện Xác nhận mật khẩu để Liên kết Google (Mockup 5 - LienKetGoogle.dc.html).
 * Đảm bảo nguyên tắc bảo mật: Không tự động gộp tài khoản nếu người dùng chưa xác nhận mật khẩu hiện có.
 *
 * @param {LinkGoogleAccountCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Card xác nhận liên kết
 */
export function LinkGoogleAccountCard({
  email = "nam@example.com",
  fullName = "Nguyễn Văn Nam",
  className = "",
}: LinkGoogleAccountCardProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const { mutate: linkAccount, isPending } = useLinkGoogle();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkGoogleInput>({
    resolver: zodResolver(linkGoogleSchema),
    defaultValues: {
      password: "",
    },
  });

  /**
   * @description Xử lý nộp form xác nhận mật khẩu liên kết
   * @param {LinkGoogleInput} data Dữ liệu mật khẩu
   */
  const onSubmit = (data: LinkGoogleInput): void => {
    // TODO: [P1][AUTH-10] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Liên kết Google qua challenge và xác thực lại account hiện có.
    // 2. [INPUT & OUTPUT]: Link challenge + reauthentication -> phiên/kết quả liên kết từ BE.
    // 3. [CÁC BƯỚC]: Sau AUTH-03 chốt POST /auth/google/link; thay DTO email/password legacy bằng DTO chốt; gửi qua hook; xử lý nextAction và return path.
    // 4. [HÀM / THƯ VIỆN]: useLinkGoogle, RHF/Zod, accessTokenSchema, ROUTES.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không link dựa email FE gửi; conflict/expiry/replay/lockout do BE; lỗi mạng không mặc định là sai password; không làm mất phương thức đăng nhập cuối.
    linkAccount(
      {
        email,
        currentPassword: data.password,
      },
      {
        onSuccess: () => {
          navigate(ROUTES.DASHBOARD.ROOT);
        },
      }
    );
  };

  return (
    <div className={`w-full space-y-6 text-left ${className}`}>
      {/* Tiêu đề & Diễn giải */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#0F1A16]">
          Email này đã có tài khoản
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66] leading-relaxed">
          Địa chỉ <span className="font-medium text-[#0F1A16]">{email}</span> đã được dùng cho một tài khoản LegacyVault. Nhập mật khẩu để liên kết với Google.
        </p>
      </div>

      {/* Thẻ người dùng Google (User Pill) */}
      <div className="p-3 rounded-2xl bg-white border border-[#E5E5DF] flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-[#EAF2ED] text-[#0A281E] font-bold text-base flex items-center justify-center flex-shrink-0">
          {fullName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#0F1A16] truncate">{fullName}</p>
          <p className="text-[11px] text-[#6B6B66] truncate">{email}, từ Google</p>
        </div>
        <ShieldCheck className="w-4 h-4 text-[#B88E4C] flex-shrink-0" />
      </div>

      {/* Form nhập mật khẩu hiện tại */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-[#0F1A16]">
            Mật khẩu hiện có
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#8C8C85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu hiện tại của bạn"
              className={`pl-10 pr-12 h-11 text-xs rounded-xl bg-white border-[#D5D0C3] focus-visible:border-[#0A281E] ${
                errors.password ? "border-red-500" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B6B66] hover:text-[#0A281E] px-1 py-0.5 rounded focus-visible:outline-none"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-600 font-medium">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl bg-[#0A281E] hover:bg-[#133E2F] text-[#FAFAF6] text-xs font-semibold shadow-md transition-all disabled:opacity-50 mt-2"
        >
          {isPending ? "Đang xác nhận..." : "Xác nhận và liên kết"}
        </Button>
      </form>

      {/* Nút hủy chuyển về dùng email khác */}
      <div className="pt-4 border-t border-[#E5E5DF] text-center">
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="text-xs text-[#0A281E] hover:underline font-semibold"
        >
          Dùng email khác
        </Link>
      </div>
    </div>
  );
}
