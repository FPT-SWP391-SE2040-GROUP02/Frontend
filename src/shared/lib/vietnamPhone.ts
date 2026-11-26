/** Lời báo khi số điện thoại sai định dạng; cùng ý với Backend (PhoneRules.InvalidFormatMessage). */
export const VIETNAM_PHONE_MESSAGE =
  "Số điện thoại không đúng định dạng (ví dụ 0912345678 hoặc +84912345678).";

/** Bỏ khoảng trắng, dấu chấm, gạch nối và ngoặc, giống Backend trước khi kiểm. */
export function stripPhoneSeparators(text: string): string {
  return text.replace(/[\s.\-()]/g, "");
}

/**
 * Số di động Việt Nam: bắt đầu bằng 0 hoặc +84, tiếp theo là đầu số 3, 5, 7, 8 hoặc 9 và 8 chữ số nữa. Cùng luật với
 * Backend (PhoneRules.IsVietnamesePhone).
 */
export function isVietnamesePhone(text: string): boolean {
  return /^(0|\+84)[35789]\d{8}$/.test(stripPhoneSeparators(text));
}
