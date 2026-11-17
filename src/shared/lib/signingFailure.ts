import { isAxiosError } from "axios";
import { z } from "zod";
import { HTTP_STATUS } from "@/shared/constants";
import { formatDateTime } from "@/shared/lib/dateFormat";

/**
 * Phần body lỗi xác nhận mật khẩu FE cần đọc (BE mục 6.12, DEATH-03, ký nhận vai Người thực thi): 403
 * SIGNING_PASSWORD_INVALID (+attemptsRemaining, không có khi tài khoản chưa có mật khẩu), 423 SIGNING_LOCKED
 * (+lockedUntil). `lockedUntil` để chuỗi, UI tự kiểm ngày hợp lệ.
 */
export const signingProblemSchema = z.object({
  code: z.string().optional(),
  attemptsRemaining: z.number().int().nonnegative().optional(),
  lockedUntil: z.string().optional(),
});

/** Lỗi xác nhận mật khẩu khi ký; xử lý trong feature, không qua bảng message chung. */
export type SigningFailure =
  | { kind: "invalidPassword"; attemptsRemaining: number }
  | { kind: "noPassword" }
  | { kind: "locked"; lockedUntil: number | null };

/** HTTP 423 Locked; HTTP_STATUS chung chưa có mã này. */
const LOCKED_STATUS = 423;

/** Đọc lỗi xác nhận mật khẩu từ response BE; lỗi khác trả null để UI giữ cách báo lỗi chung. */
export function readSigningFailure(error: unknown): SigningFailure | null {
  if (!isAxiosError<unknown>(error) || !error.response) return null;
  const parsed = signingProblemSchema.safeParse(error.response.data);
  if (!parsed.success) return null;
  const { code, attemptsRemaining, lockedUntil } = parsed.data;
  if (code === "SIGNING_PASSWORD_INVALID" && error.response.status === HTTP_STATUS.FORBIDDEN) {
    if (attemptsRemaining === undefined) {
      return { kind: "noPassword" };
    }
    return { kind: "invalidPassword", attemptsRemaining };
  }
  if (code === "SIGNING_LOCKED" && error.response.status === LOCKED_STATUS) {
    let until = Number.NaN;
    if (lockedUntil) {
      until = new Date(lockedUntil).getTime();
    }
    if (Number.isNaN(until)) {
      return { kind: "locked", lockedUntil: null };
    }
    return { kind: "locked", lockedUntil: until };
  }
  return null;
}

/**
 * Câu báo tiếng Việt cho lỗi xác nhận mật khẩu; giờ khóa theo múi giờ của trình duyệt (formatDateTime).
 * `lockedSubject` là chức năng đang bị khóa, ví dụ "duyệt" hoặc "ký nhận vai".
 */
export function signingFailureText(failure: SigningFailure, lockedSubject: string): string {
  if (failure.kind === "invalidPassword") {
    return `Mật khẩu chưa đúng. Còn ${failure.attemptsRemaining} lần thử trước khi bị tạm khóa.`;
  }
  if (failure.kind === "noPassword") {
    return "Tài khoản chưa có mật khẩu nên chưa xác nhận được. Vui lòng đặt mật khẩu trong cài đặt tài khoản.";
  }
  if (failure.lockedUntil === null) {
    return `Chức năng ${lockedSubject} đang tạm khóa. Vui lòng thử lại sau.`;
  }
  return `Chức năng ${lockedSubject} đang tạm khóa đến ${formatDateTime(failure.lockedUntil)}.`;
}
