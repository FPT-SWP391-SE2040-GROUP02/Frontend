import type { Tone } from "@/shared/ui/heritageKit";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Dưới mốc này thì báo lời mời sắp hết hạn (nhãn đỏ, dòng cảnh báo). */
const EXPIRING_SOON_MS = DAY_MS;

export interface RemainingTime {
  /** "Còn 5 ngày", "Còn 14 giờ" hoặc "Đã hết hạn". */
  label: string;
  tone: Tone;
  expiringSoon: boolean;
}

/** Thời gian còn lại của lời mời; dưới một ngày thì đếm theo giờ (làm tròn lên). */
export function remainingTime(expiresAt: string, now: number = Date.now()): RemainingTime {
  const left = new Date(expiresAt).getTime() - now;
  if (left <= 0) {
    return { label: "Đã hết hạn", tone: "danger", expiringSoon: true };
  }
  if (left < EXPIRING_SOON_MS) {
    const hours = Math.max(1, Math.ceil(left / HOUR_MS));
    return { label: `Còn ${hours} giờ`, tone: "danger", expiringSoon: true };
  }
  const days = Math.ceil(left / DAY_MS);
  return { label: `Còn ${days} ngày`, tone: "warning", expiringSoon: false };
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,512}$/;

/**
 * Lấy mã lời mời từ link trong email (`.../executor-invitation#token=...` hoặc `?token=...`) hoặc từ mã dán
 * trực tiếp. Không hợp lệ thì trả null. Mã chỉ giữ trong RAM để chuyển sang trang trả lời lời mời.
 */
export function parseInvitationToken(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  let candidate = text;
  const marker = text.search(/[#?&]token=/);
  if (marker >= 0) {
    const start = text.indexOf("=", marker) + 1;
    const rest = text.slice(start);
    const end = rest.search(/[&#\s]/);
    candidate = end >= 0 ? rest.slice(0, end) : rest;
    try {
      candidate = decodeURIComponent(candidate);
    } catch {
      return null;
    }
  }
  // Bỏ dấu câu dính vào cuối khi copy từ email (giống trang nhận lời mời).
  candidate = candidate.replace(/[.,;:]+$/, "");
  if (!TOKEN_PATTERN.test(candidate)) return null;
  return candidate;
}

const STATUS_LABELS: Record<string, string> = {
  DECLINED: "Đã từ chối",
  EXPIRED: "Đã hết hạn",
  REVOKED: "Chủ kho đã thu hồi",
};

/** Nhãn trạng thái của lời mời đã kết thúc. */
export function endedStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
