import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import {
  vaultFixture,
  containerFixture,
  pageFixture,
  VAULT_ID,
} from "@/shared/api/__tests__/backend.fixtures";
import { OwnerVaultPanel } from "../OwnerVaultPanel";
import { AxiosError, AxiosHeaders } from "axios";
import { HTTP_STATUS } from "@/shared/constants";

vi.mock("@/features/vault-management/api/ownerVaultService", () => ({
  ownerVaultService: { getMine: vi.fn(), listPackages: vi.fn() },
}));
vi.mock("../OwnerResourcesPanel", () => ({ OwnerResourcesPanel: () => null }));

/** Kho thử nghiệm đúng shape transport, không chứng minh quyền hoặc entitlement thực. */
const VAULT_FIXTURE: VaultResponse = { ...vaultFixture };

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
  return render(
    <QueryClientProvider client={queryClient}>
      <OwnerVaultPanel enabled={enabled} />
    </QueryClientProvider>,
  );
}

describe("OwnerVaultPanel", () => {
  it("does not request private data before the session is ready", () => {
    setup(false);
    expect(screen.getByRole("status")).toHaveTextContent("Vui lòng đăng nhập");
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

  it.each([
    [HTTP_STATUS.NOT_FOUND, "VAULT_NOT_FOUND", true],
    [HTTP_STATUS.NOT_FOUND, "NOT_FOUND", false],
    [HTTP_STATUS.INTERNAL_SERVER_ERROR, "VAULT_NOT_FOUND", false],
  ])("distinguishes missing vault from HTTP %s / %s", async (status, code, missing) => {
    const config = { headers: new AxiosHeaders() };
    const error = new AxiosError("test-response", undefined, config, undefined, {
      status,
      statusText: "Test response",
      headers: {},
      config,
      data: { code },
    });
    vi.mocked(ownerVaultService.getMine).mockRejectedValue(error);
    setup();
    if (missing) {
      expect(await screen.findByText("Bạn chưa có kho di sản.")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } else {
      expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được kho");
    }
    expect(ownerVaultService.listPackages).not.toHaveBeenCalled();
  });

  it("shows an empty package list using the server metadata", async () => {
    vi.mocked(ownerVaultService.getMine).mockResolvedValue({
      ...VAULT_FIXTURE,
      activeContainerCount: 0,
    });
    vi.mocked(ownerVaultService.listPackages).mockResolvedValue(pageFixture([]));
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
    vi.mocked(ownerVaultService.listPackages).mockResolvedValue(
      pageFixture([
        { ...containerFixture, assetIds: [], beneficiaryIds: [], missingRequirements: [] },
      ]),
    );
    setup();
    expect(await screen.findByRole("list")).toHaveTextContent("Giấy tờ gia đình");
    expect(ownerVaultService.listPackages).toHaveBeenCalledWith(
      VAULT_ID,
      undefined,
      expect.any(AbortSignal),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
