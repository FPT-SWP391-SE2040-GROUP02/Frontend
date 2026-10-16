import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosClient } from "@/shared/api/axiosClient";
import { AUTH_SYSTEM_ROLES, AUTH_USER_STATUSES } from "@/entities/user/model/authContract.types";
import { sessionAuthService } from "../authService";

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
  emailVerified: true,
  hasPassword: true,
};
const session = { accessToken: "fixture-access", expiresIn: 900, user };
const login = { email: user.email, password: "fixture-password", rememberMe: false };

const csrfConfig = { headers: { "X-CSRF-Token": "fixture-proof" } };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(axiosClient.get).mockResolvedValue({ requestToken: "fixture-proof" });
});

describe("Backend Bearer and refresh-cookie transport", () => {
  it("reads the raw HTTP body once and sends only confirmed login fields", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(session);
    expect(await sessionAuthService.login({ ...login, ...{ role: "ADMIN" } })).toEqual(session);
    expect(axiosClient.get).toHaveBeenCalledWith("/auth/csrf");
    expect(axiosClient.get).toHaveBeenCalledTimes(1);
    expect(axiosClient.post).toHaveBeenCalledWith("/auth/login", login, csrfConfig);
    expect(vi.mocked(axiosClient.get).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(axiosClient.post).mock.invocationCallOrder[0],
    );
  });

  it("refreshes with access token in RAM contract and strips refresh secrets", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      ...session,
      refreshToken: "unexpected-secret",
    });
    expect(await sessionAuthService.refresh()).toEqual(session);
    expect(axiosClient.post).toHaveBeenCalledWith("/auth/refresh", undefined, csrfConfig);
  });

  it("reads the raw current-session response instead of assuming a login response", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(user);
    expect(await sessionAuthService.getSession()).toEqual(user);
    expect(axiosClient.get).toHaveBeenCalledWith("/auth/session");
    expect(axiosClient.get).toHaveBeenCalledTimes(1);
  });

  it.each([{ user }, { data: { data: session } }, { data: { ...session, expiresIn: -1 } }])(
    "rejects incompatible successful login bodies",
    async (body) => {
      vi.mocked(axiosClient.post).mockResolvedValue(body);
      await expect(sessionAuthService.login(login)).rejects.toThrow();
    },
  );

  it("propagates transport failures without fabricating a session", async () => {
    const failure = new Error("fixture-network-failure");
    vi.mocked(axiosClient.post).mockRejectedValue(failure);
    await expect(sessionAuthService.refresh()).rejects.toBe(failure);
  });

  it("supports bodyless logout and strips legacy request fields", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(undefined);
    await sessionAuthService.logout();
    expect(axiosClient.post).toHaveBeenLastCalledWith("/auth/logout", undefined, csrfConfig);
    await sessionAuthService.logout({ revokeAllDevices: true, ...{ reason: "legacy" } });
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
        action === "login" ? sessionAuthService.login(login) : sessionAuthService[action]();
      await expect(request).rejects.toBe(failure);
      expect(axiosClient.post).not.toHaveBeenCalled();
    },
  );

  it.each([{ data: { requestToken: "" } }, { data: { requestToken: "wrapped" } }])(
    "blocks POST when proof body is invalid",
    async (body) => {
      vi.mocked(axiosClient.get).mockResolvedValue(body);
      await expect(sessionAuthService.refresh()).rejects.toThrow();
      expect(axiosClient.post).not.toHaveBeenCalled();
    },
  );

  it("acquires a new proof for each auth transition without persisting or reusing the previous proof", async () => {
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");
    const cookieWrite = vi.spyOn(document, "cookie", "set");
    try {
      vi.mocked(axiosClient.get)
        .mockResolvedValueOnce({ requestToken: "anonymous-proof" })
        .mockResolvedValueOnce({ requestToken: "authenticated-proof" });
      vi.mocked(axiosClient.post).mockResolvedValue(session);
      await sessionAuthService.login(login);
      await sessionAuthService.logout();
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
