import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { backendAssetService } from "../../api/backendAssetService";
import type { BackendAsset } from "../../model/backendAsset.schema";
import { AssetActions } from "../AssetActions";

const VAULT_ID = "33333333-3333-4333-8333-333333333333";
const ASSET_ID = "44444444-4444-4444-8444-444444444444";
const baseAsset: BackendAsset = {
  id: ASSET_ID,
  vaultId: VAULT_ID,
  kind: "TEXT",
  name: "Ghi chú",
  description: "Mô tả cũ",
  currentVersion: {
    versionNumber: 2,
    fileName: null,
    contentType: "text/plain",
    sizeBytes: 12,
    createdAt: "2026-10-20T00:00:00+00:00",
  },
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

function renderActions(asset: BackendAsset = baseAsset) {
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <AssetActions vaultId={VAULT_ID} asset={asset} />
    </QueryClientProvider>,
  );
  return invalidate;
}

describe("AssetActions", () => {
  it("downloads the chosen version through a temporary object URL", async () => {
    const user = userEvent.setup();
    const download = vi
      .spyOn(backendAssetService, "download")
      .mockResolvedValue(new Blob(["x"], { type: "application/octet-stream" }));
    const create = vi.fn(() => "blob:fixture");
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderActions();
    await user.click(screen.getByRole("button", { name: "Tải xuống" }));
    await user.selectOptions(screen.getByLabelText("Phiên bản"), "1");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Tải xuống" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(download).toHaveBeenCalledWith(VAULT_ID, ASSET_ID, 1);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("sends only the changed field with the current etag and refreshes after success", async () => {
    const user = userEvent.setup();
    const update = vi.spyOn(backendAssetService, "update").mockResolvedValue({
      ...baseAsset,
      name: "Tên mới",
      etag: "etag-2",
    });
    const invalidate = renderActions();
    await user.click(screen.getByRole("button", { name: "Sửa" }));
    const name = screen.getByLabelText("Tên tài sản");
    await user.clear(name);
    await user.type(name, "Tên mới");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(VAULT_ID, ASSET_ID, { etag: "etag-1", name: "Tên mới" });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["vault-assets", VAULT_ID] }),
    );
  });

  it("does not call the Backend when nothing changed", async () => {
    const user = userEvent.setup();
    const update = vi.spyOn(backendAssetService, "update");
    renderActions();
    await user.click(screen.getByRole("button", { name: "Sửa" }));
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(update).not.toHaveBeenCalled();
  });

  it("tells the Owner to reload on an edit conflict and keeps the dialog open", async () => {
    const user = userEvent.setup();
    vi.spyOn(backendAssetService, "update").mockRejectedValue(problem(409, "EDIT_CONFLICT"));
    renderActions();
    await user.click(screen.getByRole("button", { name: "Sửa" }));
    const name = screen.getByLabelText("Tên tài sản");
    await user.clear(name);
    await user.type(name, "Khác");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Dữ liệu đã thay đổi/);
    expect(screen.getByLabelText("Tên tài sản")).toBeInTheDocument();
  });

  it("creates a new TEXT version with the etag and never keeps the content afterwards", async () => {
    const user = userEvent.setup();
    const version = vi
      .spyOn(backendAssetService, "createTextVersion")
      .mockResolvedValue({ ...baseAsset, etag: "etag-2" });
    renderActions();
    await user.click(screen.getByRole("button", { name: "Thay nội dung" }));
    await user.type(screen.getByLabelText("Nội dung mới"), "bí mật mới");
    await user.click(screen.getByRole("button", { name: "Lưu phiên bản mới" }));
    await waitFor(() => expect(version).toHaveBeenCalledTimes(1));
    expect(version).toHaveBeenCalledWith(VAULT_ID, ASSET_ID, {
      content: "bí mật mới",
      etag: "etag-1",
    });
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it("uploads a file as a new version for a FILE asset and rejects an empty file first", async () => {
    const user = userEvent.setup();
    const version = vi
      .spyOn(backendAssetService, "createFileVersion")
      .mockResolvedValue({ ...baseAsset, kind: "FILE", etag: "etag-2" });
    renderActions({ ...baseAsset, kind: "FILE" });
    await user.click(screen.getByRole("button", { name: "Thay nội dung" }));
    await user.click(screen.getByRole("button", { name: "Lưu phiên bản mới" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Chọn tệp/);
    expect(version).not.toHaveBeenCalled();
    const file = new File(["abc"], "a.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("Tệp mới"), file);
    await user.click(screen.getByRole("button", { name: "Lưu phiên bản mới" }));
    await waitFor(() => expect(version).toHaveBeenCalledWith(VAULT_ID, ASSET_ID, file, "etag-1"));
  });

  it.each([
    ["IN_CONTAINER", /gỡ khỏi gói/i],
    ["PINNED_IN_HANDOVER", /ghim/i],
  ])("explains why deletion is refused (%s) and keeps the asset", async (reason, expected) => {
    const user = userEvent.setup();
    vi.spyOn(backendAssetService, "remove").mockRejectedValue(problem(409, "ASSET_IN_USE", reason));
    renderActions();
    await user.click(screen.getByRole("button", { name: "Xóa" }));
    await user.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
  });

  it("explains a hold on the vault when deletion is blocked by VAULT_NOT_EDITABLE", async () => {
    const user = userEvent.setup();
    vi.spyOn(backendAssetService, "remove").mockRejectedValue(
      problem(409, "VAULT_NOT_EDITABLE", "HOLD_ACTIVE"),
    );
    renderActions();
    await user.click(screen.getByRole("button", { name: "Xóa" }));
    await user.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/tạm giữ/);
  });

  it("deletes only after confirmation, once, then refreshes", async () => {
    const user = userEvent.setup();
    const remove = vi.spyOn(backendAssetService, "remove").mockResolvedValue();
    const invalidate = renderActions();
    await user.click(screen.getByRole("button", { name: "Xóa" }));
    expect(remove).not.toHaveBeenCalled();
    await user.dblClick(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(remove).toHaveBeenCalledWith(VAULT_ID, ASSET_ID);
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["vault-assets", VAULT_ID] }),
    );
  });
});
