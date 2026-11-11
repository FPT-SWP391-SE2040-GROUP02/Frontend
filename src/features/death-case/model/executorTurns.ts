import type { HandoverProgressTurn } from "./handoverProgress.schema";

/**
 * Cách đọc một lượt bàn giao (một gói cho một người nhận) trên trang Bàn giao của Người thực thi.
 * Mọi hàm ở đây là hàm thuần: chỉ dựa vào dữ liệu Backend trả, không đọc đồng hồ trình duyệt và không có hạn chót.
 */

/** Nhóm của một lượt, theo thứ tự xếp trong bảng: cần bạn làm → đang chờ người nhận → xong → từ chối → kết thúc khác. */
export type TurnGroup = "action" | "waiting" | "done" | "declined" | "ended";

/** Màu của một đoạn trên thanh: xanh đậm (xong), vàng (đang chờ), xám nhạt (chưa tới), xám đậm (dừng, từ chối). */
export type SegmentState = "done" | "current" | "pending" | "stopped";

export type TurnTone = "success" | "warning" | "neutral";

export type TurnStepKey = "invited" | "agreed" | "approved" | "key" | "received";

export interface TurnSegment {
  key: TurnStepKey;
  label: string;
  state: SegmentState;
  /** "HH:mm dd/MM" khi xong, "đang chờ" khi đang chờ, "—" khi chưa tới. */
  timeText: string;
}

export interface TurnProgress {
  group: TurnGroup;
  /** Luôn đủ 5 đoạn; lượt từ chối hoặc kết thúc dừng ở đoạn thứ hai. */
  segments: TurnSegment[];
  /** Các cột của hàng giờ trong phần chi tiết: 5 cột, hoặc 2 cột (Đã mời, Từ chối nhận) với lượt từ chối. */
  detailColumns: TurnSegment[];
  /** Nhãn ngắn trên chip của gói, ví dụ "Chờ nhập mã". */
  chip: string;
  /** Chữ đậm có màu dưới thanh, ví dụ "Chờ nhập mã mở gói". */
  headline: string;
  /** Chữ phụ cạnh chữ đậm, ví dụ "bạn cần đưa mã cho người này". */
  detail: string;
  tone: TurnTone;
  /** Người thực thi cần làm gì đó cho dòng này (hiện chỉ là đưa mã mở gói). */
  needsAction: boolean;
}

export const STEP_LABELS: Record<TurnStepKey, string> = {
  invited: "Đã mời",
  agreed: "Đồng ý nhận",
  approved: "Người xét duyệt duyệt",
  key: "Nhập mã mở gói",
  received: "Tải xong",
};

const STEP_ORDER: TurnStepKey[] = ["invited", "agreed", "approved", "key", "received"];

const GROUP_ORDER: Record<TurnGroup, number> = {
  action: 0,
  waiting: 1,
  done: 2,
  declined: 3,
  ended: 4,
};

const stepTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "HH:mm dd/MM" theo giờ Việt Nam; ghép từ từng phần để không phụ thuộc dấu ngăn cách của từng locale. */
export function formatStepTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts: Record<string, string> = {};
  for (const part of stepTimeFormatter.formatToParts(date)) {
    parts[part.type] = part.value;
  }
  let hour = parts.hour;
  if (hour === "24") hour = "00";
  return `${hour}:${parts.minute} ${parts.day}/${parts.month}`;
}

function isWaitingForInvitationReply(turn: HandoverProgressTurn): boolean {
  return turn.status === "INVITED" || turn.status === "INITIAL_RESPONSE_EXPIRED";
}

/** Lần tải gần nhất của các tài sản trong lượt; null khi chưa tải gì. */
function lastDownloadAt(turn: HandoverProgressTurn): string | null {
  let latest: string | null = null;
  for (const item of turn.items) {
    if (!item.firstDownloadedAt) continue;
    if (latest === null || new Date(item.firstDownloadedAt) > new Date(latest)) {
      latest = item.firstDownloadedAt;
    }
  }
  return latest;
}

function downloadText(turn: HandoverProgressTurn): string {
  return `tải ${turn.downloadedItems}/${turn.totalItems} tài sản`;
}

/** Vị trí bước đầu tiên chưa xong; -1 khi cả 5 bước đã xong. */
function firstOpenIndex(doneAt: Array<string | null | false>): number {
  for (let index = 0; index < doneAt.length; index += 1) {
    if (doneAt[index] === false) return index;
  }
  return -1;
}

/** doneAt[i]: false = chưa xong; null = xong nhưng không có giờ; chuỗi = xong lúc đó. */
function buildSegments(doneAt: Array<string | null | false>): TurnSegment[] {
  const firstOpen = firstOpenIndex(doneAt);
  const segments: TurnSegment[] = [];
  for (let index = 0; index < STEP_ORDER.length; index += 1) {
    const key = STEP_ORDER[index];
    const value = doneAt[index];
    let state: SegmentState = "pending";
    let timeText = "—";
    if (value !== false) {
      state = "done";
      timeText = formatStepTime(value);
    } else if (index === firstOpen) {
      state = "current";
      timeText = "đang chờ";
    }
    segments.push({ key, label: STEP_LABELS[key], state, timeText });
  }
  return segments;
}

/** Chữ và nhóm cho lượt đã kết thúc không nhận (từ chối, quá hạn quyết định, hủy, dọn dữ liệu). */
function stoppedProgress(turn: HandoverProgressTurn): TurnProgress {
  const segments = buildSegments([
    turn.invitationSentAt ?? turn.invitedAt,
    false,
    false,
    false,
    false,
  ]);
  // Đoạn thứ hai là nơi lượt dừng: xám đậm; các đoạn sau vẫn xám nhạt.
  segments[1] = { ...segments[1], state: "stopped", timeText: "—" };
  let stopTime: string | null = turn.decidedAt ?? turn.documentApprovedAt ?? turn.recipientSignedAt;
  let stopLabel = "Từ chối nhận";
  let chip = "Từ chối nhận";
  let headline = "Đã từ chối nhận";
  let detail = "người nhận từ chối nhận tài sản";
  let group: TurnGroup = "declined";
  if (turn.status === "DECLINED") {
    if (turn.documentApprovedAt) detail = "văn bản từ chối đã duyệt";
  } else {
    group = "ended";
    stopLabel = "Đã kết thúc";
    chip = "Đã kết thúc";
    headline = "Lượt đã kết thúc";
    stopTime = null;
    if (turn.status === "DECISION_EXPIRED") detail = "người nhận không hoàn tất việc nhận";
    if (turn.status === "CANCELLED") detail = "lượt đã bị hủy";
    if (turn.status === "LAPSED") detail = "dữ liệu của lượt đã được dọn";
  }
  const stopped: TurnSegment = {
    ...segments[1],
    label: stopLabel,
    timeText: formatStepTime(stopTime),
  };
  return {
    group,
    segments,
    detailColumns: [segments[0], stopped],
    chip,
    headline,
    detail,
    tone: "neutral",
    needsAction: false,
  };
}

/**
 * Bước hiện tại, 5 đoạn và giờ từng bước của một lượt.
 *
 * Năm bước: Đã mời → Đồng ý nhận → Người xét duyệt duyệt biên bản → Nhập mã mở gói → Tải xong.
 * - Đã mời: xong khi máy chủ email nhận thư mời (invitationSentAt) hoặc khi lượt đã đi xa hơn.
 * - Đồng ý nhận: xong khi người nhận ký biên bản (recipientSignedAt) hoặc lượt đã được duyệt.
 * - Người xét duyệt duyệt: xong khi Người xét duyệt ký (documentApprovedAt) hoặc lượt đã HANDOVER_COMMITTED.
 * - Nhập mã mở gói: xong khi keyVerifiedAt có giờ. Kho không dùng mã thì không có giờ này, nên đã tải được tài sản
 *   (hoặc người nhận đã xác nhận nhận đủ) cũng coi là qua bước, giờ hiện "—".
 * - Tải xong: xong khi tải đủ tài sản hoặc người nhận đã xác nhận nhận đủ (receivedAllAt).
 */
export function deriveTurnProgress(turn: HandoverProgressTurn): TurnProgress {
  if (
    turn.status === "DECLINED" ||
    turn.status === "DECISION_EXPIRED" ||
    turn.status === "CANCELLED" ||
    turn.status === "LAPSED"
  ) {
    return stoppedProgress(turn);
  }

  const committed = turn.status === "HANDOVER_COMMITTED";
  const waitingReply = isWaitingForInvitationReply(turn);

  let invitedDone: string | null | false = false;
  if (turn.invitationSentAt) {
    invitedDone = turn.invitationSentAt;
  } else if (!waitingReply) {
    // Người nhận đã đi tiếp thì lời mời chắc chắn đã tới tay, dù Backend không ghi giờ gửi.
    invitedDone = turn.invitedAt;
  }

  let agreedDone: string | null | false = false;
  if (turn.recipientSignedAt) {
    agreedDone = turn.recipientSignedAt;
  } else if (committed) {
    agreedDone = turn.decidedAt;
  }

  let approvedDone: string | null | false = false;
  if (turn.documentApprovedAt) {
    approvedDone = turn.documentApprovedAt;
  } else if (committed) {
    approvedDone = turn.decidedAt;
  }

  const receivedAt = turn.receivedAllAt ?? lastDownloadAt(turn);
  const allDownloaded = turn.totalItems > 0 && turn.downloadedItems >= turn.totalItems;
  const receivedDone = committed && (allDownloaded || turn.receivedAllAt !== null);

  let keyDone: string | null | false = false;
  if (turn.keyVerifiedAt) {
    keyDone = turn.keyVerifiedAt;
  } else if (committed && (turn.downloadedItems > 0 || turn.receivedAllAt !== null)) {
    keyDone = null;
  }

  let receivedValue: string | null | false = false;
  if (receivedDone) receivedValue = receivedAt;

  const doneAt: Array<string | null | false> = [
    invitedDone,
    agreedDone,
    approvedDone,
    keyDone,
    receivedValue,
  ];
  // Một bước chưa xong thì các bước sau cũng chưa tới, dù Backend có giờ lẻ (dữ liệu cũ).
  const firstOpen = firstOpenIndex(doneAt);
  if (firstOpen >= 0) {
    for (let index = firstOpen + 1; index < doneAt.length; index += 1) {
      doneAt[index] = false;
    }
  }
  const segments = buildSegments(doneAt);

  let group: TurnGroup = "waiting";
  let tone: TurnTone = "warning";
  let needsAction = false;
  let headline: string;
  let detail: string;
  let chip: string;
  if (firstOpen === -1) {
    group = "done";
    tone = "success";
    chip = "Đã nhận xong";
    headline = "Đã nhận xong";
    detail = `${downloadText(turn)} ${formatStepTime(receivedAt)}`;
    if (turn.totalItems === 0) detail = formatStepTime(receivedAt);
  } else if (firstOpen === 0) {
    chip = "Chưa gửi lời mời";
    headline = "Chưa gửi lời mời";
    detail = "hệ thống chưa gửi được, sẽ tự thử lại";
  } else if (firstOpen === 1) {
    chip = "Chờ trả lời";
    if (waitingReply) {
      headline = "Chờ người nhận trả lời";
      detail = `đã mời ${formatStepTime(turn.invitationSentAt ?? turn.invitedAt)}`;
    } else {
      headline = "Chờ người nhận đồng ý";
      detail = "người nhận đang làm biên bản";
    }
  } else if (firstOpen === 2) {
    chip = "Chờ duyệt biên bản";
    headline = "Chờ Người xét duyệt duyệt biên bản";
    detail = `người nhận đã ký ${formatStepTime(turn.recipientSignedAt)}`;
  } else if (firstOpen === 3) {
    group = "action";
    needsAction = true;
    chip = "Chờ nhập mã";
    headline = "Chờ nhập mã mở gói";
    detail = "bạn cần đưa mã cho người này";
  } else {
    chip = "Đang tải";
    headline = "Chờ người nhận tải tài sản";
    detail = downloadText(turn);
  }

  return {
    group,
    segments,
    detailColumns: segments,
    chip,
    headline,
    detail,
    tone,
    needsAction,
  };
}

export interface TurnRow {
  turn: HandoverProgressTurn;
  progress: TurnProgress;
}

/** Xếp dòng: cần bạn làm → đang chờ người nhận → đã nhận xong → từ chối; cùng nhóm giữ thứ tự Backend trả. */
export function sortTurnRows(turns: HandoverProgressTurn[]): TurnRow[] {
  const rows: TurnRow[] = turns.map((turn) => ({ turn, progress: deriveTurnProgress(turn) }));
  const indexed = rows.map((row, index) => ({ row, index }));
  indexed.sort((left, right) => {
    const byGroup = GROUP_ORDER[left.row.progress.group] - GROUP_ORDER[right.row.progress.group];
    if (byGroup !== 0) return byGroup;
    return left.index - right.index;
  });
  return indexed.map((entry) => entry.row);
}

export interface TurnCounts {
  total: number;
  done: number;
  action: number;
  waiting: number;
  declined: number;
  ended: number;
}

/** Số dòng theo nhóm cho 4 ô số trên đầu trang Bàn giao. */
export function countTurns(turns: HandoverProgressTurn[]): TurnCounts {
  const counts: TurnCounts = { total: 0, done: 0, action: 0, waiting: 0, declined: 0, ended: 0 };
  for (const turn of turns) {
    const group = deriveTurnProgress(turn).group;
    counts.total += 1;
    counts[group] += 1;
  }
  return counts;
}
