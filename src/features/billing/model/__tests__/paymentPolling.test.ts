import { createElement, type ReactNode } from "react";
import { cleanup, renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { billingService } from "../../api/billingService";
import { usePollPaymentStatus } from "../useBilling";
vi.mock("../../api/billingService", () => ({ billingService: { checkPaymentStatus: vi.fn() } }));
let client: QueryClient;
/** @description Cấp QueryClient riêng cho mỗi test polling. */
function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client }, children);
}
/** @description Cho request và timers của Query hoàn tất trong act. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
beforeEach(() => {
  vi.useFakeTimers();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(billingService.checkPaymentStatus).mockReset();
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.useRealTimers();
});
describe("payment polling", () => {
  it.each(["PAID", "CANCELLED", "EXPIRED"])("dừng sau trạng thái %s", async (status) => {
    vi.mocked(billingService.checkPaymentStatus).mockResolvedValue({
      isPaid: status === "PAID",
      status,
    });
    renderHook(() => usePollPaymentStatus("order-1"), { wrapper });
    await advance(1);
    await advance(10000);
    expect(billingService.checkPaymentStatus).toHaveBeenCalledTimes(1);
  });
  it("dừng khi request thất bại, không tự retry", async () => {
    vi.mocked(billingService.checkPaymentStatus).mockRejectedValue(new Error("offline"));
    renderHook(() => usePollPaymentStatus("order-1"), { wrapper });
    await advance(1);
    await advance(10000);
    expect(billingService.checkPaymentStatus).toHaveBeenCalledTimes(1);
  });
  it("không gửi request khi modal đóng hoặc đơn hết hạn", async () => {
    renderHook(() => usePollPaymentStatus("closed", false), { wrapper });
    renderHook(
      () => usePollPaymentStatus("expired", true, new Date(Date.now() - 1000).toISOString()),
      { wrapper },
    );
    await advance(10000);
    expect(billingService.checkPaymentStatus).not.toHaveBeenCalled();
  });
  it("tiếp tục polling khi PENDING", async () => {
    vi.mocked(billingService.checkPaymentStatus).mockResolvedValue({
      isPaid: false,
      status: "PENDING",
    });
    renderHook(() => usePollPaymentStatus("order-1"), { wrapper });
    await advance(1);
    await advance(6000);
    expect(vi.mocked(billingService.checkPaymentStatus).mock.calls.length).toBeGreaterThan(1);
  });
});
