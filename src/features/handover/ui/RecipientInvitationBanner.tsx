import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { usePendingInvitations } from "../model/usePendingInvitations";

/**
 * Khung vàng trên Tổng quan Chủ kho khi có người để lại một gói cho tài khoản này (cùng email đã xác minh).
 * Gói nằm ở cổng người nhận; khung chỉ dẫn tới đó, không nhận gì thay người dùng. Không có lời mời thì không hiện gì.
 */
export function RecipientInvitationBanner() {
  const invitations = usePendingInvitations();
  if (!invitations.isSuccess || invitations.data.length === 0) return null;
  const first = invitations.data[0];
  const others = invitations.data.length - 1;
  return (
    <section
      aria-label="Gói được để lại cho bạn"
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E0C486] bg-[#FBF3DC] px-5 py-4"
    >
      <Gift className="size-5 shrink-0 text-[#7A5B25]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-heritage-primary">
          {first.ownerFullName} đã để lại cho bạn một gói
        </p>
        <p className="text-sm text-heritage-muted">
          Gói nằm ở cổng người nhận, bạn có thể mở bất cứ lúc nào bạn sẵn sàng.
          {others > 0 && ` Còn ${others} gói nữa.`}
        </p>
      </div>
      <Link to={ROUTES.BENEFICIARY.CLAIM} className={buttonStyles.dark}>
        Mở cổng người nhận
      </Link>
    </section>
  );
}
