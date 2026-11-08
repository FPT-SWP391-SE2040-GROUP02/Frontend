import type { DeathCase, ExecutorVault } from "./deathCase.schema";

export interface ExecutorNotification {
  /** Ổn định theo sự kiện để nhớ thông báo nào đã đọc. */
  id: string;
  /** Mốc thời gian có thật của sự kiện; null với tình trạng đang diễn ra. */
  at: string | null;
  text: string;
}

/**
 * Thông báo cho Người thực thi, chỉ lấy từ dữ liệu Backend đã trả (kho và hồ sơ chứng tử).
 * Tình trạng đang diễn ra nằm trên cùng, các sự kiện có mốc thời gian xếp mới nhất trước.
 */
export function deriveNotifications(
  vault: ExecutorVault,
  record: DeathCase | null | undefined,
): ExecutorNotification[] {
  const current: ExecutorNotification[] = [];
  const events: ExecutorNotification[] = [];
  const hasCase = Boolean(vault.openDeathCaseId);
  if (vault.checkInOverdue && !hasCase) {
    current.push({
      id: `overdue:${vault.planStatus}`,
      at: null,
      text: `${vault.ownerFullName} đã quá hạn điểm danh. Tới lượt bạn.`,
    });
  } else if (vault.planStatus === "CHECKIN_OVERDUE" && !hasCase) {
    current.push({
      id: "waiting",
      at: null,
      text: `${vault.ownerFullName} trễ điểm danh, đang trong thời gian chờ.`,
    });
  }
  if (vault.executorNoteUpdatedAt) {
    events.push({
      id: `note:${vault.executorNoteUpdatedAt}`,
      at: vault.executorNoteUpdatedAt,
      text: `${vault.ownerFullName} cập nhật hướng dẫn cho bạn.`,
    });
  }
  if (record) {
    events.push({ id: `opened:${record.id}`, at: record.createdAt, text: "Bạn mở hồ sơ báo tin." });
    const submittedAt = record.currentVersion.submittedAt;
    if (submittedAt) {
      events.push({
        id: `submitted:${record.id}:${record.currentVersion.versionNo}`,
        at: submittedAt,
        text: `Bạn đã gửi hồ sơ (bản ${record.currentVersion.versionNo}).`,
      });
    }
    if (record.supplementRequest) {
      events.push({
        id: `supplement:${record.id}:${record.supplementRequest.requestedAt}`,
        at: record.supplementRequest.requestedAt,
        text: `Người xét duyệt yêu cầu bổ sung: ${record.supplementRequest.reason}`,
      });
    }
    if (record.status === "APPROVED_FOR_HANDOVER" && record.updatedAt) {
      events.push({
        id: `approved:${record.id}`,
        at: record.updatedAt,
        text: "Hồ sơ đã được duyệt để bàn giao.",
      });
    }
    if (record.status === "REJECTED" && record.updatedAt) {
      events.push({
        id: `rejected:${record.id}`,
        at: record.updatedAt,
        text: "Hồ sơ không được chấp thuận.",
      });
    }
  }
  events.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());
  return current.concat(events);
}
