import type { DeathCase, ExecutorVault } from "./deathCase.schema";

/** Mức chú ý để giao diện tô màu: attention là việc cần bạn làm, success/danger là kết quả xét duyệt. */
export type NotificationTone = "attention" | "info" | "success" | "danger";

export interface ExecutorNotification {
  /** Ổn định theo sự kiện để nhớ thông báo nào đã đọc. */
  id: string;
  /** Mốc thời gian có thật của sự kiện; null với tình trạng đang diễn ra. */
  at: string | null;
  /** Câu đầy đủ, dùng cho đọc màn hình và so sánh trong test. */
  text: string;
  /** Dòng đầu, ngắn: chuyện gì đã xảy ra. */
  title: string;
  /** Dòng giải thích bên dưới (lý do, số bản...); không có thì bỏ trống. */
  detail?: string;
  tone: NotificationTone;
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
      title: "Đến lượt bạn xử lý",
      detail: `${vault.ownerFullName} đã quá hạn điểm danh.`,
      tone: "attention",
    });
  } else if (vault.planStatus === "CHECKIN_OVERDUE" && !hasCase) {
    current.push({
      id: "waiting",
      at: null,
      text: `${vault.ownerFullName} trễ điểm danh, đang trong thời gian chờ.`,
      title: "Chủ kho trễ điểm danh",
      detail: `${vault.ownerFullName} đang trong thời gian chờ.`,
      tone: "info",
    });
  }
  if (vault.executorNoteUpdatedAt) {
    events.push({
      id: `note:${vault.executorNoteUpdatedAt}`,
      at: vault.executorNoteUpdatedAt,
      text: `${vault.ownerFullName} cập nhật hướng dẫn cho bạn.`,
      title: "Chủ kho cập nhật hướng dẫn",
      detail: `${vault.ownerFullName} đã cập nhật hướng dẫn dành cho bạn.`,
      tone: "info",
    });
  }
  if (record) {
    events.push({
      id: `opened:${record.id}`,
      at: record.createdAt,
      text: "Bạn mở hồ sơ báo tin.",
      title: "Bạn đã mở hồ sơ báo tin",
      tone: "info",
    });
    const submittedAt = record.currentVersion.submittedAt;
    if (submittedAt) {
      events.push({
        id: `submitted:${record.id}:${record.currentVersion.versionNo}`,
        at: submittedAt,
        text: `Bạn đã gửi hồ sơ (bản ${record.currentVersion.versionNo}).`,
        title: "Bạn đã gửi hồ sơ",
        detail: `Bản số ${record.currentVersion.versionNo}`,
        tone: "info",
      });
    }
    if (record.supplementRequest) {
      events.push({
        id: `supplement:${record.id}:${record.supplementRequest.requestedAt}`,
        at: record.supplementRequest.requestedAt,
        text: `Người xét duyệt yêu cầu bổ sung: ${record.supplementRequest.reason}`,
        title: "Người xét duyệt yêu cầu bổ sung",
        detail: `Lý do: ${record.supplementRequest.reason}`,
        tone: "attention",
      });
    }
    if (record.status === "APPROVED_FOR_HANDOVER" && record.updatedAt) {
      events.push({
        id: `approved:${record.id}`,
        at: record.updatedAt,
        text: "Hồ sơ đã được duyệt để bàn giao.",
        title: "Hồ sơ đã được duyệt",
        detail: "Hồ sơ đã được duyệt để bàn giao.",
        tone: "success",
      });
    }
    if (record.status === "REJECTED" && record.updatedAt) {
      events.push({
        id: `rejected:${record.id}`,
        at: record.updatedAt,
        text: "Hồ sơ không được chấp thuận.",
        title: "Hồ sơ không được chấp thuận",
        tone: "danger",
      });
    }
  }
  events.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());
  return current.concat(events);
}
