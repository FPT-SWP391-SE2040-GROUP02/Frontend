/**
 * Luật kiểm giá trị các tham số ở trang Cấu hình, khớp với SystemSettingRules của Backend (Backend vẫn là nơi quyết định
 * cuối cùng). Kiểm ngay ở máy để Admin thấy lỗi trước khi bấm lưu. Khóa Plans.* có bộ kiểm riêng ở màn Gói dịch vụ.
 */

interface IntegerLimit {
  min: number;
  max: number;
}

export const SETTING_LIMITS: Record<string, IntegerLimit> = {
  "CheckIn.DefaultCycleDays": { min: 7, max: 365 },
  "CheckIn.FirstReminderDaysBeforeDue": { min: 2, max: 60 },
  "CheckIn.SecondReminderDaysBeforeDue": { min: 1, max: 30 },
  "CheckIn.LateReminderGapDays": { min: 1, max: 30 },
  "CheckIn.MaxLateReminders": { min: 1, max: 5 },
  "CheckIn.ExecutorProxyLimit": { min: 1, max: 20 },
  "Handover.ResponseWindowDays": { min: 1, max: 60 },
  "Handover.DecisionWindowDays": { min: 1, max: 60 },
  "Handover.GrantWindowDays": { min: 1, max: 365 },
  "Handover.RetentionWindowDays": { min: 1, max: 730 },
  "Handover.ResendCooldownMinutes": { min: 1, max: 1440 },
  "Executor.InvitationExpiresDays": { min: 1, max: 60 },
  "Executor.ReminderAfterHours": { min: 1, max: 1440 },
  "DeathCase.SupplementDueDays": { min: 1, max: 60 },
  "DeathCase.MaxFilesPerVersion": { min: 1, max: 50 },
  "DeathCase.MaxFileSizeMb": { min: 1, max: 200 },
  "DeathCase.ReviewDueHours": { min: 1, max: 720 },
  "Incident.ReminderAfterHours": { min: 1, max: 720 },
  "Incident.EscalateAfterHours": { min: 1, max: 720 },
  "Incident.MaxReviewIntervalDays": { min: 1, max: 60 },
  "Limits.MaxUploadsPerHour": { min: 1, max: 10000 },
  "Limits.MaxAssetsPerVault": { min: 1, max: 100000 },
  "Limits.MaxUploadBytesMb": { min: 1, max: 2048 },
  "Limits.ReservationHoldMinutes": { min: 1, max: 1440 },
  "Security.MaxPinAttempts": { min: 1, max: 20 },
  "Security.PinLockoutMinutes": { min: 1, max: 1440 },
};

interface TextLimit {
  maxLength: number;
  isEmail: boolean;
  isPhone?: boolean;
}

const TEXT_LIMITS: Record<string, TextLimit> = {
  "Company.Name": { maxLength: 100, isEmail: false },
  "Company.Website": { maxLength: 200, isEmail: false },
  "Company.Email": { maxLength: 200, isEmail: true },
  "Company.Phone": { maxLength: 50, isEmail: false, isPhone: true },
  "Company.Address": { maxLength: 300, isEmail: false },
};

const FIRST_REMINDER = "CheckIn.FirstReminderDaysBeforeDue";
const SECOND_REMINDER = "CheckIn.SecondReminderDaysBeforeDue";
const INCIDENT_REMINDER = "Incident.ReminderAfterHours";
const INCIDENT_ESCALATE = "Incident.EscalateAfterHours";
const EXECUTOR_EXPIRES = "Executor.InvitationExpiresDays";
const EXECUTOR_REMINDER = "Executor.ReminderAfterHours";

/** Giá trị mặc định của các khóa nằm trong cặp phải đi cùng nhau, dùng khi chưa có giá trị. */
const RELATION_DEFAULTS: Record<string, number> = {
  [FIRST_REMINDER]: 7,
  [SECOND_REMINDER]: 1,
  [INCIDENT_REMINDER]: 48,
  [INCIDENT_ESCALATE]: 72,
  [EXECUTOR_EXPIRES]: 7,
  [EXECUTOR_REMINDER]: 48,
};

/** Độ dài tối đa của tham số chữ; khóa không có luật thì dùng fallback. */
export function textMaxLengthOf(key: string, fallback: number): number {
  if (Object.hasOwn(TEXT_LIMITS, key)) {
    return TEXT_LIMITS[key].maxLength;
  }
  return fallback;
}

/** Khoảng cho phép của một tham số số nguyên; khóa không có luật thì null. */
export function limitOf(key: string): IntegerLimit | null {
  if (Object.hasOwn(SETTING_LIMITS, key)) {
    return SETTING_LIMITS[key];
  }
  return null;
}

/** Số điện thoại hoặc tổng đài; cùng luật với Backend (SystemSettingRules.IsValidPhone). */
export function isValidPhone(text: string): boolean {
  if (!/^[0-9+(]/.test(text)) return false;
  if (!/^\+?[0-9 .\-()]+$/.test(text)) return false;
  const digits = text.replace(/\D/g, "").length;
  return digits >= 8 && digits <= 15;
}

/** Lỗi của một giá trị đơn lẻ (câu tiếng Việt ngắn) hoặc chuỗi rỗng khi hợp lệ. */
export function settingValueError(key: string, value: string): string {
  const text = value.trim();
  const limit = limitOf(key);
  if (limit !== null) {
    if (!/^\d+$/.test(text)) {
      return "Phải là số nguyên không âm.";
    }
    const number = Number(text);
    if (number < limit.min || number > limit.max) {
      return `Phải từ ${limit.min} đến ${limit.max}.`;
    }
    return "";
  }
  if (Object.hasOwn(TEXT_LIMITS, key)) {
    const textLimit = TEXT_LIMITS[key];
    if (text.length > textLimit.maxLength) {
      return `Tối đa ${textLimit.maxLength} ký tự.`;
    }
    if (textLimit.isEmail && text.length > 0 && (!text.includes("@") || text.includes(" "))) {
      return "Không đúng dạng email.";
    }
    if (textLimit.isPhone && text.length > 0 && !isValidPhone(text)) {
      return "Số điện thoại không hợp lệ: chỉ gồm số, dấu cách, dấu chấm, gạch ngang, ngoặc, có thể bắt đầu bằng + hoặc (, từ 8 đến 15 chữ số.";
    }
  }
  return "";
}

function numberOf(valueOf: (key: string) => string | undefined, key: string): number {
  const raw = valueOf(key);
  if (raw !== undefined && /^\d+$/.test(raw.trim())) {
    return Number(raw.trim());
  }
  return RELATION_DEFAULTS[key];
}

/**
 * Lỗi của các cặp tham số phải đi cùng nhau, gắn vào khóa cần sửa (khóa → câu lỗi). `valueOf` trả giá trị đang chọn
 * (đã gồm phần Admin vừa sửa) hoặc undefined nếu chưa có.
 */
export function settingRelationErrors(
  valueOf: (key: string) => string | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const first = numberOf(valueOf, FIRST_REMINDER);
  const second = numberOf(valueOf, SECOND_REMINDER);
  if (first <= second) {
    errors[FIRST_REMINDER] = "Phải xa hạn hơn thư thứ hai (số ngày lớn hơn).";
    errors[SECOND_REMINDER] = "Phải gần hạn hơn thư thứ nhất (số ngày nhỏ hơn).";
  }
  const reminder = numberOf(valueOf, INCIDENT_REMINDER);
  const escalate = numberOf(valueOf, INCIDENT_ESCALATE);
  if (escalate <= reminder) {
    errors[INCIDENT_ESCALATE] = "Phải sau giờ nhắc người phụ trách.";
  }
  const expiresDays = numberOf(valueOf, EXECUTOR_EXPIRES);
  const remindHours = numberOf(valueOf, EXECUTOR_REMINDER);
  if (remindHours >= expiresDays * 24) {
    errors[EXECUTOR_REMINDER] = `Phải sớm hơn hạn lời mời (${expiresDays * 24} giờ).`;
  }
  return errors;
}

/**
 * Mọi lỗi của các tham số Admin đang sửa (draft): lỗi giá trị trước, rồi lỗi theo cặp cho khóa chưa có lỗi riêng.
 * Lỗi theo cặp chỉ tính khi Admin vừa sửa (hoặc tắt) một khóa thuộc cặp đó.
 */
export function settingErrors(
  changed: Record<string, string | null>,
  valueOf: (key: string) => string | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(changed)) {
    // null = tham số đang bị tắt: hệ thống dùng mức gốc nên giá trị gõ vào không cần kiểm.
    if (value === null) {
      continue;
    }
    const message = settingValueError(key, value);
    if (message !== "") {
      errors[key] = message;
    }
  }
  const relationKeys = Object.keys(RELATION_DEFAULTS);
  let touchesRelation = false;
  for (const key of relationKeys) {
    if (Object.hasOwn(changed, key)) {
      touchesRelation = true;
    }
  }
  if (touchesRelation) {
    const relation = settingRelationErrors(valueOf);
    for (const [key, message] of Object.entries(relation)) {
      if (!Object.hasOwn(errors, key)) {
        errors[key] = message;
      }
    }
  }
  return errors;
}
