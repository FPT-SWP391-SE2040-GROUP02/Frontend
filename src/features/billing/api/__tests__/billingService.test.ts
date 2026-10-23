import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { billingService } from "../billingService";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("billingService", () => {
  it("đơn đang chờ: 204 (không có nội dung) trả về null, không ném lỗi", async () => {
    const get = vi.spyOn(apiClient, "get");
    get.mockResolvedValueOnce("");
    await expect(billingService.getCurrentOrder()).resolves.toBeNull();
    get.mockResolvedValueOnce(undefined);
    await expect(billingService.getCurrentOrder()).resolves.toBeNull();
  });

  it("chỉ gửi lựa chọn của người dùng, loại bỏ mọi trường thừa như số tiền, loại đơn, vaultId", async () => {
    const post = vi.spyOn(apiClient, "post").mockRejectedValue(new Error("dừng ở đây"));
    await expect(
      billingService.createOrder({
        tier: "XS",
        years: 3,
        extraSlots: 1,
        // Trường ngoài hợp đồng: không được lọt lên máy chủ (SEC-04, PAY-11).
        totalAmount: 1,
        kind: "ADDON",
        vaultId: "x",
      } as never),
    ).rejects.toThrow("dừng ở đây");
    expect(post).toHaveBeenCalledWith("/billing/orders", { tier: "XS", years: 3, extraSlots: 1 });
  });

  it("từ chối lựa chọn ngoài hợp đồng trước khi gọi mạng", async () => {
    const post = vi.spyOn(apiClient, "post");
    await expect(billingService.quote({ extraSlots: 21 })).rejects.toThrow();
    await expect(
      billingService.quote({ tier: "XS", years: 2 as never, extraSlots: 0 }),
    ).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });

  it("từ chối id đơn không phải UUID thay vì ghép vào đường dẫn", async () => {
    const get = vi.spyOn(apiClient, "get");
    await expect(billingService.getOrder("../admin")).rejects.toThrow();
    expect(get).not.toHaveBeenCalled();
  });

  it("từ chối phản hồi sai hợp đồng (thiếu mã thanh toán)", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10" });
    await expect(billingService.getOrder("0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10")).rejects.toThrow();
  });
});
