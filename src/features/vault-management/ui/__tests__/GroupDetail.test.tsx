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

function backendError(code: string) {
  return new AxiosError("private", undefined, undefined, undefined, {
    status: 403,
    statusText: "Forbidden",
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
    const select = screen.getByLabelText("Chọn người nhận");
    expect(within(select).queryByRole("option", { name: "Con trưởng" })).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: OTHER_PERSON_ID } });
    fireEvent.click(screen.getByRole("button", { name: "Gán người nhận" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      `/vaults/${VAULT_ID}/containers/${CONTAINER_ID}/beneficiaries`,
      { beneficiaryId: OTHER_PERSON_ID },
    );
  });

  it("lưu tên gói bàn giao xong vẫn giữ ô đồng ý đã tick", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...group(), name: "Tên mới" });
    renderGroup();
    const consent = screen.getByRole("checkbox", { name: /đưa kế hoạch về Nháp/ });
    fireEvent.click(consent);
    fireEvent.change(screen.getByLabelText("Tên gói bàn giao"), { target: { value: "Tên mới" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Đã lưu thay đổi.")).toBeInTheDocument();
    expect(consent).toBeChecked();
  });

  it("gói Free bị chặn thì giữ lỗi của Backend kèm đường nâng cấp", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(backendError("PAID_TIER_REQUIRED"));
    renderGroup();
    fireEvent.change(screen.getByLabelText("Chọn người nhận"), {
      target: { value: OTHER_PERSON_ID },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gán người nhận" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("gói dịch vụ trả phí");
    expect(screen.getByRole("link", { name: "Xem gói dịch vụ" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });

  it("xóa gói bàn giao hỏi xác nhận trước, rồi lưu trữ không tự đồng ý đưa kế hoạch về Nháp", async () => {
    const remove = vi
      .spyOn(apiClient, "delete")
      .mockResolvedValue({ ...group(), status: "ARCHIVED" });
    renderGroup();
    fireEvent.click(screen.getByRole("button", { name: "Xóa gói bàn giao" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/^Xóa gói bàn giao “.+”\?$/)).toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Xóa gói bàn giao" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(remove.mock.calls[0][1]).toMatchObject({ params: { confirmPlanDeactivation: false } });
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

  it("gói bàn giao đã lưu trữ chỉ xem, khóa mọi nút thay đổi", () => {
    renderGroup(group({ status: "ARCHIVED" }));
    expect(screen.getByText(/đã được lưu trữ/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gỡ khỏi gói bàn giao" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Xóa gói bàn giao" })).toBeDisabled();
  });
});
