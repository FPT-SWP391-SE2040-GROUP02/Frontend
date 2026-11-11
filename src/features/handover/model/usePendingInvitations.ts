import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { handoverService } from "../api/handoverService";

/** Khóa nằm dưới ["handover"] nên mọi thao tác nhận/quyết định làm mới nó cùng danh sách lượt. */
export const pendingInvitationsKey = ["handover", "invitations", "mine"] as const;
/** Cùng khóa với danh sách lượt của cổng người nhận để hai nơi dùng chung một lần tải. */
export const myTurnsKey = ["handover", "turns"] as const;

/**
 * Lời mời nhận gói đang chờ tài khoản đang đăng nhập (đúng email đã xác minh, chưa ai nhận). Lời mời mới có thể tới
 * bất cứ lúc nào nên tải lại khi quay lại tab.
 */
export function usePendingInvitations(enabled = true) {
  return useQuery({
    queryKey: pendingInvitationsKey,
    queryFn: ({ signal }) => handoverService.myInvitations(signal),
    enabled,
    retry: false,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Tài khoản có vai Người nhận hay không: có lời mời chờ hoặc đã có lượt. Chỉ để hiện nút chuyển vai và huy hiệu;
 * không cấp quyền gì, Backend vẫn kiểm tra từng request. Đang tải hoặc lỗi thì coi như không có.
 */
export function useRecipientAccess() {
  const isAuthenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const enabled = isAuthenticated && Boolean(accessTokenMemory.get());
  const invitations = usePendingInvitations(enabled);
  const turns = useQuery({
    queryKey: myTurnsKey,
    queryFn: ({ signal }) => handoverService.list(signal),
    enabled,
    retry: false,
    staleTime: 10_000,
  });
  let invitationCount = 0;
  if (invitations.isSuccess) {
    invitationCount = invitations.data.length;
  }
  let hasTurns = false;
  if (turns.isSuccess) {
    hasTurns = turns.data.length > 0;
  }
  return { invitationCount, hasTurns, visible: invitationCount > 0 || hasTurns };
}
