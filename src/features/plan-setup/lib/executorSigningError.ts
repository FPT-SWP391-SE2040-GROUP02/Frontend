import { readSigningFailure, signingFailureText } from "@/shared/lib/signingFailure";

/**
 * Lỗi mật khẩu khi Người thực thi ký nhận vai: sai mật khẩu (kèm số lần còn lại), bị khóa (kèm giờ) hoặc để trống
 * (400 trên trường password). Lỗi khác trả null để UI giữ thông báo chung của usePrivateAction.
 */
export function executorSigningPasswordError(
  error: unknown,
  fieldErrors: Record<string, string[]>,
): string | null {
  const failure = readSigningFailure(error);
  if (failure !== null) {
    return signingFailureText(failure, "ký nhận vai");
  }
  const passwordErrors = fieldErrors.password;
  if (passwordErrors && passwordErrors.length > 0) {
    return "Vui lòng nhập mật khẩu tài khoản để ký nhận vai.";
  }
  return null;
}
