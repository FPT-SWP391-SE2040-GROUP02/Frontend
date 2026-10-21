import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { apiClient } from "@/shared/api/axiosClient";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { ownerVaultKeys } from "@/features/vault-management/model/useOwnerVault";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import { billingKeys } from "@/features/billing/model/useBilling";
import type { BillingPlans, BillingQuote } from "@/features/billing/model/billing.types";
import { PricingPlansPage } from "../PricingPlansPage";

vi.mock("@/features/vault-management/api/ownerVaultService", () => ({
  ownerVaultService: { getMine: vi.fn() },
}));

const plansFixture: BillingPlans = {
  policyVersion: "2026-10",
  currency: "VND",
  tiers: [
    {
      tier: "XS",
      storageQuotaBytes: 209715200,
      includedBeneficiarySlots: 2,
      prices: [
        { years: 1, amount: 199000, serviceDays: 365 },
        { years: 3, amount: 499000, serviceDays: 1095 },
        { years: 5, amount: 799000, serviceDays: 1825 },
      ],
    },
    {
      tier: "XS_MAX",
      storageQuotaBytes: 524288000,
      includedBeneficiarySlots: 5,
      prices: [
        { years: 1, amount: 399000, serviceDays: 365 },
        { years: 3, amount: 999000, serviceDays: 1095 },
        { years: 5, amount: 1599000, serviceDays: 1825 },
      ],
    },
  ],
  extraSlot: { pricePerYear: 49000, maxPerOrder: 20 },
  notice: "Thanh toán không tự kích hoạt bàn giao.",
};

const purchaseQuote: BillingQuote = {
  kind: "PURCHASE",
  tier: "XS",
  years: 1,
  extraSlots: 0,
  tierAmount: 199000,
  slotAmount: 0,
  totalAmount: 199000,
  currency: "VND",
  storageQuotaBytes: 209715200,
  includedBeneficiarySlots: 2,
  beneficiarySlots: 2,
  serviceDays: 365,
  serviceStartsAt: "ON_PAYMENT",
  serviceExpiresAt: null,
  policyVersion: "2026-10",
  notice: "Thanh toán không tự kích hoạt bàn giao.",
  serverTime: "2026-10-20T00:00:00Z",
};

const addonQuote: BillingQuote = {
  ...purchaseQuote,
  kind: "ADDON",
  years: null,
  extraSlots: 1,
  tierAmount: 0,
  slotAmount: 24165,
  totalAmount: 24165,
  beneficiarySlots: 3,
  serviceDays: null,
  serviceStartsAt: null,
  serviceExpiresAt: "2099-10-20T00:00:00Z",
};

function backendError(status: number, code: string, reason?: string) {
  return new AxiosError("private", undefined, undefined, undefined, {
    status,
    statusText: "Conflict",
    config: { headers: new AxiosHeaders() },
    headers: {},
    data: { code, reason },
  });
}

let client: QueryClient;

beforeEach(() => {
  vi.resetAllMocks();
  accessTokenMemory.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
});

afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(
  owner = false,
  vaultChanges: Partial<VaultResponse> = {},
  role: "USER" | "ADMIN" | "VERIFIER" = "USER",
) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (owner) {
    store.dispatch(
      setCredentials({
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          fullName: "Pricing fixture",
          email: "pricing@example.test",
          role,
          status: "ACTIVE",
          createdAt: "2026-10-15T00:00:00Z",
          emailVerified: true,
          hasPassword: false,
        },
      }),
    );
    accessTokenMemory.set("pricing-fixture-access");
    client.setQueryData(billingKeys.plans(), plansFixture);
    client.setQueryData(billingKeys.currentOrder(), null);
    client.setQueryData(ownerVaultKeys.mine, {
      ...vaultFixture,
      serviceTier: "XS",
      serviceStatus: "PAID_ACTIVE",
      serviceExpiresAt: "2099-10-20T00:00:00Z",
      beneficiarySlots: 3,
      includedBeneficiarySlots: 2,
      extraBeneficiarySlots: 1,
      ...vaultChanges,
    });
  }
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/pricing"]}>
          <PricingPlansPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

function planCard(name: string) {
  return within(screen.getByRole("heading", { name }).closest("article")!);
}

describe("pricing reference policies", () => {
  it("shows included beneficiary slots without imposing asset-count limits", () => {
    setup();
    expect(screen.queryAllByText(/(?:3|20|50) tài sản/)).toHaveLength(0);
    expect(planCard("Owner Free").getByText("0 người")).toBeInTheDocument();
    expect(planCard("Legacy XS").getByText("2 người")).toBeInTheDocument();
    expect(planCard("Legacy XS Max").getByText("5 người")).toBeInTheDocument();
    expect(planCard("Owner Free").getByText("20 MB")).toBeInTheDocument();
    expect(planCard("Legacy XS").getByText("200 MB")).toBeInTheDocument();
    expect(planCard("Legacy XS Max").getByText("500 MB")).toBeInTheDocument();
    expect(screen.getByText(/Không giới hạn số tài sản theo hạng/)).toBeInTheDocument();
  });

  it("switches reference prices by term and sends guests to login", () => {
    setup();
    expect(
      planCard("Legacy XS").getByText(/199\.000/, { selector: "p.service-plan-price" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "3 năm" }));
    expect(planCard("Legacy XS").getByText(/499\.000/, { selector: "p" })).toBeInTheDocument();
    expect(planCard("Legacy XS Max").getByText(/999\.000/, { selector: "p" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "5 năm" }));
    expect(planCard("Legacy XS").getByText(/799\.000/, { selector: "p" })).toBeInTheDocument();
    expect(
      planCard("Legacy XS Max").getByText(/1\.599\.000/, { selector: "p" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Giá là tổng cho cả kỳ/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mua gói XS" })).toHaveAttribute("href", "/login");
    expect(ownerVaultService.getMine).not.toHaveBeenCalled();
  });

  it("explains add-on limits and expiry as reference information only", () => {
    setup();
    const policy = screen.getByRole("region", { name: "Mua thêm suất người nhận" });
    expect(policy).toHaveTextContent("49.000đ/suất/năm");
    expect(policy).toHaveTextContent("Tối đa 20 suất mỗi đơn");
    expect(policy).toHaveTextContent("hết hạn cùng ngày với gói");
    expect(policy).toHaveTextContent("thời gian còn lại");
    expect(policy).not.toHaveTextContent("Chưa hỗ trợ mua thêm suất");
  });

  it("keeps the current account entitlement from the server separate from the catalog", () => {
    setup(true);
    const current = screen.getByRole("region", { name: "Gói hiện tại của kho" });
    expect(within(current).getByText(/\/ 3 đã dùng/)).toBeInTheDocument();
    expect(planCard("Legacy XS").getByText("2 người")).toBeInTheDocument();
    expect(planCard("Legacy XS").getByText("Gói hiện tại")).toBeInTheDocument();
    expect(ownerVaultService.getMine).not.toHaveBeenCalled();
  });

  it("mua thêm suất: hiện báo giá của Backend và chỉ tạo đơn khi người dùng xác nhận", async () => {
    const post = vi.spyOn(apiClient, "post").mockImplementation((url: string) => {
      if (url === "/billing/quote") return Promise.resolve(addonQuote);
      return Promise.reject(new Error(`không mong đợi ${url}`));
    });
    setup(true);
    expect(screen.getByRole("heading", { level: 1, name: "Gói dịch vụ" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mua thêm suất người nhận" }));
    const panel = screen.getByRole("region", { name: "Mua thêm suất" });
    await waitFor(() => expect(panel).toHaveTextContent("24.165"));
    expect(panel).toHaveTextContent("Tổng thanh toán");
    expect(panel).toHaveTextContent("3 người");
    // Chỉ gửi số suất: không gửi số tiền, hạng, loại đơn hay vaultId (SEC-04, PAY-11).
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe("/billing/quote");
    expect(post.mock.calls[0][1]).toEqual({ extraSlots: 1 });
    fireEvent.click(within(panel).getByRole("button", { name: "Đóng khung mua" }));
    expect(screen.queryByRole("region", { name: "Mua thêm suất" })).not.toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("đổi số suất mua thêm thì báo giá lại và giữ trong giới hạn của Backend", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ ...addonQuote, extraSlots: 5, slotAmount: 120825, totalAmount: 120825 });
    setup(true);
    fireEvent.click(screen.getByRole("button", { name: "Mua thêm suất người nhận" }));
    const input = await screen.findByLabelText(/Suất người nhận mua thêm/);
    fireEvent.change(input, { target: { value: "5" } });
    await waitFor(() =>
      expect(post).toHaveBeenLastCalledWith("/billing/quote", { extraSlots: 5 }, expect.anything()),
    );
    fireEvent.change(input, { target: { value: "99" } });
    expect(input).toHaveValue(20);
    fireEvent.change(input, { target: { value: "0" } });
    expect(input).toHaveValue(1);
  });

  it("kho XS Max không hạ hạng giữa kỳ, nút bị khóa và nói rõ", () => {
    setup(true, { serviceTier: "XS_MAX" });
    expect(
      planCard("Legacy XS").getByRole("button", { name: "Chưa hỗ trợ hạ hạng" }),
    ).toBeDisabled();
    expect(planCard("Legacy XS").getByText(/chưa hỗ trợ hạ hạng giữa kỳ/)).toBeInTheDocument();
  });

  it("kho XS còn hạn: thẻ XS Max có nút Nâng lên XS Max, không còn chữ đợi hết kỳ", () => {
    setup(true);
    expect(
      planCard("Legacy XS Max").getByRole("button", { name: "Nâng lên XS Max" }),
    ).toBeEnabled();
    expect(screen.queryByText(/Đổi hạng khi hết kỳ/)).not.toBeInTheDocument();
    expect(
      planCard("Legacy XS Max").getByText(/Chỉ trả phần chênh theo thời gian còn lại/),
    ).toBeInTheDocument();
  });

  it("nâng hạng: báo giá của Backend, không có ô chọn năm hay suất, chỉ tạo đơn khi xác nhận", async () => {
    const upgradeQuote: BillingQuote = {
      ...addonQuote,
      kind: "UPGRADE",
      tier: "XS_MAX",
      extraSlots: 0,
      tierAmount: 250000,
      slotAmount: 0,
      totalAmount: 250000,
      storageQuotaBytes: 524288000,
      includedBeneficiarySlots: 5,
      beneficiarySlots: 6,
    };
    const post = vi.spyOn(apiClient, "post").mockImplementation((url: string) => {
      if (url === "/billing/quote") return Promise.resolve(upgradeQuote);
      return Promise.reject(new Error("dừng ở đây"));
    });
    setup(true);
    fireEvent.click(planCard("Legacy XS Max").getByRole("button", { name: "Nâng lên XS Max" }));
    const panel = screen.getByRole("region", { name: "Nâng lên Legacy XS Max" });
    await waitFor(() => expect(panel).toHaveTextContent("250.000"));
    expect(panel).toHaveTextContent("Phần chênh nâng lên Legacy XS Max");
    expect(panel).toHaveTextContent("500 MB");
    expect(panel).toHaveTextContent("6 người");
    expect(within(panel).queryByLabelText(/Suất người nhận mua thêm/)).not.toBeInTheDocument();
    expect(within(panel).queryByRole("group", { name: "Chọn kỳ dịch vụ" })).not.toBeInTheDocument();
    // Chỉ gửi hạng đích và số suất 0: không gửi số tiền hay số năm (SEC-04, PAY-11).
    expect(post.mock.calls[0][0]).toBe("/billing/quote");
    expect(post.mock.calls[0][1]).toEqual({ tier: "XS_MAX", extraSlots: 0 });
    expect(post).toHaveBeenCalledTimes(1);
    fireEvent.click(within(panel).getByRole("button", { name: "Tạo đơn nâng hạng" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/billing/orders", { tier: "XS_MAX", extraSlots: 0 }),
    );
  });

  it("giá của Owner lấy từ Backend, không phải bảng tĩnh", async () => {
    setup(true);
    act(() => {
      client.setQueryData(billingKeys.plans(), {
        ...plansFixture,
        tiers: [
          { ...plansFixture.tiers[0], prices: [{ years: 1, amount: 211000, serviceDays: 365 }] },
          plansFixture.tiers[1],
        ],
      });
    });
    await waitFor(() =>
      expect(
        planCard("Legacy XS").getByText(/211\.000/, { selector: "p.service-plan-price" }),
      ).toBeInTheDocument(),
    );
  });

  it("hết kỳ khi đang mở khung mua thêm thì đóng khung và bỏ nút mua thêm", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValue(addonQuote);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T00:00:00Z"));
    try {
      setup(true, { serviceExpiresAt: "2026-10-20T00:00:01Z" });
      fireEvent.click(screen.getByRole("button", { name: "Mua thêm suất người nhận" }));
      expect(screen.getByRole("region", { name: "Mua thêm suất" })).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1001));
      expect(screen.queryByRole("region", { name: "Mua thêm suất" })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Mua thêm suất người nhận" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Gói hiện tại của kho" })).toHaveTextContent(
        "Đã hết hạn dịch vụ",
      );
    } finally {
      cleanup();
      vi.useRealTimers();
    }
  });

  it.each(["ADMIN", "VERIFIER"] as const)(
    "keeps %s out of owner queries and purchase previews",
    (role) => {
      setup(true, {}, role);
      expect(ownerVaultService.getMine).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("region", { name: "Gói hiện tại của kho" }),
      ).not.toBeInTheDocument();
      for (const button of screen.getAllByRole("button", { name: "Gói dành cho chủ kho" }))
        expect(button).toBeDisabled();
    },
  );

  it("kho Free mua gói: báo giá từ Backend, kỳ bắt đầu khi thanh toán, tạo đơn mới gọi /billing/orders", async () => {
    const post = vi.spyOn(apiClient, "post").mockImplementation((url: string) => {
      if (url === "/billing/quote") return Promise.resolve(purchaseQuote);
      return Promise.reject(new Error("dừng ở đây"));
    });
    setup(true, {
      serviceTier: "FREE",
      serviceStatus: "FREE",
      serviceExpiresAt: null,
      extraBeneficiarySlots: 0,
    });
    fireEvent.click(screen.getByRole("button", { name: "Mua gói XS" }));
    const panel = screen.getByRole("region", { name: "Mua Legacy XS" });
    await waitFor(() => expect(panel).toHaveTextContent("199.000"));
    expect(panel).toHaveTextContent("Từ lúc thanh toán thành công");
    expect(panel).not.toHaveTextContent("2099");
    expect(post.mock.calls[0][1]).toEqual({ tier: "XS", years: 1, extraSlots: 0 });
    fireEvent.click(within(panel).getByRole("button", { name: "Tạo đơn và thanh toán" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/billing/orders", {
        tier: "XS",
        years: 1,
        extraSlots: 0,
      }),
    );
  });

  it("báo giá bị từ chối vì chưa eKYC thì nói rõ bằng tiếng Việt và khóa nút tạo đơn", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(
      backendError(409, "PAYMENT_NOT_ALLOWED", "OWNER_EKYC_REQUIRED"),
    );
    setup(true, {
      serviceTier: "FREE",
      serviceStatus: "FREE",
      serviceExpiresAt: null,
      extraBeneficiarySlots: 0,
    });
    fireEvent.click(screen.getByRole("button", { name: "Mua gói XS" }));
    const panel = screen.getByRole("region", { name: "Mua Legacy XS" });
    expect(await within(panel).findByRole("alert")).toHaveTextContent("xác minh danh tính eKYC");
    expect(within(panel).getByRole("button", { name: "Tạo đơn và thanh toán" })).toBeDisabled();
  });

  it("đang có đơn chờ thì nhắc tiếp tục thanh toán", async () => {
    setup(true);
    act(() => {
      client.setQueryData(billingKeys.currentOrder(), {
        id: "22222222-2222-4222-8222-222222222222",
      });
    });
    expect(await screen.findByRole("link", { name: "Tiếp tục thanh toán" })).toHaveAttribute(
      "href",
      "/billing/checkout?order=22222222-2222-4222-8222-222222222222",
    );
  });

  it.each(["CLOSED", "DEATH_CASE_OPEN", "HANDOVER_IN_PROGRESS", "BLOCKED"])(
    "does not offer payment actions for locked state %s",
    (locked) => {
      setup(true, locked === "CLOSED" ? { status: "CLOSED" } : { planStatus: locked });
      expect(
        screen.queryByRole("button", { name: "Mua thêm suất người nhận" }),
      ).not.toBeInTheDocument();
    },
  );
});
