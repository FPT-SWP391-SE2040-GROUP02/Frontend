import { useQuery } from "@tanstack/react-query";
import { deathCaseService } from "../api/deathCaseService";

/** Khóa cache danh sách người nhận và tài sản theo kho. */
export const executorRecipientsKey = (vaultId: string) => ["executor-recipients", vaultId] as const;

/** Các người nhận của kho kèm tài sản được gán (chỉ danh sách). Không retry để 403/404 không bị gọi lặp. */
export function useExecutorRecipients(vaultId: string | null | undefined) {
  return useQuery({
    queryKey: executorRecipientsKey(vaultId ?? ""),
    queryFn: ({ signal }) => deathCaseService.recipients(vaultId!, signal),
    enabled: Boolean(vaultId),
    retry: false,
  });
}
