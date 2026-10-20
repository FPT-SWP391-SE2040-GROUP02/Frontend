import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { backendAssetService } from "../api/backendAssetService";
import type { BackendAsset } from "./backendAsset.schema";

/** Tên tệp tải về an toàn, không chứa ký tự đường dẫn hoặc điều khiển. */
const safeFileName = (value: string) => value.replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 120);

/**
 * Tải một phiên bản của tài sản về máy. Backend giải mã và kiểm toàn vẹn trước byte đầu tiên;
 * blob chỉ nằm trong object URL tạm rồi được thu hồi, không vào cache.
 */
export function useAssetDownload(vaultId: string, asset: BackendAsset) {
  const action = usePrivateAction();
  const fileName =
    asset.kind === "TEXT" ? `${asset.name}.txt` : (asset.currentVersion.fileName ?? asset.name);
  const download = (version: number) =>
    void action.execute(
      () => backendAssetService.download(vaultId, asset.id, version),
      (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = safeFileName(fileName);
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
    );
  return { download, pending: action.pending, error: action.error };
}
