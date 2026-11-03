import { z } from "zod";
import type { SystemConfigEntry } from "./systemConfig.schema";

/** Loại ô nhập của một trường cấu hình: chữ, số nguyên, hoặc khóa bí mật (chỉ ghi, không bao giờ hiện lại). */
export type ConfigFieldKind = "text" | "number" | "secret" | "url" | "select";

export interface ConfigFieldSpec {
  name: string;
  label: string;
  kind: ConfigFieldKind;
  hint?: string;
  min?: number;
  max?: number;
  /** Ô chữ không bắt buộc: để trống là hợp lệ. */
  optional?: boolean;
  /** Các lựa chọn của ô `select`: giá trị gửi lên và nhãn hiển thị. */
  options?: { value: string; label: string }[];
  /** Luật hình dạng cho ô chữ; Backend vẫn là nơi quyết định cuối cùng. */
  pattern?: RegExp;
  patternMessage?: string;
}

export interface ServiceContent {
  title: string;
  description: string;
  fields: ConfigFieldSpec[];
  /** Backend có bộ thử kết nối cho dịch vụ này không; không có thì ẩn nút "Thử kết nối". */
  canTest: boolean;
  /**
   * Thay đổi từ `before` sang `after` (các trường thường) có cần gõ lại tên dịch vụ để xác nhận không.
   * Khớp với SystemConfigCatalog.RequiresConfirm của Backend, nơi quyết định cuối cùng.
   */
  confirm?: (before: Record<string, string>, after: Record<string, string>) => boolean;
}

/** Nội dung từng dịch vụ đã nối. Dịch vụ Backend trả về mà chưa có ở đây thì trang không hiện thẻ. */
export const SYSTEM_CONFIG_SERVICES: Record<string, ServiceContent> = {
  GEMINI: {
    title: "Gemini (AI nhận diện giấy chứng tử)",
    description:
      "Dùng khi người thực hiện gửi hồ sơ chứng tử. Khi Gemini lỗi, hồ sơ vẫn gửi được và người xét duyệt tự xem giấy.",
    fields: [
      {
        name: "model",
        label: "Tên model",
        kind: "text",
        hint: "Ví dụ gemini-flash-lite-latest. Chỉ gồm chữ, số, dấu chấm, gạch ngang và gạch dưới.",
        pattern: /^[A-Za-z0-9._-]{1,100}$/,
        patternMessage: "Chỉ gồm chữ, số, dấu chấm, gạch ngang và gạch dưới (tối đa 100 ký tự).",
      },
      { name: "timeoutSeconds", label: "Thời gian chờ (giây)", kind: "number", min: 5, max: 60 },
      { name: "apiKey", label: "Khóa API", kind: "secret" },
    ],
    canTest: true,
  },
  SMTP: {
    title: "Email (gửi thư hệ thống)",
    description:
      "Thư xác minh, mời người thực hiện, nhắc điểm danh và thông báo hồ sơ đều đi qua đây. Ô dự phòng thường chỉ cần địa chỉ Webhook (Google Apps Script) để gửi qua cổng 443 khi cổng SMTP bị chặn.",
    fields: [
      { name: "host", label: "Máy chủ SMTP", kind: "text", hint: "Ví dụ smtp.gmail.com." },
      {
        name: "port",
        label: "Cổng",
        kind: "number",
        min: 1,
        max: 65535,
        hint: "587 (StartTLS) hoặc 465 (SSL).",
      },
      {
        name: "secureSocket",
        label: "Kiểu mã hóa kết nối",
        kind: "select",
        options: [
          { value: "StartTls", label: "StartTLS (thường dùng cổng 587)" },
          { value: "SslOnConnect", label: "SSL ngay khi kết nối (thường dùng cổng 465)" },
          { value: "StartTlsWhenAvailable", label: "StartTLS nếu máy chủ hỗ trợ" },
          { value: "Auto", label: "Tự động" },
          { value: "None", label: "Không mã hóa" },
        ],
      },
      { name: "userName", label: "Tài khoản đăng nhập", kind: "text", optional: true },
      { name: "fromAddress", label: "Địa chỉ người gửi", kind: "text", optional: true, max: 256 },
      { name: "fromName", label: "Tên người gửi", kind: "text", optional: true },
      { name: "timeoutSeconds", label: "Thời gian chờ (giây)", kind: "number", min: 5, max: 120 },
      {
        name: "webhookUrl",
        label: "Địa chỉ Webhook (không bắt buộc)",
        kind: "url",
        optional: true,
        hint: "Có địa chỉ này thì thư gửi qua Webhook thay vì SMTP.",
      },
      {
        name: "password",
        label: "Mật khẩu",
        kind: "secret",
        hint: "Với Gmail dùng Mật khẩu ứng dụng (16 ký tự), không dùng mật khẩu tài khoản.",
      },
    ],
    canTest: true,
  },
  SEPAY: {
    title: "SePay (nhận tiền thanh toán)",
    description:
      "Tài khoản nhận tiền hiện QR cho chủ kho và khóa để SePay báo giao dịch về. Đổi sai có thể làm đơn không đối soát được.",
    fields: [
      {
        name: "environment",
        label: "Môi trường",
        kind: "select",
        options: [
          { value: "Test", label: "Thử nghiệm (Test)" },
          { value: "Live", label: "Thật (Live)" },
        ],
        hint: "Chuyển sang Thật nghĩa là bắt đầu nhận tiền thật.",
      },
      {
        name: "bankCode",
        label: "Mã ngân hàng",
        kind: "text",
        optional: true,
        hint: "Ví dụ MBBank (theo SePay/VietQR).",
      },
      { name: "accountNumber", label: "Số tài khoản nhận tiền", kind: "text", optional: true },
      { name: "accountName", label: "Tên chủ tài khoản", kind: "text", optional: true },
      {
        name: "webhookApiKey",
        label: "Khóa webhook SePay",
        kind: "secret",
        hint: "Khóa SePay gửi trong header Authorization. Đổi khóa ở đây thì phải đổi cùng khóa trong SePay, nếu không giao dịch sẽ bị từ chối.",
      },
    ],
    canTest: false,
    confirm: (before, after) => after.environment === "Live" && before.environment !== "Live",
  },
  EKYC: {
    title: "eKYC (xác minh danh tính)",
    description:
      "Dịch vụ đọc giấy tờ, chống giả mạo và so khớp khuôn mặt của chủ kho. Khi dịch vụ không trả lời, các bước eKYC tạm báo không khả dụng.",
    fields: [
      {
        name: "baseUrl",
        label: "Địa chỉ dịch vụ",
        kind: "url",
        hint: "Ví dụ http://127.0.0.1:8879. Phải bắt đầu bằng http hoặc https, không kèm tên đăng nhập.",
      },
      {
        name: "timeoutSeconds",
        label: "Thời gian chờ (giây)",
        kind: "number",
        min: 5,
        max: 300,
        hint: "Đọc giấy tờ chạy bằng CPU nên có thể chậm; mặc định 60 giây.",
      },
      {
        name: "apiKey",
        label: "Khóa dùng chung (X-Ekyc-Key)",
        kind: "secret",
        hint: "Không bắt buộc. Dịch vụ eKYC phải kiểm tra khóa này nếu mở ra ngoài máy chủ.",
      },
    ],
    canTest: true,
  },
};

export const SLOT_LABELS = { PRIMARY: "Cấu hình chính", FALLBACK: "Dịch vụ dự phòng" } as const;

export const SOURCE_LABELS = {
  DATABASE: "Đã lưu trên trang này",
  APPSETTINGS: "Cấu hình mặc định của máy chủ",
} as const;

export const SYSTEM_CONFIG_NOTICE =
  "Thay đổi có hiệu lực ngay cho các lần gọi sau và được ghi vào nhật ký hoạt động. Khóa API chỉ ghi vào, không bao giờ hiện lại.";

export const SECRET_PLACEHOLDER = "Để trống để giữ khóa hiện tại";

export const SYSTEM_CONFIG_SAVED = "Đã lưu cấu hình.";
export const SYSTEM_CONFIG_RESET_DONE = "Đã khôi phục về cấu hình mặc định của máy chủ.";

export type ChipTone = "success" | "warning" | "neutral";

/**
 * Nhãn trạng thái của thẻ dịch vụ, theo lần gọi gần nhất kể từ lúc máy chủ khởi động và nguồn của ô chính.
 * Lỗi và dự phòng được báo trước vì Admin cần thấy ngay.
 */
export function statusChip(service: SystemConfigEntry): { tone: ChipTone; text: string } {
  if (service.status.activeSlot === "FALLBACK") {
    return { tone: "warning", text: "Đang dùng dịch vụ dự phòng" };
  }
  if (service.status.lastOutcome === "FAILED") {
    return { tone: "warning", text: "Lỗi ở lần gọi gần nhất" };
  }
  const primary = service.slots.find((slot) => slot.slot === "PRIMARY");
  if (primary?.source === "APPSETTINGS") {
    return { tone: "neutral", text: "Đang dùng cấu hình mặc định của máy chủ" };
  }
  return { tone: "success", text: "Đang dùng cấu hình chính" };
}

/** Luật kiểm tra form sửa cấu hình, dựng từ danh sách trường của dịch vụ; thêm lý do và công tắc bật. */
export function buildConfigFormSchema(fields: ConfigFieldSpec[]) {
  const shape: Record<string, z.ZodTypeAny> = {
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập lý do thay đổi.")
      .max(500, "Lý do tối đa 500 ký tự."),
    enabled: z.boolean(),
  };
  for (const field of fields) {
    shape[field.name] = fieldSchema(field);
  }
  return z.object(shape);
}

/** Địa chỉ http/https hợp lệ, không kèm tên đăng nhập (khớp luật của Backend). */
function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const httpScheme = url.protocol === "http:" || url.protocol === "https:";
    return httpScheme && url.username === "" && url.password === "" && url.hostname !== "";
  } catch {
    return false;
  }
}

function fieldSchema(field: ConfigFieldSpec): z.ZodTypeAny {
  if (field.kind === "secret") return z.string().max(512, "Tối đa 512 ký tự.");
  if (field.kind === "select") {
    const allowed = (field.options ?? []).map((option) => option.value);
    return z.string().refine((value) => allowed.includes(value), "Chọn một giá trị hợp lệ.");
  }
  // Ô chữ không bắt buộc (ví dụ tài khoản ngân hàng) được để trống.
  if (field.kind === "text" && field.optional) {
    const limit = field.max ?? 100;
    return z.string().trim().max(limit, `Tối đa ${limit} ký tự.`);
  }
  if (field.kind === "url" && field.optional) {
    return z
      .string()
      .trim()
      .max(2048, "Tối đa 2048 ký tự.")
      .refine(
        (value) => value === "" || isHttpUrl(value),
        "Phải là địa chỉ http hoặc https hợp lệ, không kèm tên đăng nhập.",
      );
  }
  const required = z.string().trim().min(1, "Trường này là bắt buộc.");
  if (field.kind === "url") {
    return required
      .max(2048, "Tối đa 2048 ký tự.")
      .refine(isHttpUrl, "Phải là địa chỉ http hoặc https hợp lệ, không kèm tên đăng nhập.");
  }
  if (field.kind === "number") {
    const min = field.min ?? 0;
    const max = field.max ?? Number.MAX_SAFE_INTEGER;
    return required
      .regex(/^\d+$/, "Phải là số nguyên.")
      .refine(
        (value) => Number(value) >= min && Number(value) <= max,
        `Phải từ ${min} đến ${max}.`,
      );
  }
  if (field.pattern) {
    return required.regex(field.pattern, field.patternMessage ?? "Giá trị không hợp lệ.");
  }
  return required;
}
