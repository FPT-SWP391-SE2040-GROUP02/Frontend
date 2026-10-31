import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { VaultPinConfirmation } from "@/shared/api/vaultPin";
import { backendAssetService } from "../../api/backendAssetService";
import type { BackendAsset } from "../../model/backendAsset.schema";
import { forgetPinUnlock, readPinUnlock, rememberPinUnlock } from "../../model/pinUnlock";
import { AssetList, REVEAL_DURATION_MS } from "../AssetList";

const VAULT_ID = "33333333-3333-4333-8333-333333333333";

const asset = (n: number, kind: "FILE" | "TEXT", name: string): BackendAsset => ({
  id: `44444444-4444-4444-8444-44444444444${n}`,
  vaultId: VAULT_ID,
  kind,
  name,
  description: null,
  fileName: kind === "FILE" ? `${name}.pdf` : null,
  contentType: kind === "FILE" ? "application/pdf" : "text/plain",
  sizeBytes: 100,
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
  // Lần mở khóa PIN được nhớ trong RAM theo kho; xóa để mỗi test bắt đầu từ trạng thái đang che.
  forgetPinUnlock(VAULT_ID);
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(
  confirmPin: () => Promise<VaultPinConfirmation> = () =>
    Promise.resolve<VaultPinConfirmation>({ confirmed: true, pin: "482913" }),
) {
  const pin = vi.fn(confirmPin);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AssetList vaultId={VAULT_ID} confirmPin={pin} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return pin;
}

/** Bấm con mắt và chờ danh sách hiện thật (PIN giả luôn đúng). */
async function reveal() {
  fireEvent.click(await screen.findByRole("button", { name: "Hiện thông tin các mục" }));
  await screen.findByRole("button", { name: "Ẩn thông tin các mục" });
}

describe("AssetList", () => {
  it("masks name, kind, size and date until the PIN is confirmed", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    const confirmPin = setup();
    const rows = await screen.findAllByRole("row", { name: "Mục đang ẩn" });
    expect(rows).toHaveLength(1);
    expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
    expect(screen.queryByText("Ghi chú bí mật", { selector: "span" })).not.toBeInTheDocument();
    expect(screen.queryByText("100 B")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tệp tải lên" })).toBeDisabled();
    expect(confirmPin).not.toHaveBeenCalled();

    await reveal();
    expect(confirmPin).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Ví điện tử" })).toBeInTheDocument();

    // Bấm lần nữa thì che lại ngay, không hỏi PIN.
    fireEvent.click(screen.getByRole("button", { name: "Ẩn thông tin các mục" }));
    expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
    expect(confirmPin).toHaveBeenCalledTimes(1);
  });

  it("reuses a recent PIN unlock (e.g. back from the detail page) and forgets it when hidden", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    rememberPinUnlock(VAULT_ID, "482913");
    const confirmPin = setup();
    expect(await screen.findByRole("link", { name: "Ví điện tử" })).toBeInTheDocument();
    expect(confirmPin).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ẩn thông tin các mục" }));
    expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
    expect(readPinUnlock(VAULT_ID)).toBeNull();
  });

  it("stays masked when the PIN prompt is cancelled", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    const confirmPin = setup(() => Promise.resolve<VaultPinConfirmation>({ confirmed: false }));
    fireEvent.click(await screen.findByRole("button", { name: "Hiện thông tin các mục" }));
    await waitFor(() => expect(confirmPin).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Hiện thông tin các mục" })).toBeEnabled();
    expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
  });

  it("masks again when the tab is hidden", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    setup();
    await reveal();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    visibility.mockRestore();
    expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
  });

  it("masks again after the reveal time runs out", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    // Giả giờ từ đầu để hẹn giờ tự che được tạo bằng đồng hồ giả; shouldAdvanceTime giữ cho các bước chờ vẫn chạy.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      setup();
      await reveal();
      // act rỗng cho React chạy effect đặt hẹn giờ tự che trước khi tua. Không tua trong waitFor vì tua 3 phút
      // cũng làm hết hạn chờ của chính waitFor (nó dùng đồng hồ giả).
      await act(async () => {});
      act(() => {
        vi.advanceTimersByTime(REVEAL_DURATION_MS);
      });
      expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the total, kind, update date and a link to each item's detail page", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")], 12),
    );
    setup();
    expect(await screen.findByText("12 mục")).toBeInTheDocument();
    await reveal();
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("Ghi chú bí mật")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Tệp tải lên")).toBeInTheDocument();
    // Cột Dung lượng lấy từ phiên bản hiện tại của mục (100 byte trong dữ liệu mẫu).
    expect(
      within(screen.getByRole("table")).getByRole("columnheader", { name: "Dung lượng" }),
    ).toBeInTheDocument();
    expect(within(rows[1]).getByText("100 B")).toBeInTheDocument();
    expect(within(rows[2]).getByText("100 B")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ví điện tử" })).toHaveAttribute(
      "href",
      "/dashboard/assets/44444444-4444-4444-8444-444444444441",
    );
    // "Sửa" mở trang chi tiết ở chế độ sửa: trang hỏi mã PIN trước khi hiện form.
    expect(screen.getByRole("link", { name: "Sửa Sổ tiết kiệm" })).toHaveAttribute(
      "href",
      "/dashboard/assets/44444444-4444-4444-8444-444444444442?edit=1",
    );
  });

  it("filters the loaded page by kind", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")]),
    );
    setup();
    await reveal();
    await screen.findByRole("link", { name: "Ví điện tử" });
    fireEvent.click(screen.getByRole("button", { name: "Tệp tải lên" }));
    expect(screen.queryByRole("link", { name: "Ví điện tử" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sổ tiết kiệm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tệp tải lên" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("asks the Backend to search by name", async () => {
    const list = vi
      .spyOn(backendAssetService, "list")
      .mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    setup();
    await reveal();
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
    await reveal();
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
