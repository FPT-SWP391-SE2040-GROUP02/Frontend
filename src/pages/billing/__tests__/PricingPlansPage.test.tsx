import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
import { PricingPlansPage } from "../PricingPlansPage";

vi.mock("@/features/vault-management/api/ownerVaultService", () => ({
  ownerVaultService: { getMine: vi.fn() },
}));

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
    expect(policy).toHaveTextContent("Chưa hỗ trợ mua thêm suất trên hệ thống");
  });

  it("keeps the current account entitlement from the server separate from the catalog", () => {
    setup(true);
    const current = screen.getByRole("region", { name: "Gói hiện tại của kho" });
    expect(within(current).getByText(/\/ 3 đã dùng/)).toBeInTheDocument();
    expect(planCard("Legacy XS").getByText("2 người")).toBeInTheDocument();
    expect(planCard("Legacy XS").getByText("Gói hiện tại")).toBeInTheDocument();
    expect(ownerVaultService.getMine).not.toHaveBeenCalled();
  });

  it("opens renewal inline, retains add-on slots, and never creates a payment order", () => {
    const post = vi.spyOn(apiClient, "post");
    setup(true);
    expect(screen.getByRole("heading", { level: 1, name: "Gói dịch vụ" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Đường dẫn trang" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gia hạn Legacy XS" }));
    const preview = screen.getByRole("region", { name: "Gia hạn Legacy XS" });
    fireEvent.click(within(preview).getByRole("button", { name: "3 năm" }));
    expect(preview).toHaveTextContent("1 suất, giữ nguyên");
    expect(preview).toHaveTextContent("147.000");
    expect(preview).toHaveTextContent("646.000");
    fireEvent.click(within(preview).getByRole("button", { name: "Tạo đơn và thanh toán" }));
    expect(screen.getByRole("status")).toHaveTextContent("Thanh toán chưa khả dụng");
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(within(preview).getByRole("button", { name: "Đóng xem trước" }));
    expect(screen.queryByRole("region", { name: "Gia hạn Legacy XS" })).not.toBeInTheDocument();
  });

  it("blocks changing tier mid-term and explains the add-on purchase is unavailable", () => {
    setup(true);
    expect(
      planCard("Legacy XS Max").getByRole("button", { name: "Đổi hạng khi hết kỳ" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Mua thêm suất người nhận" }));
    expect(screen.getByRole("status")).toHaveTextContent("Chưa hỗ trợ mua thêm suất trên hệ thống");
  });

  it("updates the preview and add-on action when the current period expires while open", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T00:00:00Z"));
    try {
      setup(true, { serviceExpiresAt: "2026-10-20T00:00:01Z" });
      fireEvent.click(screen.getByRole("button", { name: "Gia hạn Legacy XS" }));
      act(() => vi.advanceTimersByTime(1001));
      expect(
        screen.queryByRole("button", { name: "Mua thêm suất người nhận" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Gói hiện tại của kho" })).toHaveTextContent(
        "Đã hết hạn dịch vụ",
      );
      expect(screen.getByRole("region", { name: "Gia hạn Legacy XS" })).toHaveTextContent(
        "Từ lúc thanh toán thành công",
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

  it("allows a Free owner to preview buying, without inventing a service start date", () => {
    setup(true, {
      serviceTier: "FREE",
      serviceStatus: "FREE",
      serviceExpiresAt: null,
      extraBeneficiarySlots: 0,
    });
    fireEvent.click(screen.getByRole("button", { name: "Mua gói XS" }));
    const preview = screen.getByRole("region", { name: "Mua Legacy XS" });
    expect(preview).toHaveTextContent("Từ lúc thanh toán thành công");
    expect(preview).toHaveTextContent("Hệ thống xác nhận khi tạo đơn");
    expect(preview).not.toHaveTextContent("2099");
  });

  it.each(["CLOSED", "DEATH_CASE_OPEN", "HANDOVER_IN_PROGRESS", "BLOCKED"])(
    "does not offer payment actions for locked state %s",
    (locked) => {
      setup(true, locked === "CLOSED" ? { status: "CLOSED" } : { planStatus: locked });
      expect(screen.queryByRole("button", { name: "Gia hạn Legacy XS" })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Mua thêm suất người nhận" }),
      ).not.toBeInTheDocument();
    },
  );
});
