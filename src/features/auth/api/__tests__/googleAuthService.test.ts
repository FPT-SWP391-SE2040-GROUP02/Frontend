import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosClient } from "@/shared/api/axiosClient";
import { authService } from "../authService";
vi.mock("@/shared/api/axiosClient", () => {
  const client = { post: vi.fn(), get: vi.fn() };
  return { axiosClient: client, apiClient: client };
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(axiosClient.get).mockResolvedValue({ requestToken: "proof" });
});
describe("Google and unavailable Backend contracts", () => {
  it("does not post either Google action when CSRF proof acquisition fails", async () => {
    vi.mocked(axiosClient.get).mockRejectedValue(new Error("proof unavailable"));
    await expect(
      authService.loginWithGoogle({ idToken: "fixture", nonce: "nonce", rememberMe: false }),
    ).rejects.toThrow("proof unavailable");
    await expect(
      authService.linkGoogleAccount({ linkTicket: "ticket", password: "old", rememberMe: false }),
    ).rejects.toThrow("proof unavailable");
    expect(axiosClient.post).not.toHaveBeenCalled();
  });
  it("preserves a link challenge without treating it as a session", async () => {
    const challenge = {
      signedIn: false,
      accountCreated: false,
      returnUrl: null,
      linkTicket: "ticket",
      maskedEmail: "u***@example.test",
    };
    vi.mocked(axiosClient.post).mockResolvedValue(challenge);
    expect(
      await authService.loginWithGoogle({ idToken: "fixture-token", rememberMe: false }),
    ).toEqual(challenge);
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/auth/google",
      { idToken: "fixture-token", rememberMe: false },
      { headers: { "X-CSRF-Token": "proof" } },
    );
  });
  it("blocks invalid Google credentials before acquiring proof or posting", async () => {
    await expect(authService.loginWithGoogle({ idToken: "", rememberMe: false })).rejects.toThrow();
    expect(axiosClient.get).not.toHaveBeenCalled();
    expect(axiosClient.post).not.toHaveBeenCalled();
  });
  it("rejects a signedIn response missing its session", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      signedIn: true,
      accountCreated: false,
      returnUrl: null,
    });
    await expect(
      authService.loginWithGoogle({ idToken: "fixture", rememberMe: false }),
    ).rejects.toThrow();
  });
  it("sends a server-issued ticket and existing password to link-confirm with fresh proof", async () => {
    vi.mocked(axiosClient.post).mockRejectedValue(new Error("fixture denied"));
    await expect(
      authService.linkGoogleAccount({ linkTicket: "ticket", password: "old", rememberMe: false }),
    ).rejects.toThrow("fixture denied");
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/auth/google/link-confirm",
      { linkTicket: "ticket", password: "old", rememberMe: false },
      { headers: { "X-CSRF-Token": "proof" } },
    );
  });
  it("posts the challenge token and code with CSRF proof and returns the full session", async () => {
    const session = {
      accessToken: "fixture-access",
      expiresIn: 900,
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "admin@example.test",
        fullName: "Admin",
        phone: null,
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: true,
        createdAt: "2026-10-20T00:00:00+00:00",
      },
    };
    vi.mocked(axiosClient.post).mockResolvedValue(session);
    expect(
      await authService.verifyTwoFactor({ challengeToken: "challenge", code: " 012345 " }),
    ).toMatchObject({ accessToken: "fixture-access" });
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/auth/2fa/verify",
      { challengeToken: "challenge", code: "012345" },
      { headers: { "X-CSRF-Token": "proof" } },
    );
  });
  it("accepts a recovery code and keeps its case for the Backend to normalise", async () => {
    vi.mocked(axiosClient.post).mockRejectedValue(new Error("fixture denied"));
    await expect(
      authService.verifyTwoFactor({ challengeToken: "challenge", code: "ab12cd-34ef56" }),
    ).rejects.toThrow("fixture denied");
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/auth/2fa/verify",
      { challengeToken: "challenge", code: "ab12cd-34ef56" },
      expect.anything(),
    );
  });
  it.each([
    ["no token", { challengeToken: "", code: "012345" }],
    ["a short code", { challengeToken: "challenge", code: "12345" }],
    ["a code with letters", { challengeToken: "challenge", code: "12345a" }],
  ])("does not post %s", async (_label, payload) => {
    await expect(authService.verifyTwoFactor(payload)).rejects.toThrow();
    expect(axiosClient.post).not.toHaveBeenCalled();
  });
  it("keeps the Google 2FA challenge apart from a link challenge", async () => {
    const challenge = {
      signedIn: false,
      twoFactorRequired: true,
      challengeToken: "challenge",
      challengeExpiresIn: 300,
    };
    vi.mocked(axiosClient.post).mockResolvedValue(challenge);
    expect(await authService.loginWithGoogle({ idToken: "fixture", rememberMe: false })).toEqual(
      challenge,
    );
  });
  it("returns the challenge from link-confirm instead of failing to parse a session", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      twoFactorRequired: true,
      challengeToken: "challenge",
      expiresIn: 300,
    });
    expect(
      await authService.linkGoogleAccount({
        linkTicket: "ticket",
        password: "old",
        rememberMe: false,
      }),
    ).toMatchObject({ twoFactorRequired: true, challengeToken: "challenge" });
  });
});
