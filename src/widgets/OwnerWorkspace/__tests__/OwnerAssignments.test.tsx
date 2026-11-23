import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT, pageFixture } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerAssignments } from "../OwnerAssignments";

const HOUSE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CAR_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const AN_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const BINH_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function asset(id: string, name: string, kind: "FILE" | "TEXT") {
  return {
    id,
    vaultId: VAULT_ID,
    kind,
    name,
    description: null,
    fileName: null,
    contentType: "text/plain",
    sizeBytes: 10,
    createdAt: CREATED_AT,
    updatedAt: null,
    etag: "asset-v1",
  };
}

function person(id: string, fullName: string, citizenId: string) {
  return {
    id,
    citizenId,
    fullName,
    dateOfBirth: "1990-01-01",
    email: null,
    phone: null,
    message: null,
    assetIds: [],
    createdAt: CREATED_AT,
    updatedAt: null,
    etag: "b-v1",
  };
}

function link(assetId: string, beneficiaryId: string) {
  return { id: crypto.randomUUID(), assetId, beneficiaryId, createdAt: CREATED_AT };
}

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("owner-assignments-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function mockData(
  assignments: unknown[],
  assets = [asset(HOUSE_ID, "Nhà", "FILE"), asset(CAR_ID, "Xe", "TEXT")],
) {
  vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url.endsWith("/assignments")) return assignments;
    if (url.endsWith("/assets")) return pageFixture(assets);
    if (url.endsWith("/beneficiaries")) {
      return pageFixture([
        person(AN_ID, "Nguyễn Văn An", "0001"),
        person(BINH_ID, "Trần Thị Bình", "0002"),
      ]);
    }
    return pageFixture([]);
  });
}

function renderBoard(lockReason: string | null = null) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OwnerAssignments vaultId={VAULT_ID} lockReason={lockReason} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("tab Phân chia", () => {
  it("tóm tắt số liệu, xếp tài sản chưa gán lên đầu và ghi rõ nhận chung", async () => {
    mockData([link(CAR_ID, AN_ID), link(CAR_ID, BINH_ID)]);
    renderBoard();

    expect(await screen.findByText("Phân chia tài sản")).toBeInTheDocument();
    const stats = screen.getByText("Đã gán").closest("dl") as HTMLElement;
    expect(within(stats).getByText("1/2")).toBeInTheDocument();
    expect(within(stats).getByText("Người nhận")).toBeInTheDocument();
    const rows = screen
      .getAllByRole("listitem")
      .filter((item) => item.className.includes("border-l-4"));
    expect(within(rows[0]).getByText("Nhà")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Chưa gán cho ai")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Nhận chung, 2 người cùng ký")).toBeInTheDocument();
  });

  it("chọn người nhận: mở hộp thoại, gửi danh sách sau cùng bằng PUT", async () => {
    mockData([]);
    const put = vi.spyOn(apiClient, "put").mockResolvedValue([]);
    renderBoard();

    await userEvent.click(await screen.findByRole("button", { name: "Chọn người nhận cho Nhà" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("checkbox", { name: /Nguyễn Văn An/ }));
    await userEvent.click(within(dialog).getByRole("checkbox", { name: /Trần Thị Bình/ }));
    expect(within(dialog).getByText(/Nhận chung:/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/assets/${HOUSE_ID}/assignments`, {
      beneficiaryIds: [AN_ID, BINH_ID],
      confirmPlanDeactivation: false,
    });
  });

  it("kho bị khóa: nêu lý do và khóa nút gán", async () => {
    mockData([]);
    renderBoard("Kho đang bàn giao nên chưa sửa được.");

    expect(await screen.findByText("Kho đang bàn giao nên chưa sửa được.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chọn người nhận cho Nhà" })).toBeDisabled();
  });

  it("kho chưa có tài sản: hướng dẫn thêm tài sản trước", async () => {
    mockData([], []);
    renderBoard();

    expect(await screen.findByText("Kho chưa có tài sản nào.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về mục trong kho" })).toBeInTheDocument();
  });

  it("theo người nhận: người chưa được gán hiện thông báo thay vì danh sách trống", async () => {
    mockData([link(HOUSE_ID, AN_ID)]);
    renderBoard();

    await userEvent.click(await screen.findByRole("tab", { name: "Theo người nhận" }));
    expect(await screen.findByText("Nguyễn Văn An")).toBeInTheDocument();
    expect(screen.getByText(/Chưa được gán tài sản nào/)).toBeInTheDocument();
  });
});
