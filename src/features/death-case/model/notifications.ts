import type { ExecutorVault } from "./deathCase.schema";

/** Mức chú ý để giao diện tô màu: attention là việc cần bạn làm, success/danger là kết quả. */
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
  /** Dòng giải thích bên dưới; không có thì bỏ trống. */
  detail?: string;
  tone: NotificationTone;
}

/** Các mốc của biên bản bàn giao mà Người thực thi cần biết. */
export interface RecordMoments {
  id: string;
  status: string;
  revisionNo: number;
  requestedAt: string;
  finalizedAt: string | null;
  completedAt: string | null;
  canSign: boolean;
}

/**
 * Thông báo cho Người thực thi, chỉ lấy từ dữ liệu Backend đã trả (kho và biên bản bàn giao).
 * Tình trạng đang diễn ra nằm trên cùng, các sự kiện có mốc thời gian xếp mới nhất trước.
 */
export function deriveNotifications(
  vault: ExecutorVault,
  record: RecordMoments | null | undefined,
): ExecutorNotification[] {
  const current: ExecutorNotification[] = [];
  const events: ExecutorNotification[] = [];
  if (record && record.status === "SIGNING" && record.canSign) {
    current.push({
      id: `sign:${record.id}:${record.revisionNo}`,
      at: null,
      text: "Biên bản bàn giao đang chờ bạn ký.",
      title: "Đến lượt bạn ký biên bản",
      detail: "Mọi người nhận đã được xác nhận danh tính.",
      tone: "attention",
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
      at: record.requestedAt,
      text: "Người nhận đã gửi yêu cầu nhận tài sản. Luật sư đang xét giấy tờ.",
      title: "Có yêu cầu nhận tài sản",
      tone: "info",
    });
    if (record.finalizedAt) {
      events.push({
        id: `finalized:${record.id}:${record.revisionNo}`,
        at: record.finalizedAt,
        text: `Luật sư đã chốt biên bản (bản ${record.revisionNo}).`,
        title: "Luật sư đã chốt biên bản",
        detail: `Bản số ${record.revisionNo}`,
        tone: "info",
      });
    }
    if (record.completedAt) {
      events.push({
        id: `completed:${record.id}`,
        at: record.completedAt,
        text: "Biên bản đã đủ chữ ký ba bên. Hãy gửi mã nhận cho người nhận.",
        title: "Biên bản đã đủ chữ ký",
        detail: "Gửi mã nhận cho từng người ở mục Bàn giao.",
        tone: "success",
      });
    }
  }
  events.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());
  return current.concat(events);
}
