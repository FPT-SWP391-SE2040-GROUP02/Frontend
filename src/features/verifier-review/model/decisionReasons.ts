/** Lý do dựng sẵn cho lựa chọn Từ chối của Người xét duyệt (nộp nhầm hoặc ghi sai thông tin). */
export interface ReasonOption {
  value: string;
  label: string;
  /** Phần hồ sơ Người thực thi phải làm lại, gửi kèm Backend (cùng mã với missingRequirements). */
  parts: readonly string[];
}

/** Ba thông tin Người thực thi khai trên giấy; ghi sai thì phải khai lại cả ba cho chắc. */
const DECLARED_FACT_PARTS = ["DATE_OF_DEATH", "ISSUED_ON", "DEATH_REGISTRATION_PLACE"] as const;

/**
 * "Từ chối": Người thực thi nộp nhầm hoặc ghi sai thông tin. Hồ sơ trả về Người thực thi kèm lý do để nộp lại
 * (Backend chưa có đóng hẳn hồ sơ, nên từ chối đi qua API yêu cầu bổ sung).
 */
export const REJECT_REASONS: readonly ReasonOption[] = [
  {
    value: "WRONG_FILE",
    label: "Nộp nhầm giấy, không phải giấy chứng tử của Chủ kho",
    parts: ["FILES"],
  },
  {
    value: "WRONG_INFO",
    label: "Ghi sai thông tin so với giấy (ngày mất, ngày đăng ký hoặc nơi đăng ký)",
    parts: DECLARED_FACT_PARTS,
  },
  { value: "UNREADABLE", label: "File mờ hoặc thiếu trang, không đọc được", parts: ["FILES"] },
  { value: "OTHER", label: "Lý do khác", parts: ["FILES"] },
];

/** Ghép lý do dựng sẵn và ghi chú thành một câu lý do gửi Backend (tối đa 1000 ký tự). */
export function composeReason(label: string, note: string): string {
  const trimmed = note.trim();
  const text = trimmed ? `${label}. ${trimmed}` : label;
  return text.slice(0, 1000);
}

/** Lý do tự điền khi duyệt: ba dòng Người thực thi khai đã được tích khớp với giấy. */
export const APPROVE_REASON =
  "Đã đối chiếu ngày mất, ngày đăng ký khai tử và nơi đăng ký khai tử với giấy chứng tử.";
