/**
 * Ba thông tin Người thực thi khai trên giấy chứng tử: ngày mất, ngày đăng ký khai tử và nơi đăng ký khai tử
 * (tỉnh/thành phố + phường/xã). Luật kiểm khớp Backend (DEATH-01) để báo lỗi ngay dưới ô; Backend vẫn kiểm lại khi lưu và khi nộp.
 */
export interface CertificateInfoValues {
  /** yyyy-MM-dd hoặc rỗng khi chưa chọn. */
  dateOfDeath: string;
  /** Ngày đăng ký khai tử, yyyy-MM-dd hoặc rỗng. */
  issuedOn: string;
  provinceCode: string;
  wardCode: string;
}

export type CertificateInfoField = keyof CertificateInfoValues;
export type CertificateInfoErrors = Partial<Record<CertificateInfoField, string>>;

/** Tên trường trong body PUT .../draft và trong lỗi 400 của Backend. */
export const CERTIFICATE_INFO_SERVER_FIELDS: Record<CertificateInfoField, string> = {
  dateOfDeath: "dateOfDeath",
  issuedOn: "issuedOn",
  provinceCode: "deathRegistrationProvinceCode",
  wardCode: "deathRegistrationWardCode",
};

export const EMPTY_CERTIFICATE_INFO: CertificateInfoValues = {
  dateOfDeath: "",
  issuedOn: "",
  provinceCode: "",
  wardCode: "",
};

/** Câu báo lỗi đúng chữ của Backend (DEATH-01). */
export const CERTIFICATE_INFO_MESSAGES = {
  deathAfterToday: "Ngày mất không được sau hôm nay.",
  issuedBeforeDeath: "Ngày đăng ký khai tử phải từ ngày mất trở đi.",
  issuedAfterToday: "Ngày đăng ký khai tử không được sau hôm nay.",
} as const;

/** Ngày dd/MM/yyyy từ yyyy-MM-dd bằng cách tách chuỗi (không lệch múi giờ). */
export function formatIsoDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Kiểm ba thông tin theo "hôm nay" của hệ thống (giờ Việt Nam, yyyy-MM-dd).
 * activatedDay: ngày Chủ kho kích hoạt kế hoạch nếu FE có dữ liệu này; không có thì chỉ để Backend kiểm luật đó.
 * Trường chưa nhập thì bỏ qua (việc thiếu do missingCertificateInfo báo).
 */
export function validateCertificateInfo(
  values: CertificateInfoValues,
  today: string,
  activatedDay?: string | null,
): CertificateInfoErrors {
  const errors: CertificateInfoErrors = {};
  if (values.dateOfDeath) {
    if (values.dateOfDeath > today) {
      errors.dateOfDeath = CERTIFICATE_INFO_MESSAGES.deathAfterToday;
    } else if (activatedDay && values.dateOfDeath < activatedDay) {
      errors.dateOfDeath = `Ngày mất phải sau ngày Chủ kho kích hoạt kế hoạch (${formatIsoDate(activatedDay)}).`;
    }
  }
  if (values.issuedOn) {
    if (values.issuedOn > today) {
      errors.issuedOn = CERTIFICATE_INFO_MESSAGES.issuedAfterToday;
    } else if (values.dateOfDeath && values.issuedOn < values.dateOfDeath) {
      errors.issuedOn = CERTIFICATE_INFO_MESSAGES.issuedBeforeDeath;
    }
  }
  return errors;
}

/** Thông tin còn thiếu, theo thứ tự hiển thị ở dòng nhắc "Còn thiếu: …". */
export function missingCertificateInfo(values: CertificateInfoValues): string[] {
  const missing: string[] = [];
  if (!values.dateOfDeath) missing.push("ngày mất");
  if (!values.issuedOn) missing.push("ngày đăng ký khai tử");
  if (!values.provinceCode || !values.wardCode) missing.push("nơi đăng ký khai tử");
  return missing;
}

/** Đổi chữ cái đầu thành chữ thường để đặt giữa câu: "Phường Bến Thành" → "phường Bến Thành". */
function lowerFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLocaleLowerCase("vi-VN") + text.slice(1);
}

/** Nơi đăng ký ghép giống Backend: "UBND phường Bến Thành, Thành phố Hồ Chí Minh"; thiếu tỉnh hoặc phường thì rỗng. */
export function buildRegistrationPlace(provinceName: string, wardName: string): string {
  if (!provinceName || !wardName) return "";
  return `UBND ${lowerFirst(wardName)}, ${provinceName}`;
}

/** Một đoạn của câu xem trước; filled = false là phần còn thiếu (hiện "……"). */
export interface PreviewSegment {
  text: string;
  filled: boolean;
  /** Đoạn nối cố định, không tô màu. */
  fixed?: boolean;
}

const PREVIEW_BLANK = "……";

/**
 * Câu sẽ được in vào biên bản của người nhận:
 * "Ông/bà {họ tên Chủ kho} chết ngày … theo giấy chứng tử do … đăng ký khai tử ngày …".
 */
export function previewSentence(
  ownerName: string,
  values: CertificateInfoValues,
  placeText: string,
): PreviewSegment[] {
  const death = formatIsoDate(values.dateOfDeath);
  const issued = formatIsoDate(values.issuedOn);
  return [
    { text: `Ông/bà ${ownerName} chết ngày `, filled: true, fixed: true },
    { text: death || PREVIEW_BLANK, filled: death.length > 0 },
    { text: " theo giấy chứng tử do ", filled: true, fixed: true },
    { text: placeText || PREVIEW_BLANK, filled: placeText.length > 0 },
    { text: " đăng ký khai tử ngày ", filled: true, fixed: true },
    { text: issued || PREVIEW_BLANK, filled: issued.length > 0 },
  ];
}
