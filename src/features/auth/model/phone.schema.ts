import { z } from "zod";

/** Ghi chú dưới ô số điện thoại: số này được chia sẻ cho người nhận khi kế hoạch được kích hoạt. */
export const PHONE_SHARING_HINT =
  "Số điện thoại và email của bạn sẽ được gửi cho người nhận khi kế hoạch bàn giao mà bạn là Chủ kho hoặc Người thực thi được kích hoạt.";

/** Số điện thoại tối đa 20 ký tự, khớp giới hạn của Backend. */
export const PHONE_MAX_LENGTH = 20;

/**
 * Bỏ khoảng trắng, dấu chấm, gạch nối, ngoặc giống Backend (PhoneRules). Không kiểm đầu số hay độ dài tối thiểu.
 * @param value Số người dùng nhập.
 * @returns Chuỗi đã bỏ ký tự phân cách.
 */
export function normalizeContactPhone(value: string): string {
  return value.replace(/[\s.\-()]/g, "");
}

/** Số điện thoại bắt buộc nhưng không kiểm định dạng: gõ số nào cũng nhận (đồ án, demo dễ nhập). */
export const contactPhoneSchema = z
  .string()
  .trim()
  .min(1, "Số điện thoại là bắt buộc.")
  .transform(normalizeContactPhone)
  .pipe(
    z
      .string()
      .min(1, "Số điện thoại là bắt buộc.")
      .max(PHONE_MAX_LENGTH, "Số điện thoại tối đa 20 ký tự."),
  );
