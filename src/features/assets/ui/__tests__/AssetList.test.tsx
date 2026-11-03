import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { VaultPinConfirmation } from "@/shared/api/vaultPin";
import { backendAssetService } from "../../api/backendAssetService";
import type { BackendAsset } from "../../model/backendAsset.schema";
import { forgetPinUnlock, readPinUnlock, rememberPinUnlock } from "../../model/pinUnlock";
import { AssetList, REVEAL_DURATION_MS, type AssetPackageOption } from "../AssetList";

const VAULT_ID = "33333333-3333-4333-8333-333333333333";
const PACKAGE_ID = "55555555-5555-4555-8555-555555555555";

const assetId = (n: number) => `44444444-4444-4444-8444-${String(n).padStart(12, "0")}`;

const asset = (n: number, kind: "FILE" | "TEXT", name: string): BackendAsset => ({
  id: assetId(n),
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
  pageSize: 100,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
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

interface SetupOptions {
  confirmPin?: () => Promise<VaultPinConfirmation>;
  packages?: AssetPackageOption[];
  onMove?: (ids: string[], packageId: string | null) => Promise<string | null>;
  url?: string;
}

function setup(options: SetupOptions = {}) {
  const pin = vi.fn(
    options.confirmPin ??
      (() => Promise.resolve<VaultPinConfirmation>({ confirmed: true, pin: "482913" })),
  );
  const move = vi.fn(options.onMove ?? (() => Promise.resolve(null)));
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[options.url ?? "/"]}>
        <AssetList
          vaultId={VAULT_ID}
          confirmPin={pin}
          packages={options.packages ?? []}
          onMove={move}
          packagesHref="/dashboard/packages"
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { pin, move };
}

/** Bấm "Hiện thông tin" và chờ danh sách hiện thật (PIN giả luôn đúng). */
async function reveal() {
  fireEvent.click(await screen.findByRole("button", { name: "Hiện thông tin các mục" }));
  await screen.findByRole("button", { name: "Ẩn thông tin các mục" });
}

describe("AssetList", () => {
  it("masks name, kind and date until the PIN is confirmed", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    const { pin } = setup();
    const rows = await screen.findAllByRole("row", { name: "Mục đang ẩn" });
    expect(rows).toHaveLength(1);
    expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
    expect(screen.queryByText("Ghi chú bí mật", { selector: "td" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ví điện tử" })).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Lọc theo loại" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Lọc theo gói bàn giao" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Chọn mục đang ẩn" })).toBeDisabled();
    expect(pin).not.toHaveBeenCalled();

    await reveal();
    expect(pin).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Ví điện tử" })).toBeInTheDocument();
    expect(screen.queryByText(/Tự khóa sau/)).not.toBeInTheDocument();

    // Bấm lần nữa thì che lại ngay, không hỏi PIN.
    fireEvent.click(screen.getByRole("button", { name: "Ẩn thông tin các mục" }));
    expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
    expect(pin).toHaveBeenCalledTimes(1);
  });

  it("reuses a recent PIN unlock (e.g. back from the detail page) and forgets it when hidden", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    rememberPinUnlock(VAULT_ID, "482913");
    const { pin } = setup();
    expect(await screen.findByRole("link", { name: "Ví điện tử" })).toBeInTheDocument();
    expect(pin).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ẩn thông tin các mục" }));
    expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
    expect(readPinUnlock(VAULT_ID)).toBeNull();
  });

  it("stays masked when the PIN prompt is cancelled", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    const { pin } = setup({
      confirmPin: () => Promise.resolve<VaultPinConfirmation>({ confirmed: false }),
    });
    fireEvent.click(await screen.findByRole("button", { name: "Hiện thông tin các mục" }));
    await waitFor(() => expect(pin).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Hiện thông tin các mục" })).toBeEnabled();
    expect(screen.queryByText("Ví điện tử")).not.toBeInTheDocument();
  });

  it("masks again when the tab is hidden", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page([asset(1, "TEXT", "Ví điện tử")]));
    setup();
    await reveal();
    // act rỗng cho React chạy effect gắn sự kiện chuyển tab trước khi phát sự kiện (máy chậm có thể chưa kịp).
    await act(async () => {});
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

  it("shows the total, kind, package, update date and a link to each item's detail page", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")], 12),
    );
    setup({ packages: [{ id: PACKAGE_ID, name: "Gói cho vợ", assetIds: [assetId(1)] }] });
    expect(await screen.findByText(/12 tài sản · trang 1 trên 1/)).toBeInTheDocument();
    await reveal();
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("Ghi chú bí mật")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Tệp tải lên")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ví điện tử" })).toHaveAttribute(
      "href",
      `/dashboard/assets/${assetId(1)}`,
    );
    expect(screen.getByRole("combobox", { name: "Gói bàn giao của Ví điện tử" })).toHaveValue(
      PACKAGE_ID,
    );
    expect(screen.getByRole("combobox", { name: "Gói bàn giao của Sổ tiết kiệm" })).toHaveValue("");
    // Dòng chưa gán gói có nền vàng và có dòng nhắc kèm lối sang màn Gói bàn giao.
    expect(rows[2]).toHaveClass("bg-amber-50/70");
    expect(screen.getByRole("link", { name: "Xem các gói và người nhận" })).toHaveAttribute(
      "href",
      "/dashboard/packages",
    );
  });

  it("filters by kind and by package from two selects, with counts in the options", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")]),
    );
    setup({ packages: [{ id: PACKAGE_ID, name: "Gói cho vợ", assetIds: [assetId(1)] }] });
    await reveal();
    await screen.findByRole("link", { name: "Ví điện tử" });
    const packageFilter = screen.getByRole("combobox", { name: "Lọc theo gói bàn giao" });
    const kindFilter = screen.getByRole("combobox", { name: "Lọc theo loại" });
    expect(
      within(packageFilter).getByRole("option", { name: "Gói bàn giao: tất cả (2)" }),
    ).toBeInTheDocument();
    expect(
      within(packageFilter).getByRole("option", { name: "Chưa gán gói (1)" }),
    ).toBeInTheDocument();
    expect(
      within(packageFilter).getByRole("option", { name: "Gói cho vợ (1)" }),
    ).toBeInTheDocument();
    expect(within(kindFilter).getByRole("option", { name: "Tệp tải lên (1)" })).toBeInTheDocument();

    fireEvent.change(kindFilter, { target: { value: "FILE" } });
    expect(screen.queryByRole("link", { name: "Ví điện tử" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sổ tiết kiệm" })).toBeInTheDocument();

    fireEvent.change(packageFilter, { target: { value: PACKAGE_ID } });
    // Loại "Tệp tải lên" và gói "Gói cho vợ" không có mục chung.
    expect(screen.getByText("Không có mục nào ở đây")).toBeInTheDocument();

    // Bỏ cả hai bộ lọc thì danh sách đầy lại.
    fireEvent.change(packageFilter, { target: { value: "" } });
    fireEvent.change(kindFilter, { target: { value: "ALL" } });
    expect(screen.getByRole("link", { name: "Ví điện tử" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sổ tiết kiệm" })).toBeInTheDocument();
  });

  it("opens already filtered by package when the link carries ?package=", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")]),
    );
    rememberPinUnlock(VAULT_ID, "482913");
    setup({
      packages: [{ id: PACKAGE_ID, name: "Gói cho vợ", assetIds: [assetId(1)] }],
      url: `/?package=${PACKAGE_ID}`,
    });
    expect(await screen.findByRole("link", { name: "Ví điện tử" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sổ tiết kiệm" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tài sản trong Gói cho vợ" })).toBeInTheDocument();
  });

  it("searches the loaded items by name", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")]),
    );
    setup();
    await reveal();
    await screen.findByRole("link", { name: "Ví điện tử" });
    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm theo tên mục" }), {
      target: { value: "ví" },
    });
    expect(screen.getByRole("link", { name: "Ví điện tử" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sổ tiết kiệm" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm theo tên mục" }), {
      target: { value: "xyz" },
    });
    expect(screen.getByText("Không có mục nào ở đây")).toBeInTheDocument();
    expect(screen.queryByText("Chưa có nội dung")).not.toBeInTheDocument();
  });

  it("splits the list into pages of ten", async () => {
    const items: BackendAsset[] = [];
    for (let n = 1; n <= 12; n += 1) {
      items.push(asset(n, "TEXT", `Mục số ${n}`));
    }
    vi.spyOn(backendAssetService, "list").mockResolvedValue(page(items));
    setup();
    await reveal();
    expect(await screen.findByText(/Trang 1 trên 2 · đang xem 10 của 12/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(await screen.findByText(/Trang 2 trên 2 · đang xem 2 của 12/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mục số 11" })).toBeInTheDocument();
  });

  it("moves one item to another package from its row and shows a failure", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")]),
    );
    const { move } = setup({
      packages: [{ id: PACKAGE_ID, name: "Gói cho vợ", assetIds: [assetId(1)] }],
      onMove: () => Promise.resolve("Thao tác này cần gói dịch vụ trả phí còn hiệu lực."),
    });
    await reveal();
    fireEvent.change(
      await screen.findByRole("combobox", { name: "Gói bàn giao của Sổ tiết kiệm" }),
      {
        target: { value: PACKAGE_ID },
      },
    );
    await waitFor(() => expect(move).toHaveBeenCalledWith([assetId(2)], PACKAGE_ID));
    expect(await screen.findByRole("alert")).toHaveTextContent("gói dịch vụ trả phí");
  });

  it("moves several ticked items at once", async () => {
    vi.spyOn(backendAssetService, "list").mockResolvedValue(
      page([asset(1, "TEXT", "Ví điện tử"), asset(2, "FILE", "Sổ tiết kiệm")]),
    );
    const { move } = setup({ packages: [{ id: PACKAGE_ID, name: "Gói cho vợ", assetIds: [] }] });
    await reveal();
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Chọn tất cả mục trên trang này" }),
    );
    expect(screen.getByText("Đã chọn 2 tài sản")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Gán các tài sản đã chọn vào gói" }), {
      target: { value: PACKAGE_ID },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gán" }));
    await waitFor(() => expect(move).toHaveBeenCalledWith([assetId(1), assetId(2)], PACKAGE_ID));
    await waitFor(() => expect(screen.queryByText("Đã chọn 2 tài sản")).not.toBeInTheDocument());
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
