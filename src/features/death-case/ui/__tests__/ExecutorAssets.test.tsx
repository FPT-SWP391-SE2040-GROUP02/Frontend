import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { deathCaseService } from "../../api/deathCaseService";
import { ExecutorAssets } from "../ExecutorAssets";

const VAULT = "11111111-1111-4111-8111-111111111111";
const ASSET = "22222222-2222-4222-8222-222222222222";

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ExecutorAssets vaultId={VAULT} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ExecutorAssets", () => {
  it("hiện danh sách tài sản và tải nội dung khi bấm", async () => {
    vi.spyOn(deathCaseService, "assets").mockResolvedValue({
      items: [
        {
          id: ASSET,
          kind: "File",
          name: "Sổ đỏ",
          fileName: "so-do.pdf",
          contentType: "application/pdf",
          sizeBytes: 2048,
          createdAt: "2026-11-01T00:00:00Z",
        },
      ],
      totalCount: 1,
    });
    const download = vi
      .spyOn(deathCaseService, "downloadAsset")
      .mockResolvedValue(new Blob(["abc"]));
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    renderPanel();
    expect(await screen.findByText("Sổ đỏ")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tải xuống Sổ đỏ" }));
    await waitFor(() => expect(download).toHaveBeenCalledWith(VAULT, ASSET));
  });

  it("báo khi kho chưa có tài sản và khi không xem được danh sách", async () => {
    vi.spyOn(deathCaseService, "assets").mockResolvedValue({ items: [], totalCount: 0 });
    renderPanel();
    expect(await screen.findByText("Kho chưa có tài sản nào.")).toBeInTheDocument();
    cleanup();
    vi.spyOn(deathCaseService, "assets").mockRejectedValue(new Error("403"));
    renderPanel();
    expect(await screen.findByText("Chưa xem được danh sách tài sản.")).toBeInTheDocument();
  });
});
