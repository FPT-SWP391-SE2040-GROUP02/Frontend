import { useSelector } from "react-redux";
import { PaperPreviewButton } from "@/entities/handoverRecord";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useExecutorWillPaper } from "@/entities/will/model/useExecutorWillPaper";
import type { ExecutorVault } from "../model/deathCase.schema";

/**
 * Nút xem lại biên bản phân chia giữa Chủ tài sản và Người thực thi, chỉ đọc, in được. Tờ giống bên Chủ tài sản (bản đã
 * ký gần nhất); mở khung mới tải, mỗi lần xem Backend ghi nhật ký.
 */
export function ExecutorWillButton({
  vault,
  onOpen,
  primary,
}: {
  vault: ExecutorVault;
  /** Gọi khi tờ của phiên bản này đã hiện ra (để biết họ đã xem trước khi ký). */
  onOpen?: () => void;
  primary?: boolean;
}) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  // Chữ ký của Người thực thi chỉ in khi họ đã ký đúng phiên bản này.
  let executorSignedAt: string | null = null;
  if (vault.willVersionNo && vault.confirmedWillVersionNo === vault.willVersionNo) {
    executorSignedAt = vault.willConfirmedAt ?? vault.acceptedAt ?? null;
  }
  const will = useExecutorWillPaper({
    source: { kind: "vault", id: vault.vaultId },
    versionNo: vault.willVersionNo ?? null,
    executor: {
      email: user?.email ?? "",
      fullName: user?.fullName ?? null,
      signedAt: executorSignedAt,
    },
    onRead: onOpen,
  });
  return (
    <PaperPreviewButton
      onOpen={will.onOpen}
      onClose={will.onClose}
      printDisabled={!will.ready}
      primary={primary}
      label="Xem biên bản với Chủ tài sản"
      title="Biên bản phân chia"
      fileName="Bien-ban-phan-chia"
      paper={will.paper}
    />
  );
}
