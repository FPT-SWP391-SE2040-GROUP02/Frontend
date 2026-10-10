import { useState } from "react";
import { useLogout } from "../model/useAuth";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { Button } from "@/shared/ui/button";
import { Info, LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { APP_MESSAGES } from "@/shared/constants";

/**
 * @description Thuộc tính cấu hình cho component Xác nhận đăng xuất.
 */
export interface LogoutConfirmationCardProps {
  /** Callback đóng modal khi người dùng chọn Ở lại */
  onClose?: () => void;
  /** Lớp CSS bổ trợ */
  className?: string;
}

/**
 * @description Thẻ xác nhận đăng xuất tài khoản kèm cảnh báo DMS (Mockup 8 - XacNhanDangXuat.dc.html).
 * ĐẢM BẢO NGHIỆP VỤ CỐT LÕI: Nhắc nhở người dùng "Đăng xuất không thay thế điểm danh sinh tồn (DMS Heartbeat)".
 *
 * @param {LogoutConfirmationCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Thẻ xác nhận đăng xuất
 */
export function LogoutConfirmationCard({
  onClose,
  className = "",
}: LogoutConfirmationCardProps) {
  const [revokeAll, setRevokeAll] = useState<boolean>(false);
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const navigate = useNavigate();
  const { mutate: logout, isPending, isError } = useLogout();

  const displayName = user?.fullName || "Nguyễn Văn Nam";
  const displayEmail = user?.email || "nam@example.com";
  const displayRole = user?.role === "ADMIN" ? "Quản trị viên" : "Chủ kho di sản";

  /**
   * @description Xử lý thực hiện đăng xuất
   */
  const handleLogout = (): void => {
    // TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
    // 1. [MỤC TIÊU]: Gọi API POST /api/v1/auth/logout kèm tùy chọn revokeAllDevices.
    // 2. [INPUT]: revokeAll (boolean). [OUTPUT]: Hủy token và chuyển sang trang Đã đăng xuất.
    // 3. [CÁC BƯỚC]:
    //    - Gọi mutation logout({ revokeAllDevices: revokeAll }).
    //    - Chỉ điều hướng sau khi server xác nhận; lỗi giữ màn hình để thử lại.
    // 4. [HÀM/THƯ VIỆN]: useLogout(), navigate(ROUTES.AUTH.LOGGED_OUT).
    // 5. [ĐIỀU KIỆN BIÊN]: Hook xóa access token RAM/cache khi thành công;
    //    không báo đã thu hồi khi mất mạng/API lỗi. Developer bổ sung cleanup
    //    khóa nội dung nếu sau này có phiên giải mã và xử lý login/refresh race.
    logout(
      { revokeAllDevices: revokeAll },
      {
        onSuccess: () => {
          navigate(ROUTES.AUTH.LOGGED_OUT);
        },
      }
    );
  };

  return (
    <div className={`w-full space-y-6 text-left ${className}`}>
      {/* Tiêu đề */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#0F1A16]">
          Đăng xuất khỏi LegacyVault?
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66]">
          Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại trên thiết bị này?
        </p>
      </div>

      {/* Thông tin tài khoản người dùng (User Pill) */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5DF] flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-[#0A281E] text-[#FAFAF6] font-bold text-base flex items-center justify-center flex-shrink-0">
          {displayName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#0F1A16] truncate">{displayName}</p>
          <p className="text-[11px] text-[#6B6B66] truncate">
            {displayRole} · {displayEmail}
          </p>
        </div>
        <ShieldCheck className="w-4 h-4 text-[#B88E4C] flex-shrink-0" />
      </div>

      {/* CẢNH BÁO SỐNG CÒN DMS - QUY TẮC NGHIỆP VỤ ĐIỂM DANH SINH TỒN */}
      <div className="p-4 rounded-2xl bg-[#F0F5F2] border border-[#CCDCD2] text-[#0A281E] space-y-1">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#0A281E] flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-[#0A281E]">
              Đăng xuất không thay thế điểm danh.
            </p>
            <p className="text-[#3F5B4E] mt-0.5">
              Kỳ điểm danh tiếp theo của bạn là <span className="font-semibold text-[#0A281E]">28/10/2026</span>, còn <span className="font-semibold text-[#0A281E]">21 ngày</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Tùy chọn Đăng xuất khỏi mọi thiết bị */}
      <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E5E5DF] bg-white hover:bg-[#FAF9F5] cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={revokeAll}
          onChange={(e) => setRevokeAll(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0A281E] focus:ring-[#0A281E]"
        />
        <div className="text-xs">
          <p className="font-semibold text-[#0F1A16]">Đăng xuất khỏi mọi thiết bị</p>
          <p className="text-[11px] text-[#6B6B66] mt-0.5">
            Dùng khi bạn nghi ngờ có người khác đang đăng nhập trái phép vào tài khoản của bạn.
          </p>
        </div>
      </label>

      {/* Nhóm nút hành động */}
      <div className="space-y-2 pt-2">
        {isError && <p role="alert" className="text-sm text-red-700">{APP_MESSAGES.ERROR.DEFAULT}</p>}
        <Button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="w-full h-11 rounded-xl bg-[#9B1C1C] hover:bg-[#801717] text-[#FAFAF6] text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isPending ? "Đang xử lý..." : "Đăng xuất"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            if (onClose) onClose();
            else navigate(-1);
          }}
          className="w-full h-11 rounded-xl border-[#D5D0C3] hover:bg-white text-[#0F1A16] text-xs font-medium"
        >
          Ở lại
        </Button>
      </div>
    </div>
  );
}
