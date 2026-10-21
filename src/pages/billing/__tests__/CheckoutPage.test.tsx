import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { CheckoutPage } from "../CheckoutPage";

const ORDER_ID = "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10";
const order = {
  id: ORDER_ID,
  kind: "ADDON",
  status: "PENDING",
  tier: "XS",
  years: null,
  extraSlots: 1,
  tierAmount: 0,
  slotAmount: 24165,
  totalAmount: 24165,
  currency: "VND",
  storageQuotaBytes: 209715200,
  includedBeneficiarySlots: 2,
  paymentCode: "LVABCDEFGH",
  transferContent: "LVABCDEFGH",
  bank: { bankCode: "MBBank", accountNumber: "0000000000", accountName: "LEGACYVAULT TEST" },
  qrImageUrl: "https://qr.sepay.vn/img",
  expiresAt: "2099-10-18T12:15:00+00:00",
  createdAt: "2099-10-18T12:00:00+00:00",
  paidAt: null,
  cancelledAt: null,
  serverTime: "2099-10-18T12:00:00+00:00",
  notice: "Thanh toán không tự kích hoạt bàn giao.",
};

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("checkout-page-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(path: string) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        fullName: "Owner",
        email: "owner@example.test",
        role: "USER",
        status: "ACTIVE",
        createdAt: "2026-10-15T00:00:00Z",
        emailVerified: true,
        hasPassword: false,
      },
    }),
  );
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <CheckoutPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("trang thanh toán", () => {
  it("không có ?order thì theo dõi đơn đang chờ của kho", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(order);
    setup("/billing/checkout");
    expect(await screen.findByRole("img", { name: "Mã QR chuyển khoản" })).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/billing/orders/current", expect.anything());
  });

  it("không có đơn chờ (204) thì mời về chọn gói, không tạo đơn hay QR giả", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    setup("/billing/checkout");
    expect(await screen.findByText(/chưa có đơn nào đang chờ thanh toán/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về gói dịch vụ" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.queryByRole("img", { name: "Mã QR chuyển khoản" })).not.toBeInTheDocument();
  });

  it("?order=<id> hợp lệ thì đọc đúng đơn đó từ Backend", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(order);
    setup(`/billing/checkout?order=${ORDER_ID}`);
    expect(await screen.findByRole("img", { name: "Mã QR chuyển khoản" })).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(`/billing/orders/${ORDER_ID}`, expect.anything());
  });

  it("?order không phải UUID thì bỏ qua và dùng đơn đang chờ, không ghép vào đường dẫn", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue("");
    setup("/billing/checkout?order=../admin");
    await screen.findByText(/chưa có đơn nào đang chờ thanh toán/);
    const urls = get.mock.calls.map((call) => String(call[0]));
    expect(urls).toContain("/billing/orders/current");
    expect(urls.some((url) => url.includes("admin"))).toBe(false);
  });
});
