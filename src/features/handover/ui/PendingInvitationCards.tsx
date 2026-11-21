import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Initial } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import type { PendingInvitation } from "../model/handover.schema";
import { useHandoverAction } from "../model/useHandoverAction";
import { usePendingInvitations } from "../model/usePendingInvitations";

/**
 * Một thư mời: bấm Bắt đầu thì gọi API nhận lượt rồi chuyển sang màn nộp căn cước. Chỉ mở trang thì không nhận gì.
 * Lỗi (ví dụ sai email) hiện ngay trên thẻ và không điều hướng.
 */
function InvitationCard({ invitation, email }: { invitation: PendingInvitation; email: string }) {
  const action = useHandoverAction();
  const client = useQueryClient();
  const navigate = useNavigate();

  const start = () => {
    void action.execute(
      () => handoverService.claimTurn(invitation.turnId),
      () => {
        void client.invalidateQueries({ queryKey: ["handover"] });
        navigate(ROUTES.BENEFICIARY.HANDOVER);
      },
    );
  };

  let sender = `Từ ${invitation.ownerFullName}`;
  if (email) {
    sender = `${sender} · gửi tới ${email}`;
  }
  return (
    <article
      aria-label={`Thư mời nhận tài sản từ ${invitation.ownerFullName}`}
      className="space-y-4 rounded-2xl border border-[#E0C486] bg-[#FBF3DC] p-5"
    >
      <header className="flex items-center gap-4">
        <Initial name={invitation.ownerFullName || "?"} className="size-12 shrink-0" />
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-heritage-primary">
            {invitation.containerName}
          </h3>
          <p className="break-words text-sm text-heritage-muted">{sender}</p>
        </div>
      </header>
      <p className="text-sm leading-6">
        Bạn có tên trong biên bản bàn giao do luật sư lập. Bấm Bắt đầu để nộp căn cước cho luật sư
        kiểm, rồi ký biên bản và nhận tài sản.
      </p>
      <button type="button" className={buttonStyles.dark} disabled={action.pending} onClick={start}>
        Bắt đầu
      </button>
      {action.pending && (
        <p role="status" className="text-sm text-heritage-muted">
          Đang mở bước nộp căn cước…
        </p>
      )}
      {action.error && !action.pending && (
        <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
          {action.error}
        </p>
      )}
    </article>
  );
}

/**
 * Khu "GÓI MỚI CHỜ BẠN XÁC NHẬN" ở đầu cổng người nhận. Chỉ hiện khi Backend trả lời mời cho tài khoản này
 * (đúng email đã xác minh); không có lời mời hoặc lỗi tải thì không hiện gì.
 */
export function PendingInvitationCards() {
  const invitations = usePendingInvitations();
  const email = useSelector((state: { auth: AuthState }) => state.auth.user?.email);
  if (!invitations.isSuccess || invitations.data.length === 0) return null;
  return (
    <section aria-labelledby="pending-invitations-title" className="space-y-3">
      <h2
        id="pending-invitations-title"
        className="text-sm font-semibold tracking-widest text-[#7A5B24]"
      >
        GÓI MỚI CHỜ BẠN XÁC NHẬN
      </h2>
      {invitations.data.map((invitation) => (
        <InvitationCard key={invitation.turnId} invitation={invitation} email={email ?? ""} />
      ))}
    </section>
  );
}
