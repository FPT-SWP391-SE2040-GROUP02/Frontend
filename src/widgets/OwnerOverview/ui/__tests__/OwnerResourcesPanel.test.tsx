import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { backendAssetService } from "@/features/assets/api/backendAssetService";
import { beneficiaryService } from "@/features/beneficiaries/api/beneficiaryService";
import { VAULT_ID, pageFixture } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerResourcesPanel } from "../OwnerResourcesPanel";
vi.mock("@/features/assets/api/backendAssetService", () => ({
  backendAssetService: { list: vi.fn() },
}));
vi.mock("@/features/beneficiaries/api/beneficiaryService", () => ({
  beneficiaryService: { list: vi.fn() },
}));
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});
function setup(vaultId = VAULT_ID) {
  return render(
    <QueryClientProvider client={client}>
      <OwnerResourcesPanel vaultId={vaultId} />
    </QueryClientProvider>,
  );
}
function emptyResponses() {
  vi.mocked(backendAssetService.list).mockResolvedValue(pageFixture([]));
  vi.mocked(beneficiaryService.list).mockResolvedValue(pageFixture([]));
}
describe("OwnerResourcesPanel", () => {
  it("never requests resources without a vault scope", () => {
    setup("");
    expect(backendAssetService.list).not.toHaveBeenCalled();
    expect(beneficiaryService.list).not.toHaveBeenCalled();
  });
  it("shows raw empty responses without a healthy fixture", async () => {
    emptyResponses();
    setup();
    expect(await screen.findByText("0 tài sản")).toBeInTheDocument();
    expect(screen.getByText("0 hồ sơ")).toBeInTheDocument();
    expect(backendAssetService.list).toHaveBeenCalledWith(
      VAULT_ID,
      undefined,
      expect.any(AbortSignal),
    );
    expect(beneficiaryService.list).toHaveBeenCalledWith(
      VAULT_ID,
      undefined,
      expect.any(AbortSignal),
    );
  });
  it("keeps failures separate and retries only the failed read", async () => {
    emptyResponses();
    vi.mocked(backendAssetService.list).mockRejectedValue(new Error("test failure"));
    setup();
    const section = screen.getByRole("region", { name: "Tài sản trong kho" });
    expect(await within(section).findByRole("alert")).toHaveTextContent("Không tải được tài sản");
    fireEvent.click(within(section).getByRole("button", { name: "Thử lại" }));
    await vi.waitFor(() => expect(backendAssetService.list).toHaveBeenCalledTimes(2));
    expect(beneficiaryService.list).toHaveBeenCalledTimes(1);
  });
  it("partitions private queries by vault scope", async () => {
    emptyResponses();
    setup();
    await screen.findByText("0 tài sản");
    expect(client.getQueryData(["vault-assets", VAULT_ID, {}])).toEqual(pageFixture([]));
    expect(client.getQueryData(["vault-assets", "other-vault", {}])).toBeUndefined();
  });
});
