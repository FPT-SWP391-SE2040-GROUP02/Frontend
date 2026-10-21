import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { billingKeys, orderPollDelay } from "../../model/useBilling";
import type { PaymentOrder } from "../../model/billing.types";
import { OrderCheckout } from "../OrderCheckout";

const ORDER_ID = "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10";

const pendingOrder: PaymentOrder = {
  id: ORDER_ID,
  kind: "PURCHASE",
  status: "PENDING",
  tier: "XS",
  years: 3,
  extraSlots: 1,
  tierAmount: 499000,
  slotAmount: 147000,
  totalAmount: 646000,
  currency: "VND",
  storageQuotaBytes: 209715200,
  includedBeneficiarySlots: 2,
  paymentCode: "LV7K2M9QXA",
  transferContent: "LV7K2M9QXA",
  bank: { bankCode: "MBBank", accountNumber: "0000000000", accountName: "LEGACYVAULT TEST" },
  qrImageUrl: "https://qr.sepay.vn/img?acc=0000000000&bank=MBBank&amount=646000&des=LV7K2M9QXA",
  expiresAt: "2026-10-18T12:15:00+00:00",
  createdAt: "2026-10-18T12:00:00+00:00",
  paidAt: null,
  cancelledAt: null,
  serverTime: "2026-10-18T12:00:01+00:00",
  notice: "Thanh toán không tự kích hoạt bàn giao.",
};

function backendError(status: number, code: string) {
  return new AxiosError("private", undefined, undefined, undefined, {
    status,
    statusText: "Error",
    config: { headers: new AxiosHeaders() },
    headers: {},
    data: { code },
  });
}

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("checkout-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function renderCheckout() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OrderCheckout orderId={ORDER_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("thanh toán đơn đang chờ", () => {
  it("hiện QR, số tiền, nội dung chuyển khoản và thông tin ngân hàng từ Backend", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(pendingOrder);
    renderCheckout();
    expect(await screen.findByRole("img", { name: "Mã QR chuyển khoản" })).toHaveAttribute(
      "src",
      pendingOrder.qrImageUrl,
    );
    expect(screen.getByText(/646\.000/)).toBeInTheDocument();
    expect(screen.getByText("LV7K2M9QXA")).toBeInTheDocument();
    expect(screen.getByText("0000000000")).toBeInTheDocument();
    expect(screen.getByText("MBBank")).toBeInTheDocument();
    expect(screen.getByText("LEGACYVAULT TEST")).toBeInTheDocument();
    expect(screen.getByText(/không tự kích hoạt bàn giao/)).toBeInTheDocument();
  });

  it("đếm ngược theo giờ máy chủ, không theo đồng hồ máy khách", async () => {
    // Đồng hồ máy khách lệch hẳn so với giờ máy chủ; hạn đơn còn đúng 14 phút 59 giây theo máy chủ.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-01-01T00:00:00Z"));
    vi.spyOn(apiClient, "get").mockResolvedValue(pendingOrder);
    renderCheckout();
    expect(await screen.findByRole("timer")).toHaveTextContent("14:59");
  });

  it("hủy đơn phải xác nhận rồi mới gọi API và hiện trạng thái đã hủy", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(pendingOrder);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      ...pendingOrder,
      status: "CANCELLED",
      qrImageUrl: null,
      cancelledAt: "2026-10-18T12:02:00+00:00",
    });
    renderCheckout();
    fireEvent.click(await screen.findByRole("button", { name: "Hủy đơn" }));
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Đồng ý hủy" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(`/billing/orders/${ORDER_ID}/cancel`));
    expect(await screen.findByText(/Đơn đã bị hủy/)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Mã QR chuyển khoản" })).not.toBeInTheDocument();
  });

  it("thanh toán thử (dev) thành công thì hiện đã thanh toán và tải lại thông tin kho", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(pendingOrder);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      ...pendingOrder,
      status: "PAID",
      qrImageUrl: null,
      paidAt: "2026-10-18T12:03:00+00:00",
    });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    renderCheckout();
    fireEvent.click(await screen.findByRole("button", { name: /Thanh toán thử/ }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(`/billing/orders/${ORDER_ID}/dev-pay`));
    expect(await screen.findByText(/Đã thanh toán/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về Kho của tôi" })).toBeInTheDocument();
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["owner-vault"] }));
  });

  it("máy chủ chưa bật thanh toán thử (404) thì nói rõ, đơn vẫn chờ", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(pendingOrder);
    vi.spyOn(apiClient, "post").mockRejectedValue(backendError(404, "PAYMENT_ORDER_NOT_FOUND"));
    renderCheckout();
    fireEvent.click(await screen.findByRole("button", { name: /Thanh toán thử/ }));
    expect(await screen.findByText(/chưa bật thanh toán thử/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Mã QR chuyển khoản" })).toBeInTheDocument();
  });

  it("đơn đổi sang PAID trong lúc đang xem thì màn chuyển sang kết quả", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(pendingOrder);
    renderCheckout();
    await screen.findByRole("img", { name: "Mã QR chuyển khoản" });
    act(() => {
      client.setQueryData(billingKeys.order(ORDER_ID), {
        ...pendingOrder,
        status: "PAID",
        qrImageUrl: null,
        paidAt: "2026-10-18T12:05:00+00:00",
      });
    });
    expect(await screen.findByText(/Quyền dịch vụ của kho đã được cập nhật/)).toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("đơn gia hạn đã trả: ghi rõ hạng và số năm gia hạn", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      ...pendingOrder,
      kind: "RENEWAL",
      status: "PAID",
      qrImageUrl: null,
      paidAt: "2026-10-18T12:03:00+00:00",
    });
    renderCheckout();
    expect(await screen.findByText("Gia hạn gói XS · 3 năm")).toBeInTheDocument();
  });

  it("đơn nâng hạng đã trả: ghi rõ nâng lên XS Max và giữ nguyên hạn", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      ...pendingOrder,
      kind: "UPGRADE",
      tier: "XS_MAX",
      years: null,
      extraSlots: 0,
      tierAmount: 250000,
      slotAmount: 0,
      totalAmount: 250000,
      status: "PAID",
      qrImageUrl: null,
      paidAt: "2026-10-18T12:03:00+00:00",
    });
    renderCheckout();
    expect(
      await screen.findByText(/Nâng hạng lên XS Max \(giữ nguyên hạn dịch vụ\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/250\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Quyền dịch vụ của kho đã được cập nhật/)).toBeInTheDocument();
  });

  it.each([
    ["EXPIRED", /Đơn đã hết hạn/],
    ["CANCELLED", /Đơn đã bị hủy/],
  ] as const)("đơn %s báo rõ và dẫn về gói dịch vụ để tạo đơn mới", async (status, text) => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ ...pendingOrder, status, qrImageUrl: null });
    renderCheckout();
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về gói dịch vụ" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.queryByRole("button", { name: /Thanh toán thử/ })).not.toBeInTheDocument();
  });

  it("không tải được đơn thì cho thử lại, không giả kết quả", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(backendError(404, "PAYMENT_ORDER_NOT_FOUND"));
    renderCheckout();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được đơn thanh toán");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("chu kỳ hỏi lại trạng thái đơn", () => {
  it("chỉ hỏi lại khi đơn còn PENDING và lần đọc trước không lỗi", () => {
    expect(orderPollDelay(undefined, false)).toBe(3000);
    expect(orderPollDelay(pendingOrder, false)).toBe(3000);
    expect(orderPollDelay(pendingOrder, true)).toBe(false);
    expect(orderPollDelay({ ...pendingOrder, status: "PAID" }, false)).toBe(false);
    expect(orderPollDelay({ ...pendingOrder, status: "EXPIRED" }, false)).toBe(false);
    expect(orderPollDelay({ ...pendingOrder, status: "CANCELLED" }, false)).toBe(false);
  });
});
