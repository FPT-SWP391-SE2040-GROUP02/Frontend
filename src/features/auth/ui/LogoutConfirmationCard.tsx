import { useId, useState, type CSSProperties } from "react";
import { useLogout } from "../model/useAuth";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { Button } from "@/shared/ui/button";
import { Check, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { APP_MESSAGES } from "@/shared/constants";
import { LOGOUT_CONTENT, LOGOUT_ROLE_LABELS } from "../model/logout.content";

/** Các khối của thẻ vào lần lượt cách nhau 70ms (xem portalMotion.css). */
function stagger(index: number): CSSProperties {
  return { "--pm-i": index } as CSSProperties;
}

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
 * @description Thẻ xác nhận đăng xuất tài khoản: ai đang đăng nhập, đăng xuất không ảnh hưởng kế hoạch bàn giao,
 * tùy chọn đăng xuất khỏi mọi thiết bị.
 *
 * @param {LogoutConfirmationCardProps} props Thuộc tính component
 * @returns {React.JSX.Element} Thẻ xác nhận đăng xuất
 */
export function LogoutConfirmationCard({ onClose, className = "" }: LogoutConfirmationCardProps) {
  const [revokeAll, setRevokeAll] = useState<boolean>(false);
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const navigate = useNavigate();
  const { mutate: logout, isPending, isError } = useLogout();
  const optionId = useId();

  const displayName = user?.fullName || LOGOUT_CONTENT.unnamedAccount;

  /**
   * @description Xử lý thực hiện đăng xuất
   */
  const handleLogout = (): void => {
    logout(
      { revokeAllDevices: revokeAll },
      {
        onSuccess: () => {
          navigate(ROUTES.AUTH.LOGGED_OUT);
        },
      },
    );
  };

  return (
    <div className={`w-full space-y-6 text-left ${className}`}>
      {/* Tiêu đề */}
      <div className="pm-rise space-y-3" style={stagger(0)}>
        <span
          aria-hidden="true"
          className="pm-pop inline-flex size-12 items-center justify-center rounded-2xl bg-heritage-primary-light text-heritage-primary"
        >
          <LogOut className="size-5" />
        </span>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl leading-tight font-normal text-balance text-heritage-text sm:text-[1.75rem]">
            Đăng xuất khỏi LegacyVault?
          </h1>
          <p className="text-sm leading-6 text-heritage-muted">
            Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại trên thiết bị này?
          </p>
        </div>
      </div>

      {/* Thông tin tài khoản người dùng */}
      <div className="pm-rise" style={stagger(1)}>
        {user ? (
          <div className="flex items-center gap-3.5 rounded-2xl border border-heritage-border bg-white p-4 shadow-sm">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-heritage-primary text-base font-bold text-heritage-surface">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-heritage-text">{displayName}</p>
              <p className="text-sm leading-5 break-all text-heritage-muted">
                {LOGOUT_ROLE_LABELS[user.role]} · {user.email}
              </p>
            </div>
            <ShieldCheck className="size-5 shrink-0 text-heritage-gold" aria-hidden="true" />
          </div>
        ) : (
          <p role="status" className="text-sm text-heritage-muted">
            {LOGOUT_CONTENT.accountUnavailable}
          </p>
        )}
      </div>

      {/* Đăng xuất không ảnh hưởng kế hoạch bàn giao */}
      <div
        className="pm-rise flex items-start gap-3 rounded-2xl border border-heritage-primary/15 bg-heritage-primary-light p-4"
        style={stagger(2)}
      >
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-heritage-primary text-heritage-surface">
          <Check className="size-3.5" aria-hidden="true" />
        </span>
        <div className="text-sm leading-6">
          <p className="font-semibold text-heritage-primary">{LOGOUT_CONTENT.dmsReminder}</p>
          <p className="text-heritage-muted">{LOGOUT_CONTENT.dmsGuidance}</p>
        </div>
      </div>

      {/* Tùy chọn Đăng xuất khỏi mọi thiết bị */}
      <label
        htmlFor={optionId}
        className="pm-rise flex cursor-pointer items-start gap-3 rounded-2xl border border-heritage-border bg-white p-4 transition-colors duration-200 hover:border-heritage-primary/40 has-[:checked]:border-heritage-primary has-[:checked]:bg-heritage-primary-light/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-heritage-gold-hover"
        style={stagger(3)}
      >
        <input
          id={optionId}
          type="checkbox"
          checked={revokeAll}
          disabled={isPending}
          onChange={(e) => setRevokeAll(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-heritage-primary"
        />
        <div className="text-sm leading-6">
          <p className="font-semibold text-heritage-text">Đăng xuất khỏi mọi thiết bị</p>
          <p className="text-heritage-muted">
            Dùng khi bạn nghi ngờ có người khác đang đăng nhập trái phép vào tài khoản của bạn.
          </p>
        </div>
      </label>

      {/* Nhóm nút hành động */}
      <div className="pm-rise space-y-3" style={stagger(4)}>
        {isError && (
          <p role="alert" className="pm-fade text-sm text-heritage-danger">
            {APP_MESSAGES.ERROR.DEFAULT}
          </p>
        )}
        <Button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-heritage-danger text-sm font-semibold text-heritage-surface shadow-md transition-[filter,transform] duration-200 hover:brightness-95 active:scale-[0.98]"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
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
          className="h-12 w-full rounded-xl border-heritage-border-strong text-sm font-medium text-heritage-text transition-transform duration-200 hover:bg-white active:scale-[0.98]"
        >
          Ở lại
        </Button>
      </div>
    </div>
  );
}
