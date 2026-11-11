import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { CREATED_AT, VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { ROUTES } from "@/shared/config/routes.config";
import { AdminWorkspacePage } from "@/pages/admin/AdminWorkspacePage";
import { ADMIN_INCIDENTS_VISIBLE } from "@/features/admin/model/admin.content";

/**
 * Hai việc của Admin: thống kê doanh thu theo ngày, tháng, quý trên trang Giao dịch (chỉ tiền thật đã khớp đơn mặc định),
 * và mục Sự cố đang ẩn khỏi menu, trang Tổng quan và đường dẫn ?view=incidents.
 */

interface Call {
  url: string;
  params: Record<string, unknown> | undefined;
}
const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;
let calls: Call[];

const emptyPage = {
  items: [],
  totalCount: 0,
  pageIndex: 1,
  pageSize: 20,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

const revenueBody = {
  groupBy: "month",
  environment: "Live",
  totalAmount: 248000,
  transactionCount: 2,
  currency: "VND",
  buckets: [
    { key: "2026-10", label: "10/2026", amount: 49000, count: 1 },
    { key: "2026-11", label: "11/2026", amount: 199000, count: 1 },
  ],
};

/** Giả lập Backend: doanh thu và danh sách giao dịch trả dữ liệu mẫu, mọi đường khác báo lỗi 500. */
function backend() {
  calls = [];
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    calls.push({ url, params: config.params as Record<string, unknown> | undefined });
    let data: unknown;
    if (url === "/admin/payment-transactions/revenue") {
      data = revenueBody;
    } else if (url === "/admin/payment-transactions") {
      data = emptyPage;
    } else {
      throw new AxiosError("fail", "ERR_BAD_REQUEST", config, undefined, {
        config,
        data: {},
        status: 500,
        statusText: "Error",
        headers: new AxiosHeaders(),
      });
    }
    return {
      config,
      data,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    } satisfies AxiosResponse;
  };
}
const callsTo = (url: string) => calls.filter((call) => call.url === url);

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("admin-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

function setup(path: string) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: VAULT_ID,
        email: "admin@example.test",
        fullName: "Quản trị",
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: false,
        createdAt: CREATED_AT,
      },
    }),
  );
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.ADMIN.ROOT} element={<AdminWorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("doanh thu của Admin", () => {
  it("mặc định hiện tổng tiền thật theo tháng, kèm từng kỳ", async () => {
    backend();
    setup(`${ROUTES.ADMIN.ROOT}?view=payments`);

    expect(await screen.findByText("10/2026")).toBeInTheDocument();
    expect(screen.getByText("11/2026")).toBeInTheDocument();
    expect(screen.getByText(/từ 2 giao dịch/)).toBeInTheDocument();
    expect(callsTo("/admin/payment-transactions/revenue").at(-1)?.params).toMatchObject({
      groupBy: "month",
      environment: "Live",
    });
  });

  it("đổi sang theo quý và gộp cả môi trường thử nghiệm thì gửi đúng tham số", async () => {
    backend();
    setup(`${ROUTES.ADMIN.ROOT}?view=payments`);
    await screen.findByText("10/2026");

    fireEvent.click(screen.getByRole("button", { name: "Theo quý" }));
    await waitFor(() =>
      expect(callsTo("/admin/payment-transactions/revenue").at(-1)?.params).toMatchObject({
        groupBy: "quarter",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Tất cả" }));
    await waitFor(() =>
      expect(callsTo("/admin/payment-transactions/revenue").at(-1)?.params).toMatchObject({
        groupBy: "quarter",
        environment: "ALL",
      }),
    );
  });

  it("khoảng ngày của bộ lọc trang Giao dịch được dùng cho doanh thu", async () => {
    backend();
    setup(`${ROUTES.ADMIN.ROOT}?view=payments&pfrom=2026-11-01&pto=2026-11-30`);

    await screen.findByText("10/2026");
    expect(callsTo("/admin/payment-transactions/revenue").at(-1)?.params).toMatchObject({
      from: "2026-11-01",
      to: "2026-11-30",
    });
  });
});

describe("mục Sự cố đang ẩn", () => {
  it("cờ ẩn đang bật mặc định", () => {
    expect(ADMIN_INCIDENTS_VISIBLE).toBe(false);
  });

  it("menu không có Sự cố và không gọi API sự cố ở trang Tổng quan", async () => {
    backend();
    setup(ROUTES.ADMIN.ROOT);

    await screen.findAllByRole("link", { name: /Giao dịch/ });
    expect(screen.queryByRole("link", { name: /^Sự cố/ })).not.toBeInTheDocument();
    expect(callsTo("/admin/incidents")).toHaveLength(0);
  });

  it("mở thẳng ?view=incidents thì không hiện màn Sự cố và không gọi danh sách sự cố", async () => {
    backend();
    setup(`${ROUTES.ADMIN.ROOT}?view=incidents`);

    await screen.findAllByRole("link", { name: /Giao dịch/ });
    expect(screen.queryByRole("heading", { name: "Sự cố" })).not.toBeInTheDocument();
    expect(callsTo("/admin/incidents")).toHaveLength(0);
  });
});
