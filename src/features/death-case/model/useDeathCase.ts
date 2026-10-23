import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { deathCaseService } from "../api/deathCaseService";
import type { ExecutorVault } from "./deathCase.schema";

/** Một hồ sơ chứng tử của Executor. Không có id thì không gửi request. */
export function useDeathCase(caseId: string | null | undefined) {
  return useQuery({
    queryKey: ["death-case", caseId],
    queryFn: ({ signal }) => deathCaseService.get(caseId!, signal),
    enabled: Boolean(caseId),
    retry: false,
  });
}

/**
 * Hồ sơ đang xem của kho: ?caseId= (ví dụ hồ sơ bị từ chối gần nhất), nếu không thì hồ sơ đang mở của kho.
 * Chỉ nhận caseId khi thuộc kho đang chọn, để link cũ của kho khác không mở nhầm hồ sơ.
 */
export function useActiveCaseId(vault: ExecutorVault | null): string | null {
  const [params] = useSearchParams();
  const fromUrl = params.get("caseId");
  if (!vault) return null;
  if (fromUrl && (fromUrl === vault.openDeathCaseId || fromUrl === vault.lastRejectedDeathCaseId)) {
    return fromUrl;
  }
  return vault.openDeathCaseId;
}
