import { afterEach, describe, expect, it, vi } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { accessTokenMemory } from "../accessToken";
import { apiClient } from "../axiosClient";
import { ENV } from "@/shared/config/env";

/** Token giả, chỉ dùng kiểm tra transport. */
const TEST_ACCESS_TOKEN = "transport-test-token";

/**
 * @description Thu request sau interceptor bằng adapter cục bộ, không gọi mạng.
 * @param url URL yêu cầu kiểm tra.
 * @returns Config request đã được interceptor xử lý.
 */
async function captureRequest(url: string): Promise<InternalAxiosRequestConfig> {
  let captured: InternalAxiosRequestConfig | undefined;
  await apiClient.get(url, {
    /** Adapter trả thành công để kiểm tra header mà không gọi BE. */
    adapter: async (config) => {
      captured = config;
      return { data: null, status: 200, statusText: "OK", headers: {}, config };
    },
  });
  if (!captured) throw new Error("Request adapter was not called");
  return captured;
}

afterEach(() => {
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("RAM Bearer transport", () => {
  it("sends no authorization before a token is supplied", async () => {
    expect(accessTokenMemory.get()).toBeNull();
    expect((await captureRequest("/vaults/me")).headers.get("Authorization")).toBeUndefined();
  });

  it("attaches and replaces the RAM token without browser persistence", async () => {
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");
    const cookieWrite = vi.spyOn(document, "cookie", "set");
    accessTokenMemory.set(TEST_ACCESS_TOKEN);
    expect((await captureRequest("/vaults/me")).headers.get("Authorization")).toBe(
      `Bearer ${TEST_ACCESS_TOKEN}`,
    );
    accessTokenMemory.set("rotated-test-token");
    expect((await captureRequest("/vaults/me")).headers.get("Authorization")).toBe(
      "Bearer rotated-test-token",
    );
    expect(storageWrite).not.toHaveBeenCalled();
    expect(cookieWrite).not.toHaveBeenCalled();
  });

  it("stops attaching a token after it is cleared", async () => {
    accessTokenMemory.set(TEST_ACCESS_TOKEN);
    accessTokenMemory.clear();
    expect(accessTokenMemory.get()).toBeNull();
    expect((await captureRequest("/vaults/me")).headers.get("Authorization")).toBeUndefined();
  });

  it("does not send the RAM token to a different origin", async () => {
    accessTokenMemory.set(TEST_ACCESS_TOKEN);
    expect(
      (await captureRequest("https://files.example.invalid/api/v1/file")).headers.get(
        "Authorization",
      ),
    ).toBeUndefined();
  });

  it("does not send the RAM token outside the API path on the same origin", async () => {
    accessTokenMemory.set(TEST_ACCESS_TOKEN);
    const apiUrl = new URL(ENV.API_BASE_URL, window.location.origin);
    const outsideApi = new URL("/downloads/file", apiUrl);
    expect((await captureRequest(outsideApi.href)).headers.get("Authorization")).toBeUndefined();
  });

  it("rejects a path that only shares the API prefix", async () => {
    accessTokenMemory.set(TEST_ACCESS_TOKEN);
    const apiUrl = new URL(ENV.API_BASE_URL, window.location.origin);
    apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, "")}-external/file`;
    expect((await captureRequest(apiUrl.href)).headers.get("Authorization")).toBeUndefined();
  });
});
