import { afterEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { apiClient } from "../axiosClient";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";

afterEach(() => vi.restoreAllMocks());

describe("HTTP error logging", () => {
  it("logs a safe server message without response data or request credentials", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new AxiosError("private exception");
    const request = apiClient.get("/logging-fixture", {
      /** Simulate a response containing secrets without making a network request. */
      adapter: async (config) => {
        failure.config = config;
        failure.response = {
          data: {
            accessToken: "private-token",
            password: "private-password",
            stack: "private-stack",
          },
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          statusText: "Internal Server Error",
          headers: {},
          config,
        };
        throw failure;
      },
    });
    await expect(request).rejects.toBe(failure);
    expect(log).toHaveBeenCalledExactlyOnceWith(
      `[API ${HTTP_STATUS.INTERNAL_SERVER_ERROR}]`,
      APP_MESSAGES.ERROR.SERVER,
    );
  });

  it.each([AxiosError.ERR_NETWORK, AxiosError.ETIMEDOUT])(
    "does not log arbitrary exception details for %s",
    async (code) => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      const failure = new AxiosError("private token in exception details", code);
      await expect(
        apiClient.get("/logging-fixture", {
          /** Simulate an unavailable transport without making a network request. */
          adapter: async () => {
            throw failure;
          },
        }),
      ).rejects.toBe(failure);
      expect(log).toHaveBeenCalledExactlyOnceWith(
        "[API Network Error]",
        APP_MESSAGES.ERROR.NETWORK,
      );
    },
  );

  it("does not report a cancelled request as a network error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const controller = new AbortController();
    const request = apiClient.get("/logging-fixture", {
      signal: controller.signal,
      adapter: async () => new Promise(() => {}),
    });
    controller.abort();
    await expect(request).rejects.toMatchObject({ code: AxiosError.ERR_CANCELED });
    expect(log).not.toHaveBeenCalled();
  });
});
