import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { AxiosHeaders } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { CreateAssetForm } from "@/features/assets/ui/CreateAssetForm";
import { AssignAssetDialog } from "@/features/assignments/ui/AssignAssetDialog";
import { BeneficiaryForm } from "@/features/beneficiaries/ui/BeneficiaryForm";

const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("owner-integration-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});
function setup(children: ReactNode, path = "/") {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </QueryClientProvider>,
  );
}
const asset = {
  id: CONTAINER_ID,
  vaultId: VAULT_ID,
  name: "Ghi chú",
  description: null,
  kind: "TEXT",
  fileName: null,
  contentType: "text/plain",
  sizeBytes: 4,
  createdAt: CREATED_AT,
  updatedAt: null,
  etag: "asset-v1",
};
it("creates TEXT via raw Axios transport, clears the form, and never caches plaintext", async () => {
  const request = vi.fn();
  apiClient.defaults.adapter = async (config) => {
    request(config);
    return { data: asset, config, status: 201, statusText: "Created", headers: new AxiosHeaders() };
  };
  setup(<CreateAssetForm vaultId={VAULT_ID} remainingBytes={1024} />);
  fireEvent.change(screen.getByLabelText("Tên mục"), { target: { value: "Ghi chú" } });
  fireEvent.change(screen.getByLabelText("Nội dung bí mật"), {
    target: { value: "private-content-fixture" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu vào kho" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Đã lưu vào kho");
  expect(request.mock.calls[0][0].url).toBe(`/vaults/${VAULT_ID}/assets/text`);
  expect(JSON.parse(request.mock.calls[0][0].data)).toMatchObject({
    content: "private-content-fixture",
  });
  expect(screen.getByLabelText("Nội dung bí mật")).toHaveValue("");
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.state.data),
    ),
  ).not.toContain("private-content-fixture");
  expect(client.getMutationCache().getAll()).toHaveLength(0);
});
it("rejects an oversized file without sending a request", async () => {
  const post = vi.spyOn(apiClient, "post");
  setup(<CreateAssetForm vaultId={VAULT_ID} remainingBytes={2} />);
  fireEvent.click(screen.getByRole("button", { name: "Tệp tải lên" }));
  fireEvent.change(screen.getByLabelText("Tên mục"), { target: { value: "Tệp" } });
  fireEvent.change(screen.getByLabelText("Tệp tài sản"), {
    target: { files: [new File(["oversize"], "fixture.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu vào kho" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("khả dụng còn lại");
  expect(post).not.toHaveBeenCalled();
});
const ASSET_FOR_DIALOG = { id: CONTAINER_ID, name: "Sổ tiết kiệm", kind: "FILE" };
const RECIPIENTS_FOR_DIALOG = [
  { id: VAULT_ID, fullName: "Trần Thị Bình", citizenId: "012345678901" },
];
it("assigns an asset with PUT and the final list, only after the selection changes", async () => {
  const put = vi.spyOn(apiClient, "put").mockResolvedValue([]);
  const onClose = vi.fn();
  setup(
    <AssignAssetDialog
      vaultId={VAULT_ID}
      asset={ASSET_FOR_DIALOG}
      recipients={RECIPIENTS_FOR_DIALOG}
      currentIds={[]}
      onClose={onClose}
    />,
  );
  expect(await screen.findByRole("button", { name: "Lưu" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: /Trần Thị Bình/ }));
  fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(put).toHaveBeenCalledTimes(1);
  expect(put).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/assets/${CONTAINER_ID}/assignments`, {
    beneficiaryIds: [VAULT_ID],
    confirmPlanDeactivation: false,
  });
});
it("keeps the selection after a 409 conflict and never retries", async () => {
  const put = vi.spyOn(apiClient, "put").mockRejectedValue({
    isAxiosError: true,
    response: { status: 409, data: { code: "EDIT_CONFLICT" } },
  });
  setup(
    <AssignAssetDialog
      vaultId={VAULT_ID}
      asset={ASSET_FOR_DIALOG}
      recipients={RECIPIENTS_FOR_DIALOG}
      currentIds={[]}
      onClose={vi.fn()}
    />,
  );
  const box = await screen.findByRole("checkbox", { name: /Trần Thị Bình/ });
  fireEvent.click(box);
  fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Dữ liệu đã thay đổi");
  expect(screen.getByRole("checkbox", { name: /Trần Thị Bình/ })).toBeChecked();
  expect(put).toHaveBeenCalledTimes(1);
});
it("does not silently confirm plan deactivation when clearing the last recipient", async () => {
  const put = vi.spyOn(apiClient, "put").mockRejectedValue({
    isAxiosError: true,
    response: { status: 409, data: { code: "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED" } },
  });
  setup(
    <AssignAssetDialog
      vaultId={VAULT_ID}
      asset={ASSET_FOR_DIALOG}
      recipients={RECIPIENTS_FOR_DIALOG}
      currentIds={[VAULT_ID]}
      onClose={vi.fn()}
    />,
  );
  fireEvent.click(await screen.findByRole("checkbox", { name: /Trần Thị Bình/ }));
  fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("trở về bản nháp");
  expect(put).toHaveBeenCalledTimes(1);
  expect(put.mock.calls[0][1]).toMatchObject({ confirmPlanDeactivation: false });
  // Chỉ khi Chủ kho bấm đồng ý mới gửi lại kèm xác nhận.
  put.mockResolvedValue([]);
  fireEvent.click(screen.getByRole("button", { name: "Đồng ý, đưa kế hoạch về bản nháp" }));
  await waitFor(() => expect(put).toHaveBeenCalledTimes(2));
  expect(put.mock.calls[1][1]).toMatchObject({ confirmPlanDeactivation: true });
});
it("requires contact information before submitting a beneficiary", async () => {
  const post = vi.spyOn(apiClient, "post");
  setup(<BeneficiaryForm vaultId={VAULT_ID} />);
  fireEvent.change(screen.getByLabelText(/^Số CCCD/), { target: { value: "012345678901" } });
  fireEvent.change(screen.getByLabelText(/^Họ và tên/), { target: { value: "Người nhận thử" } });
  fireEvent.change(screen.getByLabelText(/^Ngày sinh/), { target: { value: "1990-01-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Vui lòng nhập email.");
  expect(post).not.toHaveBeenCalled();
});
