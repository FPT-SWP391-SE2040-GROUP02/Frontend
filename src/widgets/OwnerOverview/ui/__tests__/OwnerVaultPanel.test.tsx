import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { VAULT_PLAN_STATUS, type VaultResponse } from "@/entities/vault/model/vault.types";
import { OwnerVaultPanel } from "../OwnerVaultPanel";

vi.mock("@/features/vault-management/api/ownerVaultService", () => ({
  ownerVaultService: { getMine: vi.fn(), listPackages: vi.fn() },
}));

/** Kho thử nghiệm đúng shape transport, không chứng minh quyền hoặc entitlement thực. */
const VAULT_FIXTURE: VaultResponse = {
  id: "vault-fixture", status: VAULT_PLAN_STATUS.DRAFT,
  storageQuotaBytes: 0, storageUsedBytes: 128, beneficiarySlotQuota: 0,
  packageCount: 1, isContentEditable: true,
  createdAt: "2026-10-10T00:00:00Z", updatedAt: "2026-10-10T00:00:00Z",
};

/** QueryClient dùng riêng từng test để không chia sẻ dữ liệu private giữa các case. */
let queryClient: QueryClient;

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  queryClient.clear();
});

/** @param enabled Cờ phiên thử nghiệm. @returns UI panel trong query provider. */
function setup(enabled = true) {
  return render(<QueryClientProvider client={queryClient}><OwnerVaultPanel enabled={enabled} /></QueryClientProvider>);
}

describe("OwnerVaultPanel", () => {
  it("does not request private data before the session is ready", () => {
    setup(false);
    expect(screen.getByRole("status")).toHaveTextContent("Chưa có phiên Bearer");
    expect(ownerVaultService.getMine).not.toHaveBeenCalled();
    expect(ownerVaultService.listPackages).not.toHaveBeenCalled();
  });

  it("shows loading while the vault request is pending", () => {
    vi.mocked(ownerVaultService.getMine).mockReturnValue(new Promise<VaultResponse>(() => {}));
    setup();
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải kho");
    expect(ownerVaultService.listPackages).not.toHaveBeenCalled();
  });

  it("shows the vault error and allows a retry without creating a vault", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue(new Error("unavailable"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được kho");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await vi.waitFor(() => expect(ownerVaultService.getMine).toHaveBeenCalledTimes(2));
    expect(ownerVaultService.listPackages).not.toHaveBeenCalled();
  });

  it("shows an empty package list using the server metadata", async () => {
    vi.mocked(ownerVaultService.getMine).mockResolvedValue({ ...VAULT_FIXTURE, packageCount: 0 });
    vi.mocked(ownerVaultService.listPackages).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });
    setup();
    expect(await screen.findByText("Kho chưa có gói bàn giao.")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("shows package errors separately from vault errors", async () => {
    vi.mocked(ownerVaultService.getMine).mockResolvedValue(VAULT_FIXTURE);
    vi.mocked(ownerVaultService.listPackages).mockRejectedValue(new Error("packages unavailable"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được danh sách gói");
  });

  it("renders server package names and omits absent descriptions", async () => {
    vi.mocked(ownerVaultService.getMine).mockResolvedValue(VAULT_FIXTURE);
    vi.mocked(ownerVaultService.listPackages).mockResolvedValue({
      data: [{ id: "package-fixture", name: "Giấy tờ gia đình", description: null,
        createdAt: VAULT_FIXTURE.createdAt, updatedAt: VAULT_FIXTURE.updatedAt }],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    setup();
    expect(await screen.findByRole("list")).toHaveTextContent("Giấy tờ gia đình");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
