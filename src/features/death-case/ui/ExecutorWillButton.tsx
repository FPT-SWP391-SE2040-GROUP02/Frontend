import { useSelector } from "react-redux";
import { PaperPreviewButton } from "@/entities/handoverRecord";
import type { AuthState } from "@/entities/user/model/authSlice";
import type { WillVersionView } from "@/entities/will/model/willDocument.types";
import { WillDocument } from "@/entities/will/ui/WillDocument";
import type { ExecutorVault } from "../model/deathCase.schema";

/**
 * Nút xem lại biên bản phân chia giữa Chủ tài sản và Người thực thi, chỉ đọc, in được. Tờ này không có tên tài sản hay
 * người nhận: tên và loại tài sản xem ở trang Tài sản; người nhận chỉ thấy khi luật sư đã chốt biên bản bàn giao.
 */
export function ExecutorWillButton({
  vault,
  onOpen,
  primary,
}: {
  vault: ExecutorVault;
  onOpen?: () => void;
  primary?: boolean;
}) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  let version: WillVersionView | null = null;
  if (vault.willVersionNo && vault.willSignedAt) {
    version = { number: vault.willVersionNo, signedAt: vault.willSignedAt };
  }
  // Chữ ký của Người thực thi chỉ in khi họ đã ký đúng phiên bản này.
  let executorSignedAt: string | null = null;
  if (vault.willVersionNo && vault.confirmedWillVersionNo === vault.willVersionNo) {
    executorSignedAt = vault.willConfirmedAt ?? vault.acceptedAt ?? null;
  }
  let counts: { assets: number; recipients: number } | undefined;
  if (vault.assetCount !== undefined && vault.recipientCount !== undefined) {
    counts = { assets: vault.assetCount, recipients: vault.recipientCount };
  }
  return (
    <PaperPreviewButton
      onOpen={onOpen}
      primary={primary}
      label="Xem biên bản với Chủ tài sản"
      title="Biên bản phân chia"
      fileName="Bien-ban-phan-chia"
      paper={
        <WillDocument
          ownerName={vault.ownerFullName}
          signedAt={vault.willSignedAt}
          executor={{
            email: user?.email ?? "",
            fullName: user?.fullName ?? null,
            signedAt: executorSignedAt,
          }}
          version={version}
          counts={counts}
        />
      }
    />
  );
}
