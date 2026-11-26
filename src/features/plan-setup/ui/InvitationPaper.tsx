import { useSelector } from "react-redux";
import { PaperPreviewButton } from "@/entities/handoverRecord";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useExecutorWillPaper } from "@/entities/will/model/useExecutorWillPaper";
import { Notice } from "@/shared/ui/heritageKit";
import type { MyInvitation } from "../model/myInvitations.schema";

/**
 * Tờ biên bản phân chia Chủ tài sản đã ký, để người được mời đọc trước khi ký nhận vai; nội dung giống bên Chủ tài sản.
 * Chủ tài sản chưa ký thì chỉ báo chờ.
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
  let versionNo: number | null = null;
  if (invitation.willReady && invitation.willVersionNo) {
    versionNo = invitation.willVersionNo;
  }
  const will = useExecutorWillPaper({
    source: { kind: "invitation", id: invitation.id },
    versionNo,
    executor: {
      email: invitation.inviteeEmail,
      fullName: user?.fullName ?? null,
      signedAt: null,
    },
    onRead,
  });
  if (versionNo === null) {
    return (
      <Notice tone="warning" title="Chờ Chủ tài sản ký">
        Chủ tài sản ký biên bản phân chia trước. Khi đó bạn xem được biên bản rồi mới ký nhận vai.
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
        onOpen={will.onOpen}
        onClose={will.onClose}
        printDisabled={!will.ready}
        primary={asStep && !read}
        paper={will.paper}
      />
      {hint && <p className="text-sm text-heritage-muted">{hint}</p>}
    </div>
  );
}
