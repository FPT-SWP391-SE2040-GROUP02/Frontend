import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { backendAssetService } from "../../api/backendAssetService";
import type { BackendAsset } from "../../model/backendAsset.schema";
import { AssetList } from "../AssetList";

const VAULT_ID = "33333333-3333-4333-8333-333333333333";

const asset = (n: number, kind: "FILE" | "TEXT", name: string): BackendAsset => ({
  id: `44444444-4444-4444-8444-44444444444${n}`,
  vaultId: VAULT_ID,
  kind,
  name,
  description: null,
  currentVersion: {
    versionNumber: 1,
    fileName: kind === "FILE" ? `${name}.pdf` : null,
    contentType: kind === "FILE" ? "application/pdf" : "text/plain",
    sizeBytes: 100,
    createdAt: "2026-10-20T00:00:00+00:00",
  },
  createdAt: "2026-10-19T00:00:00+00:00",
  updatedAt: "2026-10-20T00:00:00+00:00",
  etag: `etag-${n}`,
});

const page = (items: BackendAsset[], totalCount = items.length) => ({
  items,
  totalCount,
  pageIndex: 1,
  pageSize: 10,
  totalPages: Math.max(1, Math.ceil(totalCount / 10)),
  hasPreviousPage: false,
  hasNextPage: totalCount > 10,
});

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("asset-list-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AssetList vaultId={VAULT_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AssetList", () => {
  it("shows the total, kind, update date and a link to each item's detail page", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")], 12),
    );
    setup();
    expect(await screen.findByText("12 mục")).toBeInTheDocument();
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("Văn bản")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Tệp")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ví điện tử" })).toHaveAttribute(
      "href",
      "/dashboard/assets/44444444-4444-4444-8444-444444444441",
    );
    expect(screen.getByRole("link", { name: "Sửa Sổ tiết kiệm" })).toBeInTheDocument();
  });

  it("filters the loaded page by kind", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")]),
    );
    setup();
    await screen.findByRole("link", { name: "Ví điện tử" });
    fireEvent.click(screen.getByRole("button", { name: "Tệp" }));
    expect(screen.queryByRole("link", { name: "Ví điện tử" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sổ tiết kiệm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tệp" })).toHaveAttribute("aria-pressed", "true");
  });

  it("asks the Backend to search by name", async () => {
    const list = vi
      .spyOn(backendAssetService, "list")
      .mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    setup();
    await screen.findByRole("link", { name: "Ví điện tử" });
    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm theo tên mục" }), {
      target: { value: "ví" },
    });
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(
        VAULT_ID,
        expect.objectContaining({ searchTerm: "ví" }),
        expect.anything(),
      ),
    );
  });

  it("says nothing matches a search instead of showing the empty vault message", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([]));
    setup();
    fireEvent.change(await screen.findByRole("searchbox", { name: "Tìm theo tên mục" }), {
      target: { value: "xyz" },
    });
    expect(await screen.findByText("Không có mục khớp tên bạn tìm")).toBeInTheDocument();
  });

  it("shows the empty state for a vault without items", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([]));
    setup();
    expect(await screen.findByText("Chưa có nội dung")).toBeInTheDocument();
  });

  it("reports a failed request with a retry, never an empty list", async () => {
    vi.spyOn(backendAssetService, "list").mockRejectedValue(new Error("down"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được dữ liệu");
    expect(screen.queryByText("Chưa có nội dung")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
