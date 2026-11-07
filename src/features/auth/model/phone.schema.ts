import { z } from "zod";

/** Thông báo dùng chung khi số không phải di động Việt Nam; khớp PhoneRules ở Backend. */
export const VIETNAM_PHONE_MESSAGE =
  "Số điện thoại phải là số di động Việt Nam gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.";

/** Ghi chú dưới ô số điện thoại: số này được chia sẻ cho người nhận khi kế hoạch được kích hoạt. */
export const PHONE_SHARING_HINT =
  "Số điện thoại và email của bạn sẽ được gửi cho người nhận khi kế hoạch bàn giao mà bạn là Chủ kho hoặc Người thực thi được kích hoạt.";

/**
 * Chuẩn hóa số di động Việt Nam giống Backend: bỏ khoảng trắng, dấu chấm, gạch nối, ngoặc; đổi +84 hoặc 84 thành 0.
 * @param value Số người dùng nhập.
 * @returns Số 10 chữ số bắt đầu bằng 0, hoặc chuỗi đã bỏ ký tự phân cách nếu không đổi được đầu số.
 */
export function normalizeVietnamPhone(value: string): string {
  let digits = value.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+84")) {
    digits = `0${digits.slice(3)}`;
  } else if (digits.startsWith("84") && digits.length === 11) {
    digits = `0${digits.slice(2)}`;
  }
  return digits;
}

/** Số di động Việt Nam bắt buộc: 10 chữ số, đầu 03, 05, 07, 08 hoặc 09 (nhận cả +84). */
export const vietnamPhoneSchema = z
  .string()
  .trim()
  .min(1, "Số điện thoại là bắt buộc.")
  .transform(normalizeVietnamPhone)
  .refine((value) => /^0[35789]\d{8}$/.test(value), VIETNAM_PHONE_MESSAGE);
