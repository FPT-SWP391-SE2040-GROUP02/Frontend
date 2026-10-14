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
  it("does not send a TOTP request to an endpoint absent from Backend", async () => {
    await expect(authService.verifyTwoFactor({ code: "012345" })).rejects.toThrow();
    expect(axiosClient.post).not.toHaveBeenCalled();
  });
});
