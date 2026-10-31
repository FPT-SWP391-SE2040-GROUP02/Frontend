import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { VaultPinConfirmation } from "@/shared/api/vaultPin";
import { backendAssetService } from "../../api/backendAssetService";
import type { BackendAsset } from "../../model/backendAsset.schema";
import { AssetDetail } from "../AssetDetail";

const VAULT_ID = "33333333-3333-4333-8333-333333333333";
const ASSET_ID = "44444444-4444-4444-8444-444444444444";
const PIN = "482913";
const baseAsset: BackendAsset = {
  id: ASSET_ID,
  vaultId: VAULT_ID,
  kind: "TEXT",
  name: "Ghi chú",
  description: "Mô tả cũ",
  fileName: null,
  contentType: "text/plain",
  sizeBytes: 12,
  createdAt: "2026-10-19T00:00:00+00:00",
  updatedAt: null,
  etag: "etag-1",
};

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("asset-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function problem(status: number, code: string, reason?: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("x", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data: { code, reason },
  });
}

function renderDetail(
  asset: BackendAsset = baseAsset,
  options: { confirmPin?: () => Promise<VaultPinConfirmation>; editRequested?: boolean } = {},
) {
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const onDeleted = vi.fn();
  const onEditRequestHandled = vi.fn();
  const confirmPin = vi.fn(
    options.confirmPin ??
      (() => Promise.resolve<VaultPinConfirmation>({ confirmed: true, pin: PIN })),
  );
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AssetDetail
          vaultId={VAULT_ID}
          asset={asset}
          onDeleted={onDeleted}
          confirmPin={confirmPin}
          editRequested={options.editRequested}
          onEditRequestHandled={onEditRequestHandled}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { invalidate, onDeleted, confirmPin, onEditRequestHandled };
}

/** Bấm "Sửa" (PIN giả được chấp nhận) và chờ form hiện ra; trả về ô tên. */
async function startEditing(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Sửa" }));
  return screen.findByLabelText("Tên mục");
}

/** Mở hộp thoại xóa và tick xác nhận; trả về hộp thoại để tìm nút bên trong. */
async function openDeleteDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Xóa mục" }));
  const dialog = screen.getByRole("dialog");
  await user.click(within(dialog).getByRole("checkbox"));
  return dialog;
}

describe("AssetDetail", () => {
  it("shows the single content with its date and size and no version list", () => {
    renderDetail();
    expect(screen.queryByText(/Phiên bản/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thêm phiên bản mới" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tải xuống nội dung" })).toBeInTheDocument();
  });

  it("downloads the content through a temporary object URL", async () => {
    const user = userEvent.setup();
    const download = vi
      .spyOn(backendAssetService, "download")
      .mockResolvedValue(new Blob(["x"], { type: "application/octet-stream" }));
    const create = vi.fn(() => "blob:fixture");
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderDetail();
    await user.click(screen.getByRole("button", { name: "Tải xuống nội dung" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(download).toHaveBeenCalledWith(VAULT_ID, ASSET_ID);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("shows the name and note read-only until the PIN is confirmed", () => {
    const { confirmPin } = renderDetail();
    expect(screen.queryByLabelText("Tên mục")).not.toBeInTheDocument();
    expect(screen.getByText("Mô tả cũ")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu thay đổi" })).not.toBeInTheDocument();
    expect(confirmPin).not.toHaveBeenCalled();
  });

  it("opens the form only after the PIN is confirmed", async () => {
    const user = userEvent.setup();
    const { confirmPin } = renderDetail();
    const name = await startEditing(user);
    expect(confirmPin).toHaveBeenCalledTimes(1);
    expect(name).toHaveValue("Ghi chú");
  });

  it("stays read-only when the PIN dialog is cancelled", async () => {
    const user = userEvent.setup();
    const { confirmPin } = renderDetail(baseAsset, {
      confirmPin: () => Promise.resolve<VaultPinConfirmation>({ confirmed: false }),
    });
    await user.click(screen.getByRole("button", { name: "Sửa" }));
    await waitFor(() => expect(confirmPin).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Sửa" })).toBeEnabled());
    expect(screen.queryByLabelText("Tên mục")).not.toBeInTheDocument();
  });

  it("explains when the PIN could not be checked", async () => {
    const user = userEvent.setup();
    renderDetail(baseAsset, { confirmPin: () => Promise.reject(problem(500, "INTERNAL")) });
    await user.click(screen.getByRole("button", { name: "Sửa" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Máy chủ đang gặp sự cố/);
    expect(screen.queryByLabelText("Tên mục")).not.toBeInTheDocument();
  });

  it("asks for the PIN on arrival when the list's Sửa link was used", async () => {
    const { confirmPin, onEditRequestHandled } = renderDetail(baseAsset, { editRequested: true });
    expect(await screen.findByLabelText("Tên mục")).toBeInTheDocument();
    expect(confirmPin).toHaveBeenCalledTimes(1);
    expect(onEditRequestHandled).toHaveBeenCalledTimes(1);
  });

  it("sends only the changed field with the etag and the confirmed PIN, then goes back to read-only", async () => {
    const user = userEvent.setup();
    const update = vi.spyOn(backendAssetService, "update").mockResolvedValue({
      ...baseAsset,
      name: "Tên mới",
      etag: "etag-2",
    });
    const { invalidate } = renderDetail();
    const name = await startEditing(user);
    await user.clear(name);
    await user.type(name, "Tên mới");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(
      VAULT_ID,
      ASSET_ID,
      { etag: "etag-1", name: "Tên mới" },
      PIN,
    );
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["vault-assets", VAULT_ID] }),
    );
    await waitFor(() => expect(screen.queryByLabelText("Tên mục")).not.toBeInTheDocument());
  });

  it("keeps Lưu thay đổi disabled until something changes", async () => {
    const user = userEvent.setup();
    const update = vi.spyOn(backendAssetService, "update");
    renderDetail();
    const name = await startEditing(user);
    const save = screen.getByRole("button", { name: "Lưu thay đổi" });
    expect(save).toBeDisabled();
    await user.type(name, " mới");
    expect(save).toBeEnabled();
    await user.clear(name);
    await user.type(name, "Ghi chú");
    expect(save).toBeDisabled();
    expect(update).not.toHaveBeenCalled();
  });

  it("shows the save in progress and blocks a second submit", async () => {
    const user = userEvent.setup();
    let finish: (value: BackendAsset) => void = () => {};
    const update = vi.spyOn(backendAssetService, "update").mockImplementation(
      () =>
        new Promise<BackendAsset>((resolve) => {
          finish = resolve;
        }),
    );
    renderDetail();
    const name = await startEditing(user);
    await user.type(name, " mới");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    const saving = await screen.findByRole("button", { name: "Đang lưu…" });
    expect(saving).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
    expect(screen.getByLabelText("Tên mục")).toBeDisabled();
    await user.click(saving);
    expect(update).toHaveBeenCalledTimes(1);
    finish({ ...baseAsset, name: "Ghi chú mới", etag: "etag-2" });
    await waitFor(() => expect(screen.queryByLabelText("Tên mục")).not.toBeInTheDocument());
  });

  it("closes the form on Hủy and asks for the PIN again next time", async () => {
    const user = userEvent.setup();
    const { confirmPin } = renderDetail();
    await startEditing(user);
    await user.click(screen.getByRole("button", { name: "Hủy" }));
    expect(screen.queryByLabelText("Tên mục")).not.toBeInTheDocument();
    await startEditing(user);
    expect(confirmPin).toHaveBeenCalledTimes(2);
  });

  it("tells the Owner to reload on an edit conflict and keeps the form", async () => {
    const user = userEvent.setup();
    vi.spyOn(backendAssetService, "update").mockRejectedValue(problem(409, "EDIT_CONFLICT"));
    renderDetail();
    const name = await startEditing(user);
    await user.clear(name);
    await user.type(name, "Khác");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Dữ liệu đã thay đổi/);
    expect(screen.getByLabelText("Tên mục")).toBeInTheDocument();
  });

  it("keeps the delete button disabled until the Owner confirms", async () => {
    const user = userEvent.setup();
    const remove = vi.spyOn(backendAssetService, "remove").mockResolvedValue();
    renderDetail();
    await user.click(screen.getByRole("button", { name: "Xóa mục" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Xóa mục" })).toBeDisabled();
    expect(remove).not.toHaveBeenCalled();
  });

  it.each([
    ["IN_CONTAINER", /gỡ khỏi gói/i],
    ["PINNED_IN_HANDOVER", /ghim/i],
  ])("explains why deletion is refused (%s) and keeps the asset", async (reason, expected) => {
    const user = userEvent.setup();
    vi.spyOn(backendAssetService, "remove").mockRejectedValue(problem(409, "ASSET_IN_USE", reason));
    renderDetail();
    const dialog = await openDeleteDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Xóa mục" }));
    expect(
      await screen.findByRole("heading", { name: "Chưa xóa được mục này" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(expected);
    expect(screen.getByRole("link", { name: "Mở gói bàn giao" })).toBeInTheDocument();
  });

  it("explains a hold on the vault when deletion is blocked by VAULT_NOT_EDITABLE", async () => {
    const user = userEvent.setup();
    vi.spyOn(backendAssetService, "remove").mockRejectedValue(
      problem(409, "VAULT_NOT_EDITABLE", "HOLD_ACTIVE"),
    );
    renderDetail();
    const dialog = await openDeleteDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Xóa mục" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/tạm giữ/);
  });

  it("deletes only after confirmation, once, then refreshes and leaves the page", async () => {
    const user = userEvent.setup();
    const remove = vi.spyOn(backendAssetService, "remove").mockResolvedValue();
    const { invalidate, onDeleted } = renderDetail();
    const dialog = await openDeleteDialog(user);
    expect(remove).not.toHaveBeenCalled();
    await user.dblClick(within(dialog).getByRole("button", { name: "Xóa mục" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(remove).toHaveBeenCalledWith(VAULT_ID, ASSET_ID);
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["vault-assets", VAULT_ID] }),
    );
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
  });
});
