import { describe, expect, it } from "vitest";
import type { SystemConfigEntry } from "../model/systemConfig.schema";
import {
  SYSTEM_CONFIG_SERVICES,
  buildConfigFormSchema,
  statusChip,
} from "../model/systemConfig.content";

const slot = {
  slot: "PRIMARY" as const,
  enabled: true,
  source: "DATABASE" as const,
  settings: { model: "gemini-flash-lite-latest", timeoutSeconds: "20" },
  secrets: [{ name: "apiKey", hasValue: true, last4: "1a2b" }],
  version: 1,
  updatedAt: "2026-11-03T10:00:00+00:00",
  updatedBy: "Cô Lan",
};

function entry(
  overrides: Partial<SystemConfigEntry["status"]> = {},
  source: "DATABASE" | "APPSETTINGS" = "DATABASE",
): SystemConfigEntry {
  return {
    serviceKey: "GEMINI",
    supportsFallback: true,
    slots: [{ ...slot, source }],
    status: {
      activeSlot: null,
      lastOutcome: null,
      lastAt: null,
      lastErrorCode: null,
      ...overrides,
    },
  };
}

describe("statusChip", () => {
  it("báo đang dùng dự phòng khi lần gọi gần nhất do ô dự phòng trả lời", () => {
    expect(statusChip(entry({ activeSlot: "FALLBACK", lastOutcome: "SUCCEEDED" }))).toEqual({
      tone: "warning",
      text: "Đang dùng dịch vụ dự phòng",
    });
  });

  it("báo lỗi ở lần gọi gần nhất", () => {
    expect(
      statusChip(
        entry({
          lastOutcome: "FAILED",
          lastErrorCode: "HTTP_503",
          lastAt: "2026-11-03T10:00:00+00:00",
        }),
      ),
    ).toEqual({ tone: "warning", text: "Lỗi ở lần gọi gần nhất" });
  });

  it("báo đang dùng cấu hình mặc định của máy chủ khi Admin chưa lưu gì", () => {
    expect(statusChip(entry({}, "APPSETTINGS"))).toEqual({
      tone: "neutral",
      text: "Đang dùng cấu hình mặc định của máy chủ",
    });
  });

  it("vẫn là cấu hình mặc định dù lần gọi gần nhất thành công", () => {
    expect(
      statusChip(
        entry(
          { activeSlot: "PRIMARY", lastOutcome: "SUCCEEDED", lastAt: "2026-11-03T10:00:00+00:00" },
          "APPSETTINGS",
        ),
      ).tone,
    ).toBe("neutral");
  });

  it("báo đang dùng cấu hình chính khi Admin đã lưu và chưa có lỗi", () => {
    expect(statusChip(entry({ activeSlot: "PRIMARY", lastOutcome: "SUCCEEDED" }))).toEqual({
      tone: "success",
      text: "Đang dùng cấu hình chính",
    });
  });
});

describe("SEPAY content", () => {
  const content = SYSTEM_CONFIG_SERVICES.SEPAY;
  const schema = buildConfigFormSchema(content.fields);
  const valid = {
    environment: "Test",
    bankCode: "MBBank",
    accountNumber: "1234567890",
    accountName: "CONG TY A",
    webhookApiKey: "",
    reason: "đổi tài khoản",
    enabled: true,
  };

  it("nhận môi trường Test và Live, cho phép để trống khóa và tài khoản", () => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, environment: "Live" }).success).toBe(true);
    expect(
      schema.safeParse({ ...valid, bankCode: "", accountNumber: "", accountName: "" }).success,
    ).toBe(true);
  });

  it.each(["Prod", "test", ""])("từ chối môi trường %j", (environment) => {
    expect(schema.safeParse({ ...valid, environment }).success).toBe(false);
  });

  it("không có nút thử kết nối", () => {
    expect(content.canTest).toBe(false);
  });

  it("chỉ đòi gõ lại tên dịch vụ khi chuyển sang Live", () => {
    const confirm = content.confirm;
    expect(confirm?.({ environment: "Test" }, { environment: "Live" })).toBe(true);
    expect(confirm?.({ environment: "Live" }, { environment: "Live" })).toBe(false);
    expect(confirm?.({ environment: "Live" }, { environment: "Test" })).toBe(false);
  });
});

describe("EKYC content", () => {
  const schema = buildConfigFormSchema(SYSTEM_CONFIG_SERVICES.EKYC.fields);
  const valid = {
    baseUrl: "http://127.0.0.1:8879",
    timeoutSeconds: "60",
    apiKey: "",
    reason: "đổi địa chỉ",
    enabled: true,
  };

  it("nhận địa chỉ http/https và cho phép để trống khóa", () => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, baseUrl: "https://ekyc.example.test/api" }).success).toBe(
      true,
    );
  });

  it.each(["ftp://ekyc.test", "http://user:pass@ekyc.test", "không phải địa chỉ", ""])(
    "từ chối địa chỉ %j",
    (baseUrl) => {
      expect(schema.safeParse({ ...valid, baseUrl }).success).toBe(false);
    },
  );

  it.each(["4", "301", "abc"])("từ chối thời gian chờ %j", (timeoutSeconds) => {
    expect(schema.safeParse({ ...valid, timeoutSeconds }).success).toBe(false);
  });

  it("có nút thử kết nối", () => {
    expect(SYSTEM_CONFIG_SERVICES.EKYC.canTest).toBe(true);
  });
});

describe("buildConfigFormSchema", () => {
  const schema = buildConfigFormSchema(SYSTEM_CONFIG_SERVICES.GEMINI.fields);
  const valid = {
    model: "gemini-2.5-flash",
    timeoutSeconds: "20",
    apiKey: "",
    reason: "đổi model",
    enabled: true,
  };

  it("nhận giá trị hợp lệ và cho phép để trống ô khóa", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it.each(["a/b", "m?key=1", "a b", ""])("từ chối model %j", (model) => {
    expect(schema.safeParse({ ...valid, model }).success).toBe(false);
  });

  it.each(["4", "61", "abc", "", "20.5"])("từ chối thời gian chờ %j", (timeoutSeconds) => {
    expect(schema.safeParse({ ...valid, timeoutSeconds }).success).toBe(false);
  });

  it.each(["5", "60"])("nhận thời gian chờ %j ở hai đầu khoảng", (timeoutSeconds) => {
    expect(schema.safeParse({ ...valid, timeoutSeconds }).success).toBe(true);
  });

  it("bắt buộc có lý do, tối đa 500 ký tự", () => {
    expect(schema.safeParse({ ...valid, reason: "  " }).success).toBe(false);
    expect(schema.safeParse({ ...valid, reason: "x".repeat(501) }).success).toBe(false);
  });
});
