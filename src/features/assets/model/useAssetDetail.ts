import { useQuery } from "@tanstack/react-query";
import { backendAssetService } from "../api/backendAssetService";

/** Khóa cache của một tài sản; nằm dưới "vault-assets" để các thao tác ghi làm mới luôn cả danh sách. */
export const assetDetailKey = (vaultId: string, assetId: string) =>
  ["vault-assets", vaultId, "detail", assetId] as const;

/** Đọc metadata một tài sản. Không có nội dung bí mật trong dữ liệu này. */
export function useAssetDetail(vaultId: string, assetId: string) {
  return useQuery({
    queryKey: assetDetailKey(vaultId, assetId),
    queryFn: ({ signal }) => backendAssetService.get(vaultId, assetId, signal),
    enabled: Boolean(vaultId && assetId),
    retry: false,
  });
}
