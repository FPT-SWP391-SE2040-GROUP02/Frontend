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
import { vaultPinService } from "@/features/vault-pin/api/vaultPinService";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerSection } from "../OwnerSection";

vi.mock("@/features/vault-management/api/ownerVaultService", () => ({
  ownerVaultService: { getMine: vi.fn(), createMine: vi.fn(), listPackages: vi.fn() },
}));
vi.mock("@/features/vault-pin/api/vaultPinService", () => ({
  vaultPinService: { getStatus: vi.fn(), set: vi.fn(), verify: vi.fn() },
}));
vi.mock("@/features/assets/api/backendAssetService", () => ({
  backendAssetService: { list: vi.fn() },
}));
const emptyAssetPage = {
  items: [],
  pageIndex: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};
const pinStatus = (isSet: boolean) => ({
  isSet,
  isRequired: false,
  lockedUntil: null,
  attemptsRemaining: isSet ? 5 : null,
});
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(vaultPinService.getStatus).mockResolvedValue(pinStatus(true));
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
  it("asks to verify email when the vault cannot be auto-created and never calls dependent services", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404, data: { code: "VAULT_NOT_FOUND" } },
    });
    vi.mocked(ownerVaultService.createMine).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { code: "EMAIL_NOT_VERIFIED" } },
    });
    setup();
    expect(await screen.findByText("Xác minh email để mở kho di sản")).toBeInTheDocument();
    expect(ownerVaultService.createMine).toHaveBeenCalledWith();
    expect(backendAssetService.list).not.toHaveBeenCalled();
    expect(ownerVaultService.listPackages).not.toHaveBeenCalled();
  });
  it("auto-creates the vault without a name and goes straight to its content", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404, data: { code: "VAULT_NOT_FOUND" } },
    });
    vi.mocked(ownerVaultService.createMine).mockResolvedValue(vaultFixture);
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
    expect(ownerVaultService.createMine).toHaveBeenCalledTimes(1);
    expect(ownerVaultService.createMine).toHaveBeenCalledWith();
  });
  it("does not report a backend failure as empty data", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue(new Error("private exception"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được dữ liệu");
    expect(screen.queryByText("Xác minh email để mở kho di sản")).not.toBeInTheDocument();
    expect(ownerVaultService.createMine).not.toHaveBeenCalled();
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
  it("locks adding assets and asks to set a PIN while the vault has none", async () => {
    vi.mocked(ownerVaultService.getMine).mockResolvedValue(vaultFixture);
    vi.mocked(backendAssetService.list).mockResolvedValue(emptyAssetPage);
    vi.mocked(vaultPinService.getStatus).mockResolvedValue(pinStatus(false));
    setup();
    expect(await screen.findByText("Bạn chưa đặt mã PIN cho kho")).toBeInTheDocument();
    expect(screen.getByText("Thêm tài sản đang bị khóa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đặt mã PIN" })).toBeInTheDocument();
  });
  it("shows the add-asset form without the PIN notice once a PIN is set", async () => {
    vi.mocked(ownerVaultService.getMine).mockResolvedValue(vaultFixture);
    vi.mocked(backendAssetService.list).mockResolvedValue(emptyAssetPage);
    setup();
    expect(await screen.findByText("Chưa có nội dung")).toBeInTheDocument();
    await vi.waitFor(() => expect(vaultPinService.getStatus).toHaveBeenCalled());
    expect(screen.queryByText("Bạn chưa đặt mã PIN cho kho")).not.toBeInTheDocument();
    expect(screen.queryByText("Thêm tài sản đang bị khóa")).not.toBeInTheDocument();
    expect(await screen.findByRole("group", { name: "Loại mục" })).toBeInTheDocument();
  });
});
