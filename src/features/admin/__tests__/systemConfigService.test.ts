import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { systemConfigService } from "../api/systemConfigService";

const primarySlot = {
  slot: "PRIMARY",
  enabled: true,
  source: "APPSETTINGS",
  settings: { baseUrl: "http://127.0.0.1:8879", timeoutSeconds: "60" },
  secrets: [{ name: "apiKey", hasValue: true, last4: null }],
  version: 0,
  updatedAt: null,
  updatedBy: null,
};
const fallbackSlot = {
  slot: "FALLBACK",
  enabled: false,
  source: "APPSETTINGS",
  settings: { baseUrl: "http://127.0.0.1:8879", timeoutSeconds: "60" },
  secrets: [{ name: "apiKey", hasValue: false, last4: null }],
  version: 0,
  updatedAt: null,
  updatedBy: null,
};
const status = { activeSlot: null, lastOutcome: null, lastAt: null, lastErrorCode: null };
const listFixture = {
  services: [
    { serviceKey: "EKYC", supportsFallback: true, slots: [primarySlot, fallbackSlot], status },
  ],
};
const draft = { baseUrl: "http://127.0.0.1:9000", timeoutSeconds: "60" };

afterEach(() => vi.restoreAllMocks());

describe("systemConfigService", () => {
  it("đọc danh sách đúng DTO và từ chối response thiếu status", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(listFixture);
    await expect(systemConfigService.list()).resolves.toEqual(listFixture);
    expect(get).toHaveBeenCalledWith("/admin/system-config", { signal: undefined });

    const missing = {
      services: [{ serviceKey: "EKYC", supportsFallback: true, slots: [primarySlot] }],
    };
    get.mockResolvedValue(missing);
    await expect(systemConfigService.list()).rejects.toBeInstanceOf(ZodError);
  });

  it("bỏ mọi trường lạ của response, nên không có chỗ nào giữ được giá trị khóa", async () => {
    const leaky = {
      apiKey: "sk-LEAK-1234",
      services: [
        {
          ...listFixture.services[0],
          slots: [
            {
              ...primarySlot,
              secrets: [{ name: "apiKey", hasValue: true, last4: null, value: "sk-LEAK-1234" }],
            },
            fallbackSlot,
          ],
        },
      ],
    };
    vi.spyOn(apiClient, "get").mockResolvedValue(leaky);
    const parsed = await systemConfigService.list();
    expect(JSON.stringify(parsed)).not.toContain("LEAK");
  });

  it("lưu: bỏ khóa để trống, cắt lý do và gửi đúng đường dẫn", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...primarySlot, version: 1 });
    await systemConfigService.update("EKYC", "PRIMARY", {
      settings: draft,
      secrets: { apiKey: "" },
      enabled: true,
      reason: "  hết quota khóa cũ  ",
      version: 0,
    });
    expect(put).toHaveBeenCalledWith("/admin/system-config/EKYC/PRIMARY", {
      settings: draft,
      enabled: true,
      reason: "hết quota khóa cũ",
      version: 0,
    });
  });

  it("lưu: gửi confirmText đã cắt khoảng trắng, bỏ khi để trống", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...primarySlot, version: 1 });
    const base = { settings: draft, enabled: true, reason: "chuyển Live", version: 0 };
    await systemConfigService.update("SEPAY", "PRIMARY", { ...base, confirmText: " SEPAY " });
    expect(put).toHaveBeenLastCalledWith(
      "/admin/system-config/SEPAY/PRIMARY",
      expect.objectContaining({ confirmText: "SEPAY" }),
    );
    await systemConfigService.update("SEPAY", "PRIMARY", { ...base, confirmText: "  " });
    expect(put.mock.calls[1][1]).not.toHaveProperty("confirmText");
  });

  it("lưu: gửi khóa khi người dùng nhập khóa mới", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...primarySlot, version: 1 });
    await systemConfigService.update("EKYC", "FALLBACK", {
      settings: draft,
      secrets: { apiKey: " sk-new-1234 " },
      enabled: true,
      reason: "thêm dự phòng",
      version: 0,
    });
    expect(put).toHaveBeenCalledWith(
      "/admin/system-config/EKYC/FALLBACK",
      expect.objectContaining({ secrets: { apiKey: "sk-new-1234" } }),
    );
  });

  it("lưu: từ chối lý do rỗng hoặc dài hơn 500 ký tự trước khi gửi", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(primarySlot);
    const base = { settings: draft, enabled: true, version: 0 };
    await expect(
      systemConfigService.update("EKYC", "PRIMARY", { ...base, reason: "   " }),
    ).rejects.toBeInstanceOf(ZodError);
    await expect(
      systemConfigService.update("EKYC", "PRIMARY", { ...base, reason: "x".repeat(501) }),
    ).rejects.toBeInstanceOf(ZodError);
    expect(put).not.toHaveBeenCalled();
  });

  it("từ chối mã dịch vụ lạ để không ghép vào đường dẫn", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(primarySlot);
    await expect(
      systemConfigService.update("ekyc/../x", "PRIMARY", {
        settings: draft,
        enabled: true,
        reason: "thử",
        version: 0,
      }),
    ).rejects.toBeInstanceOf(ZodError);
    expect(put).not.toHaveBeenCalled();
  });

  it("khôi phục: gửi lý do tới đường dẫn reset và trả về không có gì", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(undefined);
    await expect(
      systemConfigService.reset("EKYC", "PRIMARY", { reason: " về mặc định " }),
    ).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith("/admin/system-config/EKYC/PRIMARY/reset", {
      reason: "về mặc định",
    });
  });

  it("thử kết nối: gửi giá trị nháp, bỏ khóa trống và đọc kết quả", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ ok: false, errorCode: "HTTP_401", latencyMs: 12 });
    await expect(
      systemConfigService.test("EKYC", "PRIMARY", { settings: draft, secrets: { apiKey: "" } }),
    ).resolves.toEqual({ ok: false, errorCode: "HTTP_401", latencyMs: 12 });
    expect(post).toHaveBeenCalledWith("/admin/system-config/EKYC/PRIMARY/test", {
      settings: draft,
    });
  });
});
