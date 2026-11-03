import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { backendAssetService } from "@/features/assets/api/backendAssetService";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerSection } from "../OwnerSection";

vi.mock("@/features/vault-management/api/ownerVaultService", () => ({
  ownerVaultService: { getMine: vi.fn(), listPackages: vi.fn() },
}));
vi.mock("@/features/assets/api/backendAssetService", () => ({
  backendAssetService: { list: vi.fn() },
}));
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("resource-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
});
function setup() {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "resource@example.test",
        fullName: "Resource fixture",
        role: "USER",
        status: "ACTIVE",
        createdAt: "2026-10-15T00:00:00Z",
        emailVerified: true,
        hasPassword: false,
      },
    }),
  );
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <OwnerSection section="assets" />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}
describe("official workspace data states", () => {
  it("shows a missing vault and never calls dependent or legacy fixture services", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404, data: { code: "VAULT_NOT_FOUND" } },
    });
    setup();
    expect(await screen.findByText("Bạn chưa có kho di sản")).toBeInTheDocument();
    expect(backendAssetService.list).not.toHaveBeenCalled();
    expect(ownerVaultService.listPackages).not.toHaveBeenCalled();
  });
  it("does not report a backend failure as empty data", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue(new Error("private exception"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được dữ liệu");
    expect(screen.queryByText("Bạn chưa có kho di sản")).not.toBeInTheDocument();
    expect(screen.queryByText("private exception")).not.toBeInTheDocument();
  });
  it("renders confirmed empty metadata only after an existing vault is loaded", async () => {
    vi.mocked(ownerVaultService.getMine).mockResolvedValue(vaultFixture);
    vi.mocked(backendAssetService.list).mockResolvedValue({
      items: [],
      pageIndex: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    });
    setup();
    expect(await screen.findByText("Chưa có nội dung")).toBeInTheDocument();
    expect(backendAssetService.list).toHaveBeenCalledWith(
      vaultFixture.id,
      { pageIndex: 1, pageSize: 10 },
      expect.any(AbortSignal),
    );
  });
});
