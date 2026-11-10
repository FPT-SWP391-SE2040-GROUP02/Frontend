import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { DemoClockBanner } from "../DemoClockBanner";

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function status(simulated: boolean) {
  const real = new Date("2026-11-10T03:00:00Z");
  let offsetSeconds = 0;
  if (simulated) {
    offsetSeconds = 30 * 24 * 60 * 60;
  }
  return {
    nowUtc: new Date(real.getTime() + offsetSeconds * 1000).toISOString(),
    realNowUtc: real.toISOString(),
    offsetSeconds,
    isSimulated: simulated,
  };
}

function renderBanner(role: "ADMIN" | "USER" | null) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (role !== null) {
    store.dispatch(
      setCredentials({
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          email: "nguoi-dung@example.test",
          fullName: "Người thử",
          role,
          status: "ACTIVE",
          emailVerified: true,
          hasPassword: false,
          createdAt: "2026-10-15T00:00:00Z",
        },
      }),
    );
  }
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <DemoClockBanner />
      </QueryClientProvider>
    </Provider>,
  );
}

describe("DemoClockBanner", () => {
  it("đang giả lập: hiện dải báo kèm ngày hệ thống đang dùng", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(true));
    renderBanner(null);

    const banner = await screen.findByRole("status");
    expect(banner).toHaveTextContent("Đang giả lập ngày 10/12/2026");
  });

  it("không giả lập: không hiện gì", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(status(false));
    renderBanner(null);

    await waitFor(() => expect(get).toHaveBeenCalled());
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("Backend trả 404: không hiện gì và không báo lỗi", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(
      new AxiosError("not found", undefined, undefined, undefined, {
        status: 404,
        statusText: "Not Found",
        config: { headers: new AxiosHeaders() },
        headers: {},
        data: {},
      }),
    );
    renderBanner("ADMIN");

    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("chỉ Admin đang đăng nhập thấy nút Về ngày thật", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(true));
    renderBanner("USER");
    await screen.findByRole("status");
    expect(screen.queryByRole("button", { name: "Về ngày thật" })).not.toBeInTheDocument();
    cleanup();

    renderBanner(null);
    await screen.findByRole("status");
    expect(screen.queryByRole("button", { name: "Về ngày thật" })).not.toBeInTheDocument();
    cleanup();

    renderBanner("ADMIN");
    expect(await screen.findByRole("button", { name: "Về ngày thật" })).toBeInTheDocument();
  });

  it("Admin bấm Về ngày thật: gọi reset rồi ẩn dải báo", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(true));
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(status(false));
    renderBanner("ADMIN");

    await userEvent.click(await screen.findByRole("button", { name: "Về ngày thật" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith("/dev/clock/reset"));
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("bản production (cờ dev tắt): không gọi API dev, không hiện dải báo", async () => {
    vi.stubEnv("DEV", false);
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(status(true));
    renderBanner("ADMIN");

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(get).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
