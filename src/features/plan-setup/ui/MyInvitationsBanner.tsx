import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { useServerNow } from "@/shared/clock/useServerNow";
import { useMyInvitations } from "../model/useMyInvitations";
import { remainingTime } from "../lib/myInvitationHelpers";

/**
 * Dải mỏng trên Tổng quan Chủ tài sản khi có lời mời làm Người thực thi đang chờ. Người chưa là Executor không có
 * nút chuyển vai, nên lời mời phải hiện ở đây. Không có lời mời (hoặc lỗi tải) thì không hiện gì.
 */
export function MyInvitationsBanner({ invitationsHref }: { invitationsHref: string }) {
  const invitations = useMyInvitations();
  const serverNow = useServerNow();
  if (!invitations.isSuccess) return null;
  const pending = invitations.data.pending;
  if (pending.length === 0) return null;
  const first = pending[0];
  const remaining = remainingTime(first.expiresAt, serverNow.getTime());
  const others = pending.length - 1;
  return (
    <section
      aria-label="Lời mời làm Người thực thi"
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-heritage-gold-soft bg-heritage-warning-bg px-5 py-4"
    >
      <Mail className="size-5 shrink-0 text-heritage-warning" aria-hidden="true" />
      <div className="min-w-0 flex-1 basis-56">
        <p className="font-semibold text-heritage-primary">
          {first.ownerName} mời bạn làm Người thực thi
        </p>
        <p className="text-sm text-heritage-muted">
          Giữ mã nhận, giao tài sản theo biên bản. Không đọc được nội dung tài sản.
          {others > 0 && ` Còn ${others} lời mời nữa.`}
        </p>
      </div>
      <Chip tone={remaining.tone}>{remaining.label}</Chip>
      <Link to={invitationsHref} className={buttonStyles.dark}>
        Xem lời mời
      </Link>
    </section>
  );
}
