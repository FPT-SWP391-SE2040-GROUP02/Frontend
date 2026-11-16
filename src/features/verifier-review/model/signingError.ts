import { signingFailureText, type SigningFailure } from "@/shared/lib/signingFailure";

export { readSigningFailure, type SigningFailure } from "@/shared/lib/signingFailure";

/** Câu báo tiếng Việt cho lỗi xác nhận mật khẩu khi Duyệt/Từ chối (logic dùng chung nằm ở shared). */
export function signingFailureMessage(failure: SigningFailure): string {
  return signingFailureText(failure, "duyệt/từ chối");
}
