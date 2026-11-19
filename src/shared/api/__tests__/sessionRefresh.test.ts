import { afterEach, describe, expect, it, vi } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiClient } from "../axiosClient";
import { accessTokenMemory } from "../accessToken";
import { subscribeSessionFailure } from "../sessionFailure";
import { registerSessionRefresher, type SessionRefreshOutcome } from "../sessionRefresh";

afterEach(() => {
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function expiredError(config: InternalAxiosRequestConfig): AxiosError {
  const failure = new AxiosError("expired");
  failure.config = config;
  failure.response = {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
    data: { code: "SESSION_EXPIRED" },
  };
  return failure;
}

/** Adapter giả: token cũ nhận 401 SESSION_EXPIRED, token mới nhận 200. Ghi lại Bearer của từng lần gọi. */
function makeAdapter(sent: string[], alwaysExpired = false) {
  return async (config: InternalAxiosRequestConfig) => {
    sent.push(String(config.headers.get("Authorization")));
    if (alwaysExpired || config.headers.get("Authorization") === "Bearer old-token") {
      throw expiredError(config);
    }
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
  };
}

function setup(outcome: SessionRefreshOutcome) {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  accessTokenMemory.set("old-token");
  const refresh = vi.fn(async () => {
    if (outcome === "ok") accessTokenMemory.set("new-token");
    return outcome;
  });
  const expired = vi.fn();
  const off = [registerSessionRefresher(refresh), subscribeSessionFailure(expired)];
  return { refresh, expired, cleanup: () => off.forEach((fn) => fn()) };
}

describe("Làm mới phiên khi access token hết hạn", () => {
  it("làm mới một lần rồi gửi lại request bằng token mới, không đóng phiên", async () => {
    const { refresh, expired, cleanup } = setup("ok");
    const sent: string[] = [];
    try {
      await expect(apiClient.get("/vaults/me", { adapter: makeAdapter(sent) })).resolves.toEqual({
        ok: true,
      });
      expect(sent).toEqual(["Bearer old-token", "Bearer new-token"]);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(expired).not.toHaveBeenCalled();
    } finally {
      cleanup();
    }
  });

  it("nhiều request cùng hết hạn chỉ làm mới một lần", async () => {
    const { refresh, cleanup } = setup("ok");
    const sent: string[] = [];
    try {
      const results = await Promise.all([
        apiClient.get("/vaults/a", { adapter: makeAdapter(sent) }),
        apiClient.get("/vaults/b", { adapter: makeAdapter(sent) }),
        apiClient.get("/vaults/c", { adapter: makeAdapter(sent) }),
      ]);
      expect(results).toHaveLength(3);
      expect(refresh).toHaveBeenCalledTimes(1);
    } finally {
      cleanup();
    }
  });

  it("làm mới báo hết phiên: lỗi gốc đi tiếp và phiên bị đóng", async () => {
    const { refresh, expired, cleanup } = setup("expired");
    try {
      await expect(
        apiClient.get("/vaults/me", { adapter: makeAdapter([]) }),
      ).rejects.toBeInstanceOf(AxiosError);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(expired).toHaveBeenCalledTimes(1);
    } finally {
      cleanup();
    }
  });

  it("làm mới gặp lỗi tạm (mạng, 5xx): giữ phiên, lỗi gốc đi tiếp", async () => {
    const { refresh, expired, cleanup } = setup("unavailable");
    try {
      await expect(
        apiClient.get("/vaults/me", { adapter: makeAdapter([]) }),
      ).rejects.toBeInstanceOf(AxiosError);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(expired).not.toHaveBeenCalled();
    } finally {
      cleanup();
    }
  });

  it("sau khi làm mới vẫn 401 thì không làm mới lần hai và đóng phiên", async () => {
    const { refresh, expired, cleanup } = setup("ok");
    const sent: string[] = [];
    try {
      await expect(
        apiClient.get("/vaults/me", { adapter: makeAdapter(sent, true) }),
      ).rejects.toBeInstanceOf(AxiosError);
      expect(sent).toHaveLength(2);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(expired).toHaveBeenCalledTimes(1);
    } finally {
      cleanup();
    }
  });

  it("không làm mới cho request /auth/ (trừ /auth/session)", async () => {
    const { refresh, cleanup } = setup("ok");
    try {
      await expect(
        apiClient.post("/auth/refresh", undefined, { adapter: makeAdapter([]) }),
      ).rejects.toBeInstanceOf(AxiosError);
      expect(refresh).not.toHaveBeenCalled();
    } finally {
      cleanup();
    }
  });

  it("làm mới cho /auth/session (kiểm tra phiên định kỳ)", async () => {
    const { refresh, cleanup } = setup("ok");
    try {
      await expect(apiClient.get("/auth/session", { adapter: makeAdapter([]) })).resolves.toEqual({
        ok: true,
      });
      expect(refresh).toHaveBeenCalledTimes(1);
    } finally {
      cleanup();
    }
  });

  it("không đăng ký hàm làm mới thì giữ hành vi cũ: báo hết phiên ngay", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    accessTokenMemory.set("old-token");
    const expired = vi.fn();
    const off = subscribeSessionFailure(expired);
    try {
      await expect(
        apiClient.get("/vaults/me", { adapter: makeAdapter([]) }),
      ).rejects.toBeInstanceOf(AxiosError);
      expect(expired).toHaveBeenCalledTimes(1);
    } finally {
      off();
    }
  });
});
