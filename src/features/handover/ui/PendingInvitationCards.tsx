import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthState } from "@/entities/user/model/authSlice";
import { handoverDocumentKeys, handoverDocumentService } from "@/entities/handoverDocument";
import type { DocumentKind } from "@/entities/handoverDocument";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Initial } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import type { PendingInvitation } from "../model/handover.schema";
import { useHandoverAction } from "../model/useHandoverAction";
import { usePendingInvitations } from "../model/usePendingInvitations";

/**
 * Một thư mời: chọn Đồng ý nhận hoặc Từ chối nhận. Không có bước "nhận lượt" riêng: bấm nút nào thì gọi API nhận lượt
 * ở phía sau, rồi chuyển sang màn tải ảnh căn cước và ký biên bản với đúng lựa chọn đã chọn sẵn. Chỉ mở trang thì
 * không nhận gì. Lỗi (ví dụ sai email) hiện ngay trên thẻ và không điều hướng.
 */
function InvitationCard({ invitation, email }: { invitation: PendingInvitation; email: string }) {
  const action = useHandoverAction();
  const client = useQueryClient();
  const navigate = useNavigate();

  const choose = (kind: DocumentKind) => {
    void action.execute(
      async () => {
        const claimed = await handoverService.claimTurn(invitation.turnId);
        // Lượt đang ở bước biên bản thì tạo sẵn biên bản theo lựa chọn; lỗi ở đây không chặn việc chuyển màn,
        // vì màn biên bản vẫn cho chọn lại.
        if (claimed.status === "IDENTITY_IN_PROGRESS") {
          try {
            await handoverDocumentService.create(invitation.turnId, kind);
          } catch {
            // Người nhận chọn lại ở màn biên bản.
          }
        }
        return claimed;
      },
      () => {
        void client.invalidateQueries({ queryKey: ["handover"] });
        void client.invalidateQueries({ queryKey: handoverDocumentKeys.all });
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
      aria-label={`Thư mời nhận gói ${invitation.containerName}`}
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
        Bạn muốn nhận gói này không? Bấm nút nào, bạn sẽ được chuyển sang tải ảnh căn cước và ký
        biên bản theo lựa chọn đó. Người xét duyệt sẽ kiểm tra trước khi mở gói.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={buttonStyles.dark}
          disabled={action.pending}
          onClick={() => choose("ACCEPT")}
        >
          Đồng ý nhận
        </button>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={action.pending}
          onClick={() => choose("DECLINE")}
        >
          Từ chối nhận
        </button>
      </div>
      {action.pending && (
        <p role="status" className="text-sm text-heritage-muted">
          Đang mở bước tải ảnh căn cước và ký biên bản…
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
        className="text-xs font-semibold tracking-widest text-[#7A5B24]"
      >
        GÓI MỚI CHỜ BẠN XÁC NHẬN
      </h2>
      {invitations.data.map((invitation) => (
        <InvitationCard key={invitation.turnId} invitation={invitation} email={email ?? ""} />
      ))}
    </section>
  );
}
