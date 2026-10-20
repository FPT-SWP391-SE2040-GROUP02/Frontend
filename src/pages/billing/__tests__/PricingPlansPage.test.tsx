import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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
});

function setup(owner = false) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (owner) {
    store.dispatch(
      setCredentials({
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          fullName: "Pricing fixture",
          email: "pricing@example.test",
          role: "USER",
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
    expect(screen.getByText(/Không giới hạn số tài sản theo hạng/)).toBeInTheDocument();
  });

  it("shows total reference prices for all paid terms without a purchase action", () => {
    setup();
    for (const name of ["Legacy XS", "Legacy XS Max"]) {
      const card = planCard(name);
      for (const years of [1, 3, 5]) {
        expect(card.getByText(`${years} năm`)).toBeInTheDocument();
      }
    }
    for (const price of [/199\.000/, /499\.000/, /799\.000/]) {
      expect(planCard("Legacy XS").getByText(price)).toBeInTheDocument();
    }
    for (const price of [/399\.000/, /999\.000/, /1\.599\.000/]) {
      expect(planCard("Legacy XS Max").getByText(price)).toBeInTheDocument();
    }
    expect(screen.getByText(/Giá là tổng cho cả kỳ/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mua|thanh toán/i })).not.toBeInTheDocument();
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
    expect(within(current).getByText("3")).toBeInTheDocument();
    expect(planCard("Legacy XS").getByText("2 người")).toBeInTheDocument();
    expect(planCard("Legacy XS").getByText("Gói hiện tại")).toBeInTheDocument();
    expect(ownerVaultService.getMine).not.toHaveBeenCalled();
  });
});
