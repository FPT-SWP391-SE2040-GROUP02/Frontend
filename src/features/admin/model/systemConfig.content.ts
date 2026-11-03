import { z } from "zod";
import type { SystemConfigEntry } from "./systemConfig.schema";

/** Loại ô nhập của một trường cấu hình: chữ, số nguyên, hoặc khóa bí mật (chỉ ghi, không bao giờ hiện lại). */
export type ConfigFieldKind = "text" | "number" | "secret";

export interface ConfigFieldSpec {
  name: string;
  label: string;
  kind: ConfigFieldKind;
  hint?: string;
  min?: number;
  max?: number;
  /** Luật hình dạng cho ô chữ; Backend vẫn là nơi quyết định cuối cùng. */
  pattern?: RegExp;
  patternMessage?: string;
}

export interface ServiceContent {
  title: string;
  description: string;
  fields: ConfigFieldSpec[];
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

function fieldSchema(field: ConfigFieldSpec): z.ZodTypeAny {
  if (field.kind === "secret") return z.string().max(512, "Tối đa 512 ký tự.");
  const required = z.string().trim().min(1, "Trường này là bắt buộc.");
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
