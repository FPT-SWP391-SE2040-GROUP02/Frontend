import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosClient } from "@/shared/api/axiosClient";
import { loginMethodsService } from "../loginMethodsService";

vi.mock("@/shared/api/axiosClient", () => {
  const client = { post: vi.fn(), get: vi.fn() };
  return { axiosClient: client, apiClient: client };
});
beforeEach(() => vi.resetAllMocks());

describe("loginMethodsService", () => {
  it("reads the list and drops fields outside the contract", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue([
      {
        method: "GOOGLE",
        email: "a@b.test",
        linkedAt: "2026-10-02T00:00:00+00:00",
        lastUsedAt: null,
        canRemove: true,
        googleSubject: "private-subject",
      },
    ]);
    const result = await loginMethodsService.list();
    expect(JSON.stringify(result)).not.toContain("private-subject");
    expect(axiosClient.get).toHaveBeenCalledWith("/me/login-methods", { signal: undefined });
  });

  it("rejects an unknown method instead of rendering it", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue([
      { method: "PASSKEY", email: null, linkedAt: null, lastUsedAt: null, canRemove: true },
    ]);
    await expect(loginMethodsService.list()).rejects.toThrow();
  });

  it.each([
    ["linkGoogle", { idToken: "t", nonce: "n", currentPassword: "p" }, "/me/login-methods/google"],
    ["unlinkGoogle", { currentPassword: "p" }, "/me/login-methods/google/unlink"],
    ["verifyPassword", { currentPassword: "p" }, "/me/login-methods/password/verify"],
    [
      "setPassword",
      { googleIdToken: "t", nonce: "n", newPassword: "12345678", confirmPassword: "12345678" },
      "/me/login-methods/password",
    ],
    [
      "removePassword",
      { currentPassword: "p", googleIdToken: "t", nonce: "n" },
      "/me/login-methods/password/remove",
    ],
  ] as const)(
    "posts %s to the contract path with only the contract fields",
    async (name, body, path) => {
      vi.mocked(axiosClient.post).mockResolvedValue({
        method: "GOOGLE",
        email: null,
        linkedAt: null,
        lastUsedAt: null,
        canRemove: true,
      });
      const call = loginMethodsService[name] as (request: unknown) => Promise<unknown>;
      await call({ ...body, extra: "private" });
      expect(axiosClient.post).toHaveBeenCalledWith(path, body);
    },
  );

  it.each([
    ["an empty current password", () => loginMethodsService.unlinkGoogle({ currentPassword: "" })],
    [
      "a short new password",
      () =>
        loginMethodsService.setPassword({
          googleIdToken: "t",
          newPassword: "short",
          confirmPassword: "short",
        }),
    ],
    [
      "a missing Google token",
      () =>
        loginMethodsService.removePassword({
          currentPassword: "p",
          googleIdToken: "",
        }),
    ],
  ])("does not post %s", async (_label, run) => {
    await expect(run()).rejects.toThrow();
    expect(axiosClient.post).not.toHaveBeenCalled();
  });
});
