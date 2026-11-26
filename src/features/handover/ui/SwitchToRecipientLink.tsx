import { Link } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { RailLabel } from "@/shared/ui/sideRail/RailLabel";
import { useRecipientAccess } from "../model/usePendingInvitations";

/**
 * Nút "Sang vai Người nhận" đặt cạnh nút chuyển vai khác ở sidebar. Chỉ hiện khi tài khoản có lời mời nhận gói đang chờ
 * hoặc đã có lượt; huy hiệu là số lời mời đang chờ. Không cấp quyền gì, Backend vẫn kiểm tra từng request.
 */
export function SwitchToRecipientLink({
  className,
  onNavigate,
}: {
  className: string;
  onNavigate?: () => void;
}) {
  const access = useRecipientAccess();
  if (!access.visible) return null;
  return (
    <Link
      to={ROUTES.BENEFICIARY.CLAIM}
      title="Sang vai Người nhận"
      className={className}
      onClick={onNavigate}
    >
      <ArrowLeftRight className="size-4 shrink-0" aria-hidden="true" />
      <RailLabel order={1}>Sang vai Người nhận</RailLabel>
      {access.invitationCount > 0 && (
        <span
          aria-label={`${access.invitationCount} lời mời đang chờ`}
          className="u040-badge ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-heritage-danger px-1.5 text-sm font-bold text-white"
        >
          {access.invitationCount}
        </span>
      )}
    </Link>
  );
}
