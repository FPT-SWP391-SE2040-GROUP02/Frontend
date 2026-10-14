import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosClient } from "@/shared/api/axiosClient";
import { authService } from "../authService";

vi.mock("@/shared/api/axiosClient", () => {
  const client = { post: vi.fn(), get: vi.fn() };
  return { axiosClient: client, apiClient: client };
});

beforeEach(() => vi.resetAllMocks());

describe("Backend resend-verification contract", () => {
  it("posts the email to the confirmed route and accepts an empty body", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(undefined);
    await expect(
      authService.resendVerificationEmail("owner@example.test"),
    ).resolves.toBeUndefined();
    expect(axiosClient.post).toHaveBeenCalledExactlyOnceWith("/auth/resend-verification", {
      email: "owner@example.test",
    });
  });

  it("propagates a rejected request instead of reporting acceptance", async () => {
    const failure = new Error("fixture failure");
    vi.mocked(axiosClient.post).mockRejectedValue(failure);
    await expect(authService.resendVerificationEmail("owner@example.test")).rejects.toBe(failure);
  });
});
