import { isAxiosError } from "axios";
import { HTTP_STATUS } from "@/shared/constants";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { signingProblemSchema } from "./verifierReview.schema";

/** Lỗi xác nhận mật khẩu khi Duyệt/Từ chối (BE mục 6.12, DEATH-03); xử lý trong feature, không qua bảng message chung. */
export type SigningFailure =
  | { kind: "invalidPassword"; attemptsRemaining: number }
  | { kind: "noPassword" }
  | { kind: "locked"; lockedUntil: number | null };

/** HTTP 423 Locked; HTTP_STATUS chung chưa có mã này và feature không sửa shared. */
const LOCKED_STATUS = 423;

/** Đọc lỗi xác nhận mật khẩu từ response BE; lỗi khác trả null để UI giữ cách báo lỗi chung. */
export function readSigningFailure(error: unknown): SigningFailure | null {
  if (!isAxiosError<unknown>(error) || !error.response) return null;
  const parsed = signingProblemSchema.safeParse(error.response.data);
  if (!parsed.success) return null;
  const { code, attemptsRemaining, lockedUntil } = parsed.data;
  if (code === "SIGNING_PASSWORD_INVALID" && error.response.status === HTTP_STATUS.FORBIDDEN)
    return attemptsRemaining === undefined
      ? { kind: "noPassword" }
      : { kind: "invalidPassword", attemptsRemaining };
  if (code === "SIGNING_LOCKED" && error.response.status === LOCKED_STATUS) {
    const until = lockedUntil ? new Date(lockedUntil).getTime() : Number.NaN;
    return { kind: "locked", lockedUntil: Number.isNaN(until) ? null : until };
  }
  return null;
}

/** Câu báo tiếng Việt cho lỗi xác nhận mật khẩu; giờ khóa theo múi giờ của trình duyệt (formatDateTime). */
export function signingFailureMessage(failure: SigningFailure): string {
  if (failure.kind === "invalidPassword")
    return `Mật khẩu chưa đúng. Còn ${failure.attemptsRemaining} lần thử trước khi bị tạm khóa.`;
  if (failure.kind === "noPassword")
    return "Tài khoản chưa có mật khẩu nên chưa xác nhận được. Vui lòng đặt mật khẩu trong cài đặt tài khoản.";
  return failure.lockedUntil === null
    ? "Chức năng duyệt/từ chối đang tạm khóa. Vui lòng thử lại sau."
    : `Chức năng duyệt/từ chối đang tạm khóa đến ${formatDateTime(failure.lockedUntil)}.`;
}
