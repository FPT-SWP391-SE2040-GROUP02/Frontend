import { afterEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { apiClient } from "../axiosClient";
import { accessTokenMemory } from "../accessToken";
import { subscribeSessionFailure } from "../sessionFailure";

afterEach(() => {
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});
describe("Session failure transport boundary", () => {
  it.each(["current", "stale", "credentials", "external"])(
    "handles %s without clearing an unrelated session",
    async (kind) => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const expired = vi.fn();
      const unsubscribe = subscribeSessionFailure(expired);
      accessTokenMemory.set("old-token");
      const url = kind === "external" ? "https://external.example/session" : "/vaults/me";
      const failure = new AxiosError("fixture");
      try {
        await expect(
          apiClient.get(url, {
            adapter: async (config) => {
              if (kind === "stale") accessTokenMemory.set("new-token");
              failure.config = config;
              failure.response = {
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
                data: { code: kind === "credentials" ? "INVALID_CREDENTIALS" : "SESSION_EXPIRED" },
              };
              throw failure;
            },
          }),
        ).rejects.toBe(failure);
        expect(expired).toHaveBeenCalledTimes(kind === "current" ? 1 : 0);
      } finally {
        unsubscribe();
      }
    },
  );

  it("reports session failure on /auth/session 401 SESSION_EXPIRED but ignores other /auth/ endpoints", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const expired = vi.fn();
    const unsubscribe = subscribeSessionFailure(expired);
    accessTokenMemory.set("active-token");

    const failureSession = new AxiosError("session expired");
    await expect(
      apiClient.get("/auth/session", {
        adapter: async (config) => {
          failureSession.config = config;
          failureSession.response = {
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config,
            data: { code: "SESSION_EXPIRED" },
          };
          throw failureSession;
        },
      }),
    ).rejects.toBe(failureSession);
    expect(expired).toHaveBeenCalledTimes(1);

    const failureLogin = new AxiosError("login failed");
    await expect(
      apiClient.post("/auth/login", undefined, {
        adapter: async (config) => {
          failureLogin.config = config;
          failureLogin.response = {
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config,
            data: { code: "SESSION_EXPIRED" },
          };
          throw failureLogin;
        },
      }),
    ).rejects.toBe(failureLogin);
    // Vẫn chỉ là 1 lần từ /auth/session, không tăng thêm từ /auth/login
    expect(expired).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
