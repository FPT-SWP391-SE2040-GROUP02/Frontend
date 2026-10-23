import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { PaymentOrderSummary } from "../../model/billing.types";
import { describeOrder } from "../../model/orderLabels";
import { OrderHistory } from "../OrderHistory";

const base: PaymentOrderSummary = {
  id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10",
  kind: "PURCHASE",
  status: "PAID",
  tier: "XS",
  years: 3,
  extraSlots: 0,
  totalAmount: 499000,
  currency: "VND",
  paymentCode: "LV7K2M9QXA",
  createdAt: "2026-10-08T08:00:00+00:00",
  expiresAt: "2026-10-08T08:15:00+00:00",
  paidAt: "2026-10-08T08:05:00+00:00",
  cancelledAt: null,
};

function page(items: PaymentOrderSummary[], overrides: Record<string, unknown> = {}) {
  return {
    items,
    totalCount: items.length,
    pageIndex: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    ...overrides,
  };
}

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("history-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderHistory() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OrderHistory />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("lịch sử thanh toán", () => {
  it("hiện từng đơn: mã, ngày, nội dung, số tiền, trạng thái và nút Xem", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(
      page([
        base,
        {
          ...base,
          id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a11",
          kind: "ADDON",
          status: "PENDING",
          years: null,
          extraSlots: 2,
          totalAmount: 24165,
          paymentCode: "LVPENDING1",
          paidAt: null,
        },
        {
          ...base,
          id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a12",
          status: "EXPIRED",
          paymentCode: "LVEXPIRED1",
          paidAt: null,
        },
        {
          ...base,
          id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a13",
          status: "CANCELLED",
          paymentCode: "LVCANCELL1",
          paidAt: null,
          cancelledAt: "2026-10-08T08:02:00+00:00",
        },
      ]),
    );
    renderHistory();
    expect(await screen.findByText("LV7K2M9QXA")).toBeInTheDocument();
    // Gọi đúng API, mới nhất trước.
    expect(get).toHaveBeenCalledWith(
      "/billing/orders",
      expect.objectContaining({
        params: { pageIndex: 1, pageSize: 10, sortBy: "createdAt", isAscending: false },
      }),
    );
    const paidRow = screen.getByText("LV7K2M9QXA").closest("tr") as HTMLElement;
    expect(paidRow).toHaveTextContent("08/10/2026");
    expect(paidRow).toHaveTextContent("Mua gói XS · 3 năm");
    expect(paidRow).toHaveTextContent("499.000");
    expect(paidRow).toHaveTextContent("Đã thanh toán");
    expect(within(paidRow).getByRole("link", { name: "Xem đơn LV7K2M9QXA" })).toHaveAttribute(
      "href",
      "/billing/checkout?order=0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10",
    );
    expect(screen.getByText("LVPENDING1").closest("tr")).toHaveTextContent("Đang chờ thanh toán");
    expect(screen.getByText("LVPENDING1").closest("tr")).toHaveTextContent(
      "Mua thêm 2 suất người nhận",
    );
    expect(screen.getByText("LVEXPIRED1").closest("tr")).toHaveTextContent("Hết hạn");
    expect(screen.getByText("LVCANCELL1").closest("tr")).toHaveTextContent("Đã hủy");
    expect(screen.getByText(/LegacyVault không lưu số thẻ/)).toBeInTheDocument();
  });

  it("chưa có đơn: nói rõ và mời xem các gói, không hiện bảng giả", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(page([]));
    renderHistory();
    expect(await screen.findByText("Bạn chưa có đơn thanh toán nào.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem các gói" })).toHaveAttribute("href", "/pricing");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("lỗi tải: báo lỗi và cho thử lại", async () => {
    const get = vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("hỏng"));
    renderHistory();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được lịch sử thanh toán");
    get.mockResolvedValueOnce(page([base]));
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("LV7K2M9QXA")).toBeInTheDocument();
  });

  it("nhiều trang: có phân trang và gọi đúng trang kế", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce(page([base], { totalCount: 12, totalPages: 2, hasNextPage: true }))
      .mockResolvedValueOnce(
        page([{ ...base, paymentCode: "LVPAGETWO1" }], {
          totalCount: 12,
          totalPages: 2,
          pageIndex: 2,
          hasPreviousPage: true,
        }),
      );
    renderHistory();
    await screen.findByText("LV7K2M9QXA");
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(await screen.findByText("LVPAGETWO1")).toBeInTheDocument();
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        "/billing/orders",
        expect.objectContaining({ params: expect.objectContaining({ pageIndex: 2 }) }),
      ),
    );
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeDisabled();
  });

  it("từ chối phản hồi sai hợp đồng thay vì hiện dữ liệu hỏng", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ items: [{ id: "x" }] });
    renderHistory();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được lịch sử thanh toán");
  });
});

describe("mô tả nội dung đơn", () => {
  it.each([
    [{ ...base }, "Mua gói XS · 3 năm"],
    [{ ...base, extraSlots: 2 }, "Mua gói XS · 3 năm + 2 suất"],
    [
      { ...base, kind: "RENEWAL" as const, tier: "XS_MAX" as const, years: 1 },
      "Gia hạn gói XS Max · 1 năm",
    ],
    [
      { ...base, kind: "UPGRADE" as const, tier: "XS_MAX" as const, years: null },
      "Nâng lên XS Max",
    ],
    [{ ...base, kind: "ADDON" as const, years: null, extraSlots: 1 }, "Mua thêm 1 suất người nhận"],
  ])("đơn %#", (order, expected) => {
    expect(describeOrder(order)).toBe(expected);
  });
});
