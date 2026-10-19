import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosClient } from "@/shared/api/axiosClient";
import { authService } from "../authService";

vi.mock("@/shared/api/axiosClient", () => {
  const client = { post: vi.fn(), get: vi.fn() };
  return { axiosClient: client, apiClient: client };
});
const request = {
  email: "owner@example.test",
  fullName: "Test User",
  password: "Abcdefg!",
  confirmPassword: "Abcdefg!",
};
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: request.email,
  fullName: request.fullName,
  phone: null,
  role: "USER",
  status: "ACTIVE",
  emailVerified: true,
  hasPassword: true,
  createdAt: "2026-10-14T00:00:00Z",
};
beforeEach(() => vi.resetAllMocks());

describe("Backend registration and verification contracts", () => {
  it("accepts bodyless registration and sends exactly the C# request fields", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(undefined);
    await expect(
      authService.register({ ...request, ...{ role: "ADMIN", phone: "untrusted" } }),
    ).resolves.toBeUndefined();
    expect(axiosClient.post).toHaveBeenCalledExactlyOnceWith("/auth/register", request);
  });
  it("propagates registration failures", async () => {
    const failure = new Error("fixture error");
    vi.mocked(axiosClient.post).mockRejectedValue(failure);
    await expect(authService.register(request)).rejects.toBe(failure);
  });
  it("verifies an opaque token and strips unexpected response fields", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      ...user,
      passwordHash: "fixture",
      accessToken: "fixture",
    });
    expect(await authService.verifyEmail("opaque+token/")).toEqual(user);
    expect(axiosClient.post).toHaveBeenCalledExactlyOnceWith("/auth/verify-email", {
      token: "opaque+token/",
    });
  });
  it.each(["", "   ", "x".repeat(257)])("blocks invalid tokens before POST", async (token) => {
    await expect(authService.verifyEmail(token)).rejects.toThrow();
    expect(axiosClient.post).not.toHaveBeenCalled();
  });
  it.each([
    undefined,
    { data: user },
    { ...user, emailVerified: "true" },
    { ...user, role: "OWNER" },
  ])("rejects incompatible successful verification responses", async (body) => {
    vi.mocked(axiosClient.post).mockResolvedValue(body);
    await expect(authService.verifyEmail("fixture-token")).rejects.toThrow();
  });
  it("propagates expired or consumed token failures", async () => {
    const failure = new Error("fixture expired token");
    vi.mocked(axiosClient.post).mockRejectedValue(failure);
    await expect(authService.verifyEmail("fixture-token")).rejects.toBe(failure);
  });
});
