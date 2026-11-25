import { useSelector } from "react-redux";
import { PaperPreviewButton } from "@/entities/handoverRecord";
import type { AuthState } from "@/entities/user/model/authSlice";
import { WillDocument } from "@/entities/will/ui/WillDocument";
import { Notice } from "@/shared/ui/heritageKit";
import type { MyInvitation } from "../model/myInvitations.schema";

/**
 * Tờ biên bản phân chia Chủ kho đã ký, để người được mời đọc trước khi ký nhận vai. Chỉ có số đếm, không có tên tài sản
 * hay người nhận. Chủ kho chưa ký thì chỉ báo chờ.
 */
export function InvitationPaper({
  invitation,
  read,
  onRead,
  asStep = false,
}: {
  invitation: MyInvitation;
  /** Đã mở tờ của đúng phiên bản này. */
  read: boolean;
  onRead: () => void;
  /** Nằm trong danh sách bước: nút nổi bật khi chưa đọc và không cần câu nhắc đọc trước. */
  asStep?: boolean;
}) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  if (!invitation.willReady || !invitation.willVersionNo) {
    return (
      <Notice tone="warning" title="Chờ Chủ kho ký">
        Chủ kho ký biên bản phân chia trước. Khi đó bạn xem được biên bản rồi mới ký nhận vai.
      </Notice>
    );
  }
  let hint: string | null = "Mở biên bản và đọc trước khi ký.";
  if (asStep) {
    hint = null;
  }
  if (read) {
    hint = `Bạn đã mở biên bản phiên bản ${invitation.willVersionNo}.`;
  }
  return (
    <div className="space-y-2">
      <PaperPreviewButton
        label="Xem biên bản phân chia"
        title="Biên bản phân chia"
        fileName="Bien-ban-phan-chia"
        onOpen={onRead}
        primary={asStep && !read}
        paper={
          <WillDocument
            ownerName={invitation.ownerName}
            signedAt={invitation.willSignedAt}
            executor={{
              email: invitation.inviteeEmail,
              fullName: user?.fullName ?? null,
              signedAt: null,
            }}
            version={{
              number: invitation.willVersionNo,
              signedAt: invitation.willSignedAt ?? null,
            }}
            counts={{ assets: invitation.assetCount, recipients: invitation.recipientCount }}
          />
        }
      />
      {hint && <p className="text-sm text-heritage-muted">{hint}</p>}
    </div>
  );
}
