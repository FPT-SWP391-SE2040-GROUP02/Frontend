import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, containerFixture } from "@/shared/api/__tests__/backend.fixtures";
import type { PackageResponse } from "@/entities/package/model/package.types";
import { GroupDetail } from "../GroupDetail";

const ASSET_ID = "44444444-4444-4444-8444-444444444444";
const PERSON_ID = "55555555-5555-4555-8555-555555555555";
const OTHER_PERSON_ID = "66666666-6666-4666-8666-666666666666";

function group(overrides: Partial<PackageResponse> = {}): PackageResponse {
  return {
    ...containerFixture,
    assetIds: [ASSET_ID],
    beneficiaryIds: [PERSON_ID],
    missingRequirements: [],
    status: "READY",
    ...overrides,
  } as PackageResponse;
}

const assets = [{ id: ASSET_ID, label: "Sổ tiết kiệm", detail: "Giấy tờ" }];
const people = [
  { id: PERSON_ID, label: "Con trưởng" },
  { id: OTHER_PERSON_ID, label: "Vợ" },
];

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("group-detail-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderGroup(container: PackageResponse = group()) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <GroupDetail container={container} assets={assets} beneficiaries={people} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function backendError(code: string, status = 403) {
  return new AxiosError("private", undefined, undefined, undefined, {
    status,
    statusText: "Error",
    config: { headers: new AxiosHeaders() },
    headers: {},
    data: { code },
  });
}

describe("chi tiết gói bàn giao", () => {
  it("hiện tên gói bàn giao, số mục, người nhận và trạng thái Sẵn sàng", () => {
    renderGroup();
    expect(screen.getByRole("heading", { name: containerFixture.name })).toBeInTheDocument();
    expect(screen.getByText(/1 mục · Người nhận: Con trưởng/)).toBeInTheDocument();
    expect(screen.getByText("Sẵn sàng")).toBeInTheDocument();
    expect(screen.getByText("Sổ tiết kiệm")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quay lại gói bàn giao" })).toHaveAttribute(
      "href",
      "/dashboard/assets?tab=groups",
    );
  });

  it("gán người nhận chưa có trong gói bàn giao và chờ Backend xác nhận", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ ...group(), beneficiaryIds: [PERSON_ID, OTHER_PERSON_ID] });
    renderGroup();
    expect(screen.getByRole("button", { name: "Gỡ Con trưởng" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gán Con trưởng" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Gán / }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      `/vaults/${VAULT_ID}/containers/${CONTAINER_ID}/beneficiaries`,
      { beneficiaryId: OTHER_PERSON_ID },
    );
  });

  it("khung thông tin gói không có ô đồng ý; Lưu và Hoàn tác chỉ bật khi đã sửa", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...group(), name: "Tên mới" });
    renderGroup();
    expect(
      screen.queryByRole("checkbox", { name: /đưa kế hoạch về Nháp/ }),
    ).not.toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Lưu" });
    const undo = screen.getByRole("button", { name: "Hoàn tác" });
    expect(save).toBeDisabled();
    expect(undo).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Tên gói bàn giao"), { target: { value: "Tên mới" } });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Đã lưu thay đổi.")).toBeInTheDocument();
  });

  it("gỡ không cần hỏi thì gỡ luôn, không gửi xác nhận", async () => {
    const remove = vi
      .spyOn(apiClient, "delete")
      .mockResolvedValue({ ...group(), beneficiaryIds: [] });
    renderGroup();
    fireEvent.click(screen.getByRole("button", { name: "Gỡ Con trưởng" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(remove.mock.calls[0][1]).toMatchObject({ params: { confirmPlanDeactivation: false } });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("gỡ làm mất gói Sẵn sàng cuối cùng thì hỏi rồi mới gửi lại kèm xác nhận", async () => {
    const remove = vi
      .spyOn(apiClient, "delete")
      .mockRejectedValueOnce(backendError("PLAN_DEACTIVATION_CONFIRMATION_REQUIRED", 409))
      .mockResolvedValueOnce({ ...group(), beneficiaryIds: [] });
    renderGroup();
    fireEvent.click(screen.getByRole("button", { name: "Gỡ Con trưởng" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Gỡ người nhận khỏi gói bàn giao?");
    expect(dialog).toHaveTextContent("đưa kế hoạch về Nháp");
    expect(dialog).toHaveTextContent("Người thực hiện phải chấp nhận lại lời mời");
    expect(dialog).toHaveTextContent("không nộp được hồ sơ chứng tử");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục, đưa kế hoạch về Nháp" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
    expect(remove.mock.calls[0][1]).toMatchObject({ params: { confirmPlanDeactivation: false } });
    expect(remove.mock.calls[1][1]).toMatchObject({ params: { confirmPlanDeactivation: true } });
  });

  it("bấm Hủy ở hộp thoại hỏi thì không gỡ gì", async () => {
    const remove = vi
      .spyOn(apiClient, "delete")
      .mockRejectedValue(backendError("PLAN_DEACTIVATION_CONFIRMATION_REQUIRED", 409));
    renderGroup();
    fireEvent.click(screen.getByRole("button", { name: "Gỡ khỏi gói bàn giao" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Gỡ mục khỏi gói bàn giao?");
    fireEvent.click(within(dialog).getByRole("button", { name: "Hủy" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("gói Free bị chặn thì giữ lỗi của Backend kèm đường nâng cấp", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(backendError("PAID_TIER_REQUIRED"));
    renderGroup();
    fireEvent.click(screen.getByRole("button", { name: /^Gán / }));
    expect(await screen.findByRole("alert")).toHaveTextContent("gói dịch vụ trả phí");
    expect(screen.getByRole("link", { name: "Xem gói dịch vụ" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });

  it("xóa gói bàn giao hỏi xác nhận trước, hộp thoại không có ô tick, lần đầu không gửi xác nhận", async () => {
    const remove = vi
      .spyOn(apiClient, "delete")
      .mockResolvedValue({ ...group(), status: "REMOVED" });
    renderGroup();
    fireEvent.click(screen.getByRole("button", { name: "Xóa gói bàn giao" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/^Xóa gói bàn giao “.+”\?$/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Xóa gói bàn giao" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(remove.mock.calls[0][1]).toMatchObject({ params: { confirmPlanDeactivation: false } });
  });

  it("xóa gói Sẵn sàng cuối cùng thì hỏi đưa kế hoạch về Nháp rồi xóa kèm xác nhận", async () => {
    const remove = vi
      .spyOn(apiClient, "delete")
      .mockRejectedValueOnce(backendError("PLAN_DEACTIVATION_CONFIRMATION_REQUIRED", 409))
      .mockResolvedValueOnce({ ...group(), status: "REMOVED" });
    renderGroup();
    fireEvent.click(screen.getByRole("button", { name: "Xóa gói bàn giao" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Xóa gói bàn giao" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent("đưa kế hoạch về Nháp"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục, đưa kế hoạch về Nháp" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
    expect(remove.mock.calls[1][1]).toMatchObject({ params: { confirmPlanDeactivation: true } });
  });

  it("hiện mô tả gói bàn giao và lưu mô tả mới cùng etag hiện tại", async () => {
    const put = vi
      .spyOn(apiClient, "put")
      .mockResolvedValue({ ...group({ description: "Giấy tờ nhà" }), etag: "container-v2" });
    renderGroup(group({ description: "Giấy tờ cũ" }));
    expect(screen.getAllByText("Giấy tờ cũ").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Mô tả (không bắt buộc)"), {
      target: { value: "Giấy tờ nhà" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({
      name: containerFixture.name,
      description: "Giấy tờ nhà",
      etag: containerFixture.etag,
    });
  });

  it("gói bàn giao đã xóa chỉ xem, khóa mọi nút thay đổi", () => {
    renderGroup(group({ status: "REMOVED" }));
    expect(screen.getByText(/đã bị xóa/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gỡ khỏi gói bàn giao" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Xóa gói bàn giao" })).toBeDisabled();
  });
});
