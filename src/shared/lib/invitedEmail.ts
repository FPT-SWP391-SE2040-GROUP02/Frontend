const BULLET = "•";

/**
 * Cho biết email của tài khoản có khớp dạng che bớt mà Backend trả cho link mời hay không (ví dụ m•••••h@example.com:
 * giữ ký tự đầu và cuối của phần tên, che phần giữa đúng bằng số ký tự, giữ nguyên tên miền; phần tên chỉ 1–2 ký tự
 * thì còn ký tự đầu và dấu che). Chỉ để chọn màn hình sớm; Backend vẫn là nơi quyết định email có đúng hay không.
 */
export function emailMatchesMask(email: string, masked: string): boolean {
  const normalized = email.trim().toLowerCase();
  const emailAt = normalized.lastIndexOf("@");
  const maskAt = masked.lastIndexOf("@");
  if (emailAt <= 0 || maskAt <= 0) return false;
  if (normalized.slice(emailAt) !== masked.slice(maskAt).toLowerCase()) return false;

  const local = normalized.slice(0, emailAt);
  const maskedLocal = masked.slice(0, maskAt).toLowerCase();
  if (maskedLocal.endsWith(BULLET) && maskedLocal.length === 4) {
    // Phần tên rất ngắn: BE chỉ giữ ký tự đầu rồi thêm ba dấu che.
    return local.length <= 2 && local[0] === maskedLocal[0];
  }
  if (local.length !== maskedLocal.length || local.length < 3) return false;
  if (
    local[0] !== maskedLocal[0] ||
    local[local.length - 1] !== maskedLocal[maskedLocal.length - 1]
  ) {
    return false;
  }
  return maskedLocal.slice(1, -1) === BULLET.repeat(local.length - 2);
}
