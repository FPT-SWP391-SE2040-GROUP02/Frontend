import { useQueries, useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { handoverService } from "../api/handoverService";
import type { handoverTurnSchema, PendingInvitation, Submission } from "./handover.schema";
import { describeTurn, type TurnView } from "./turnPresentation";
import { myTurnsKey, usePendingInvitations } from "./usePendingInvitations";

type Turn = z.infer<typeof handoverTurnSchema>;

/** Một lượt kèm cách hiển thị đã tính sẵn. */
export interface TurnEntry {
  turn: Turn;
  view: TurnView;
}

/**
 * Các lượt bàn giao của tài khoản kèm trạng thái hiển thị. Lượt đang xác minh danh tính cần hồ sơ danh tính mới nhất
 * để biết đã nộp hay phải nộp lại; dùng chung khóa với khung nộp căn cước nên không gọi API thừa.
 */
export function useTurnOverview(enabled = true) {
  const authorized = enabled && Boolean(accessTokenMemory.get());
  const turnsQuery = useQuery({
    queryKey: myTurnsKey,
    queryFn: ({ signal }) => handoverService.list(signal),
    enabled: authorized,
    retry: false,
    staleTime: 10_000,
  });
  const invitationsQuery = usePendingInvitations(authorized);
  const turns = turnsQuery.data;
  const verifying = (turns ?? []).filter((turn) => turn.status === "IDENTITY_IN_PROGRESS");
  const submissions = useQueries({
    queries: verifying.map((turn) => ({
      queryKey: ["handover", "submission", turn.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        handoverService.latestSubmission(turn.id, signal),
      retry: false,
    })),
  });
  const submissionByTurn = new Map<string, Submission | null | undefined>();
  verifying.forEach((turn, index) => submissionByTurn.set(turn.id, submissions[index]?.data));

  const entries: TurnEntry[] = (turns ?? []).map((turn) => ({
    turn,
    view: describeTurn(turn, submissionByTurn.get(turn.id)),
  }));
  // Lời mời chưa nhận: bỏ những lời mời đã có trong danh sách lượt để một kho không hiện hai dòng.
  const known = new Set((turns ?? []).map((turn) => turn.id));
  const invitations: PendingInvitation[] = (invitationsQuery.data ?? []).filter(
    (invitation) => !known.has(invitation.turnId),
  );
  const urgentCount =
    entries.filter((entry) => entry.view.group === "urgent").length + invitations.length;
  return {
    entries,
    invitations,
    urgentCount,
    isPending: turnsQuery.isPending,
    isError: turnsQuery.isError,
    isFetching: turnsQuery.isFetching,
    refetch: () => void turnsQuery.refetch(),
  };
}
