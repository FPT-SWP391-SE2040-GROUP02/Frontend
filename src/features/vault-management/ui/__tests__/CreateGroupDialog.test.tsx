import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, containerFixture } from "@/shared/api/__tests__/backend.fixtures";
import type { GroupAssetOption, GroupBeneficiaryOption } from "../../model/groupMembers";
import { CreateGroupDialog } from "../CreateGroupDialog";

const ASSET_FREE = "33333333-3333-4333-8333-333333333331";
const ASSET_TAKEN = "33333333-3333-4333-8333-333333333332";
const PERSON = "44444444-4444-4444-8444-444444444441";

const assets: GroupAssetOption[] = [
  {
    id: ASSET_TAKEN,
    name: "Mật khẩu ngân hàng",
    kind: "TEXT",
    containerId: CONTAINER_ID,
    containerName: "Gói cho vợ",
  },
  {
    id: ASSET_FREE,
    name: "Hợp đồng bảo hiểm",
    kind: "FILE",
    containerId: null,
    containerName: null,
  },
];
const beneficiaries: GroupBeneficiaryOption[] = [
  { id: PERSON, fullName: "Nguyễn Minh Anh", citizenIdLast4: "4821" },
];

function renderDialog(onClose = vi.fn(), preselectedAssetIds: string[] = []) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <CreateGroupDialog
          vaultId={VAULT_ID}
          onClose={onClose}
          assets={assets}
          beneficiaries={beneficiaries}
          preselectedAssetIds={preselectedAssetIds}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  accessTokenMemory.set("create-group-fixture");
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("Dialog tạo gói bàn giao hai cột", () => {
  it("xếp tài sản chưa thuộc gói lên đầu và khóa tài sản đang ở gói khác", () => {
    renderDialog();
    const free = screen.getByRole("checkbox", { name: /Hợp đồng bảo hiểm/ });
    const taken = screen.getByRole("checkbox", { name: /Mật khẩu ngân hàng/ });
    expect(free).toBeEnabled();
    expect(taken).toBeDisabled();
    expect(screen.getByText("Đang ở Gói cho vợ")).toBeInTheDocument();
    expect(screen.getByText("CCCD ****4821")).toBeInTheDocument();
    // Tài sản chưa thuộc gói nằm trước tài sản đang ở gói khác.
    expect(free.compareDocumentPosition(taken) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("tick sẵn tài sản mở từ màn Tài sản và báo gói sẽ Sẵn sàng khi đủ người nhận", () => {
    renderDialog(vi.fn(), [ASSET_FREE, ASSET_TAKEN]);
    expect(screen.getByText(/bạn đang chọn ở màn Tài sản/)).toHaveTextContent("1 tài sản");
    expect(screen.getByRole("checkbox", { name: /Hợp đồng bảo hiểm/ })).toBeChecked();
    expect(screen.getByText(/Còn thiếu/)).toHaveTextContent("Còn thiếu người nhận");
    fireEvent.click(screen.getByRole("checkbox", { name: /Nguyễn Minh Anh/ }));
    expect(screen.getByText(/ngay sau khi tạo/)).toHaveTextContent(
      "Có 1 tài sản và 1 người nhận, nên gói sẽ ở trạng thái Sẵn sàng ngay sau khi tạo.",
    );
  });

  it("Chọn tất cả chỉ chọn tài sản còn chọn được", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Chọn tất cả" }));
    expect(screen.getByRole("checkbox", { name: /Hợp đồng bảo hiểm/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Mật khẩu ngân hàng/ })).not.toBeChecked();
  });

  it("tạo gói rồi gắn tài sản và người nhận đã chọn", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(containerFixture);
    const onClose = vi.fn();
    renderDialog(onClose);
    fireEvent.change(screen.getByLabelText("Tên gói bàn giao"), {
      target: { value: "Gói cho các con" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Hợp đồng bảo hiểm/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Nguyễn Minh Anh/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Tạo gói" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenNthCalledWith(1, `/vaults/${VAULT_ID}/containers`, {
      name: "Gói cho các con",
    });
    expect(post).toHaveBeenNthCalledWith(
      2,
      `/vaults/${VAULT_ID}/containers/${CONTAINER_ID}/assets`,
      { assetId: ASSET_FREE },
    );
    expect(post).toHaveBeenNthCalledWith(
      3,
      `/vaults/${VAULT_ID}/containers/${CONTAINER_ID}/beneficiaries`,
      { beneficiaryId: PERSON },
    );
  });

  it("gắn lỗi giữa chừng thì lần bấm sau không tạo thêm gói trùng", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce(containerFixture)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(containerFixture);
    const onClose = vi.fn();
    renderDialog(onClose);
    fireEvent.change(screen.getByLabelText("Tên gói bàn giao"), { target: { value: "Gói A" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Hợp đồng bảo hiểm/ }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo gói" }));
    const retry = await screen.findByRole("button", { name: "Gắn tiếp vào gói" });
    fireEvent.click(retry);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    let createCalls = 0;
    for (const call of post.mock.calls) {
      if (call[0] === `/vaults/${VAULT_ID}/containers`) {
        createCalls += 1;
      }
    }
    expect(createCalls).toBe(1);
  });
});
