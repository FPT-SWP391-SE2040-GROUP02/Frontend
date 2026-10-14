import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosClient } from "@/shared/api/axiosClient";
import { AUTH_SYSTEM_ROLES, AUTH_USER_STATUSES } from "@/entities/user/model/authContract.types";
import { cookieAuthService } from "../authService";

vi.mock("@/shared/api/axiosClient", () => {
  const client = { post: vi.fn(), get: vi.fn() };
  return { axiosClient: client, apiClient: client };
});

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.test",
  fullName: "Service fixture",
  phone: null,
  role: AUTH_SYSTEM_ROLES.VERIFIER,
  status: AUTH_USER_STATUSES.ACTIVE,
  createdAt: "2026-10-12T00:00:00Z",
  updatedAt: null,
};
const session = { userId: user.id, expiresIn: 900, user };
const login = { email: user.email, password: "fixture-password", rememberMe: false };

const csrfConfig = { headers: { "X-CSRF-Token": "fixture-proof" } };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(axiosClient.get).mockResolvedValue({ data: { requestToken: "fixture-proof" } });
});

describe("confirmed cookie auth service", () => {
  it("reads the HTTP body envelope once and sends only confirmed login fields", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: session });
    expect(await cookieAuthService.login({ ...login, ...{ role: "ADMIN" } })).toEqual(session);
    expect(axiosClient.get).toHaveBeenCalledWith("/auth/csrf");
    expect(axiosClient.get).toHaveBeenCalledTimes(1);
    expect(axiosClient.post).toHaveBeenCalledWith("/auth/login", login, csrfConfig);
    expect(vi.mocked(axiosClient.get).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(axiosClient.post).mock.invocationCallOrder[0],
    );
  });

  it("refreshes without sending or returning bearer secrets", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: { ...session, accessToken: "unexpected-secret", refreshToken: "unexpected-secret" },
    });
    expect(await cookieAuthService.refresh()).toEqual(session);
    expect(axiosClient.post).toHaveBeenCalledWith("/auth/refresh", undefined, csrfConfig);
  });

  it("reads the current-session envelope instead of assuming a login response", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({ data: { user } });
    expect(await cookieAuthService.getSession()).toEqual({ user });
    expect(axiosClient.get).toHaveBeenCalledWith("/auth/session");
    expect(axiosClient.get).toHaveBeenCalledTimes(1);
  });

  it.each([{ user }, { data: { data: session } }, { data: { ...session, expiresIn: -1 } }])(
    "rejects incompatible successful login bodies",
    async (body) => {
      vi.mocked(axiosClient.post).mockResolvedValue(body);
      await expect(cookieAuthService.login(login)).rejects.toThrow();
    },
  );

  it("propagates transport failures without fabricating a session", async () => {
    const failure = new Error("fixture-network-failure");
    vi.mocked(axiosClient.post).mockRejectedValue(failure);
    await expect(cookieAuthService.refresh()).rejects.toBe(failure);
  });

  it("supports bodyless logout and strips legacy request fields", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(undefined);
    await cookieAuthService.logout();
    expect(axiosClient.post).toHaveBeenLastCalledWith("/auth/logout", undefined, csrfConfig);
    await cookieAuthService.logout({ revokeAllDevices: true, ...{ reason: "legacy" } });
    expect(axiosClient.post).toHaveBeenLastCalledWith(
      "/auth/logout",
      { revokeAllDevices: true },
      csrfConfig,
    );
  });

  it.each(["login", "refresh", "logout"] as const)(
    "blocks %s when proof acquisition fails",
    async (action) => {
      const failure = new Error("csrf-unavailable");
      vi.mocked(axiosClient.get).mockRejectedValue(failure);
      const request =
        action === "login" ? cookieAuthService.login(login) : cookieAuthService[action]();
      await expect(request).rejects.toBe(failure);
      expect(axiosClient.post).not.toHaveBeenCalled();
    },
  );

  it.each([{ data: { requestToken: "" } }, { requestToken: "unwrapped" }])(
    "blocks POST when proof body is invalid",
    async (body) => {
      vi.mocked(axiosClient.get).mockResolvedValue(body);
      await expect(cookieAuthService.refresh()).rejects.toThrow();
      expect(axiosClient.post).not.toHaveBeenCalled();
    },
  );

  it("acquires a new proof for each auth transition without persisting or reusing the previous proof", async () => {
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");
    const cookieWrite = vi.spyOn(document, "cookie", "set");
    try {
      vi.mocked(axiosClient.get)
        .mockResolvedValueOnce({ data: { requestToken: "anonymous-proof" } })
        .mockResolvedValueOnce({ data: { requestToken: "authenticated-proof" } });
      vi.mocked(axiosClient.post).mockResolvedValue({ data: session });
      await cookieAuthService.login(login);
      await cookieAuthService.logout();
      expect(axiosClient.get).toHaveBeenCalledTimes(2);
      expect(axiosClient.post).toHaveBeenNthCalledWith(1, "/auth/login", login, {
        headers: { "X-CSRF-Token": "anonymous-proof" },
      });
      expect(axiosClient.post).toHaveBeenNthCalledWith(2, "/auth/logout", undefined, {
        headers: { "X-CSRF-Token": "authenticated-proof" },
      });
      expect(storageWrite).not.toHaveBeenCalled();
      expect(cookieWrite).not.toHaveBeenCalled();
    } finally {
      storageWrite.mockRestore();
      cookieWrite.mockRestore();
    }
  });
});
