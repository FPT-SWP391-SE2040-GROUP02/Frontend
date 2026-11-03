import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { systemConfigService } from "../api/systemConfigService";

const primarySlot = {
  slot: "PRIMARY",
  enabled: true,
  source: "APPSETTINGS",
  settings: { model: "gemini-flash-lite-latest", timeoutSeconds: "20" },
  secrets: [{ name: "apiKey", hasValue: true, last4: null }],
  version: 0,
  updatedAt: null,
  updatedBy: null,
};
const fallbackSlot = {
  slot: "FALLBACK",
  enabled: false,
  source: "APPSETTINGS",
  settings: { model: "gemini-flash-lite-latest", timeoutSeconds: "20" },
  secrets: [{ name: "apiKey", hasValue: false, last4: null }],
  version: 0,
  updatedAt: null,
  updatedBy: null,
};
const status = { activeSlot: null, lastOutcome: null, lastAt: null, lastErrorCode: null };
const listFixture = {
  services: [
    { serviceKey: "GEMINI", supportsFallback: true, slots: [primarySlot, fallbackSlot], status },
  ],
};
const draft = { model: "gemini-2.5-flash", timeoutSeconds: "20" };

afterEach(() => vi.restoreAllMocks());

describe("systemConfigService", () => {
  it("đọc danh sách đúng DTO và từ chối response thiếu status", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(listFixture);
    await expect(systemConfigService.list()).resolves.toEqual(listFixture);
    expect(get).toHaveBeenCalledWith("/admin/system-config", { signal: undefined });

    const missing = {
      services: [{ serviceKey: "GEMINI", supportsFallback: true, slots: [primarySlot] }],
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
    await systemConfigService.update("GEMINI", "PRIMARY", {
      settings: draft,
      secrets: { apiKey: "" },
      enabled: true,
      reason: "  hết quota khóa cũ  ",
      version: 0,
    });
    expect(put).toHaveBeenCalledWith("/admin/system-config/GEMINI/PRIMARY", {
      settings: draft,
      enabled: true,
      reason: "hết quota khóa cũ",
      version: 0,
    });
  });

  it("lưu: gửi khóa khi người dùng nhập khóa mới", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...primarySlot, version: 1 });
    await systemConfigService.update("GEMINI", "FALLBACK", {
      settings: draft,
      secrets: { apiKey: " sk-new-1234 " },
      enabled: true,
      reason: "thêm dự phòng",
      version: 0,
    });
    expect(put).toHaveBeenCalledWith(
      "/admin/system-config/GEMINI/FALLBACK",
      expect.objectContaining({ secrets: { apiKey: "sk-new-1234" } }),
    );
  });

  it("lưu: từ chối lý do rỗng hoặc dài hơn 500 ký tự trước khi gửi", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(primarySlot);
    const base = { settings: draft, enabled: true, version: 0 };
    await expect(
      systemConfigService.update("GEMINI", "PRIMARY", { ...base, reason: "   " }),
    ).rejects.toBeInstanceOf(ZodError);
    await expect(
      systemConfigService.update("GEMINI", "PRIMARY", { ...base, reason: "x".repeat(501) }),
    ).rejects.toBeInstanceOf(ZodError);
    expect(put).not.toHaveBeenCalled();
  });

  it("từ chối mã dịch vụ lạ để không ghép vào đường dẫn", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(primarySlot);
    await expect(
      systemConfigService.update("gemini/../x", "PRIMARY", {
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
      systemConfigService.reset("GEMINI", "PRIMARY", { reason: " về mặc định " }),
    ).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith("/admin/system-config/GEMINI/PRIMARY/reset", {
      reason: "về mặc định",
    });
  });

  it("thử kết nối: gửi giá trị nháp, bỏ khóa trống và đọc kết quả", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ ok: false, errorCode: "HTTP_401", latencyMs: 12 });
    await expect(
      systemConfigService.test("GEMINI", "PRIMARY", { settings: draft, secrets: { apiKey: "" } }),
    ).resolves.toEqual({ ok: false, errorCode: "HTTP_401", latencyMs: 12 });
    expect(post).toHaveBeenCalledWith("/admin/system-config/GEMINI/PRIMARY/test", {
      settings: draft,
    });
  });
});
