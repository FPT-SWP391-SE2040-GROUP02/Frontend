import type { HandoverProgressTurn } from "./handoverProgress.schema";

/** Các lượt (mỗi lượt một gói) của cùng một người nhận, để màn hình tiến độ hiện theo người. */
export type RecipientGroup = {
  key: string;
  fullName: string | null;
  phone: string | null;
  citizenIdLast4: string;
  turns: HandoverProgressTurn[];
};

/**
 * Gom lượt theo beneficiaryId, giữ thứ tự Backend trả. Không gom theo 4 số cuối CCCD vì hai người có thể trùng;
 * Backend cũ chưa có beneficiaryId thì mỗi lượt đứng riêng. Họ tên lấy từ lượt đầu tiên còn có (lượt đã kết thúc
 * Backend không trả họ tên).
 */
export function groupTurnsByRecipient(turns: HandoverProgressTurn[]): RecipientGroup[] {
  const groups: RecipientGroup[] = [];
  const byKey = new Map<string, RecipientGroup>();
  for (const turn of turns) {
    const key = turn.beneficiaryId ?? `turn:${turn.turnId}`;
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        fullName: null,
        phone: null,
        citizenIdLast4: turn.beneficiaryCitizenIdLast4,
        turns: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.turns.push(turn);
    if (!group.fullName && turn.beneficiaryFullName) {
      group.fullName = turn.beneficiaryFullName;
    }
    if (!group.phone && turn.beneficiaryPhone) {
      group.phone = turn.beneficiaryPhone;
    }
  }
  return groups;
}
