import { useSelector } from "react-redux";
import { PaperPreviewButton } from "@/entities/handoverRecord";
import type { AuthState } from "@/entities/user/model/authSlice";
import type { WillVersionView } from "@/entities/will/model/willDocument.types";
import { WillDocument } from "@/entities/will/ui/WillDocument";
import type { ExecutorVault } from "../model/deathCase.schema";

/**
 * Nút xem lại biên bản phân chia giữa Chủ kho và Người thực thi, chỉ đọc, in được. Không có tên tài sản hay người nhận:
 * Người thực thi chỉ thấy phần này khi luật sư đã chốt biên bản bàn giao.
 */
export function ExecutorWillButton({ vault }: { vault: ExecutorVault }) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  let version: WillVersionView | null = null;
  if (vault.willVersionNo && vault.willSignedAt) {
    version = { number: vault.willVersionNo, signedAt: vault.willSignedAt };
  }
  return (
    <PaperPreviewButton
      label="Xem biên bản với Chủ kho"
      title="Biên bản phân chia"
      fileName="Bien-ban-phan-chia"
      paper={
        <WillDocument
          ownerName={vault.ownerFullName}
          signedAt={vault.willSignedAt}
          executor={{
            email: user?.email ?? "",
            fullName: user?.fullName ?? null,
            signedAt: vault.acceptedAt ?? null,
          }}
          version={version}
        />
      }
    />
  );
}
