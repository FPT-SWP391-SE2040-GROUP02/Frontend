import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AxiosError, AxiosHeaders } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { isDemoClockEnabled, useServerNow, useServerOffsetMs } from "../useServerNow";

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  client.clear();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function status(offsetSeconds: number) {
  const real = new Date();
  const system = new Date(real.getTime() + offsetSeconds * 1000);
  return {
    nowUtc: system.toISOString(),
    realNowUtc: real.toISOString(),
    offsetSeconds,
    isSimulated: offsetSeconds !== 0,
  };
}

describe("useServerNow", () => {
  it("không giả lập: trả giờ của trình duyệt", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(status(0));
    const before = Date.now();
    const { result } = renderHook(() => useServerNow(), { wrapper });

    await waitFor(() => expect(get).toHaveBeenCalledWith("/dev/clock", expect.anything()));
    const after = Date.now();
    expect(result.current.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.current.getTime()).toBeLessThanOrEqual(after + 50);
  });

  it("đang giả lập: cộng độ lệch Backend báo", async () => {
    const thirtyDays = 30 * 24 * 60 * 60;
    vi.spyOn(apiClient, "get").mockResolvedValue(status(thirtyDays));
    const before = Date.now();
    const { result } = renderHook(() => useServerNow(), { wrapper });

    await waitFor(() =>
      expect(result.current.getTime() - before).toBeGreaterThan(thirtyDays * 1000 - 1000),
    );
    expect(result.current.getTime() - before).toBeLessThan(thirtyDays * 1000 + 5000);
  });

  it("Backend trả 404: coi như không giả lập, không báo lỗi", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(
      new AxiosError("not found", undefined, undefined, undefined, {
        status: 404,
        statusText: "Not Found",
        config: { headers: new AxiosHeaders() },
        headers: {},
        data: {},
      }),
    );
    const before = Date.now();
    const { result } = renderHook(() => ({ now: useServerNow(), offset: useServerOffsetMs() }), {
      wrapper,
    });

    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(result.current.offset).toBe(0);
    expect(result.current.now.getTime() - before).toBeLessThan(5000);
  });

  it("cờ dev tắt (bản production): không gọi API dev và dùng giờ trình duyệt", async () => {
    vi.stubEnv("DEV", false);
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(status(3600));

    const { result } = renderHook(() => useServerOffsetMs(), { wrapper });

    expect(isDemoClockEnabled()).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(get).not.toHaveBeenCalled();
    expect(result.current).toBe(0);
  });
});
