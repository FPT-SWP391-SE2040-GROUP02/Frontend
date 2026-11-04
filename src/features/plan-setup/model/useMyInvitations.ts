import { useQuery } from "@tanstack/react-query";
import { POLLING_INTERVAL } from "@/shared/config";
import { planSetupService } from "../api/planSetupService";

/** Cache lời mời của tôi; trả lời lời mời xong thì làm mới khóa này cùng danh sách kho Executor. */
export const myInvitationsKey = ["executor-invitations", "mine"] as const;

/**
 * Lời mời làm Người thực hiện gửi tới email đã xác minh của tài khoản. Dùng chung cho dải ở Tổng quan,
 * nút ở sidebar và trang Lời mời. Lời mời mới có thể tới bất cứ lúc nào nên tải lại khi quay lại tab và định kỳ.
 */
export function useMyInvitations(enabled = true) {
  return useQuery({
    queryKey: myInvitationsKey,
    queryFn: ({ signal }) => planSetupService.mine(signal),
    enabled,
    retry: false,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: POLLING_INTERVAL.NORMAL,
    refetchIntervalInBackground: false,
  });
}
