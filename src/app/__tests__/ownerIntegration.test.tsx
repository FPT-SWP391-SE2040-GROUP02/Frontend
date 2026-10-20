import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AxiosHeaders, AxiosError } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import {
  VAULT_ID,
  CONTAINER_ID,
  CREATED_AT,
  containerFixture,
  vaultFixture,
  pageFixture,
} from "@/shared/api/__tests__/backend.fixtures";
import { CreateAssetForm } from "@/features/assets/ui/CreateAssetForm";
import { GroupDetail } from "@/features/vault-management/ui/GroupDetail";
import { CreateGroupDialog } from "@/features/vault-management/ui/CreateGroupDialog";
import { BeneficiaryForm } from "@/features/beneficiaries/ui/BeneficiaryForm";
import { CheckInNowButton } from "@/features/dms/ui/CheckInNowButton";
import { CheckInSettingsForm } from "@/features/dms/ui/CheckInSettingsForm";
import { ownerVaultKeys } from "@/features/vault-management/model/useOwnerVault";
import { OwnerContainer } from "@/widgets/OwnerWorkspace/OwnerContainer";

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
it("reads container selection pagination from the URL and lets users reach another page", async () => {
  const pages: number[] = [];
  apiClient.defaults.adapter = async (config) => {
    let data: unknown = pageFixture([]);
    if (config.url === "/vaults/me") data = vaultFixture;
    else if (config.url?.endsWith(`/containers/${CONTAINER_ID}`)) data = containerFixture;
    else if (config.url?.endsWith("/assets")) {
      pages.push(config.params.pageIndex);
      data = {
        ...pageFixture([]),
        pageIndex: config.params.pageIndex,
        totalCount: 200,
        totalPages: 2,
        hasPreviousPage: config.params.pageIndex > 1,
        hasNextPage: config.params.pageIndex < 2,
      };
    }
    return { data, config, status: 200, statusText: "OK", headers: new AxiosHeaders() };
  };
  setup(
    <Routes>
      <Route path="/dashboard/wills/:id" element={<OwnerContainer />} />
    </Routes>,
    `/dashboard/wills/${CONTAINER_ID}?assetPage=2`,
  );
  const previous = await screen.findByRole("button", { name: "Trang tài sản trước" });
  expect(pages).toContain(2);
  fireEvent.click(previous);
  await waitFor(() => expect(pages).toContain(1));
});
it("hides selection pagination when the vault has only one page of choices", async () => {
  apiClient.defaults.adapter = async (config) => {
    let data: unknown = pageFixture([]);
    if (config.url === "/vaults/me") data = vaultFixture;
    else if (config.url?.endsWith(`/containers/${CONTAINER_ID}`)) data = containerFixture;
    return { data, config, status: 200, statusText: "OK", headers: new AxiosHeaders() };
  };
  setup(
    <Routes>
      <Route path="/dashboard/wills/:id" element={<OwnerContainer />} />
    </Routes>,
    `/dashboard/wills/${CONTAINER_ID}`,
  );
  expect(await screen.findByRole("button", { name: "Xóa nhóm" })).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Phân trang lựa chọn cho nhóm" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Tải lại nhóm và bỏ thay đổi chưa lưu" })).toBeNull();
});
const asset = {
  id: CONTAINER_ID,
  vaultId: VAULT_ID,
  name: "Ghi chú",
  description: null,
  kind: "TEXT",
  currentVersion: {
    versionNumber: 1,
    fileName: null,
    contentType: "text/plain",
    sizeBytes: 4,
    createdAt: CREATED_AT,
  },
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
  fireEvent.click(screen.getByRole("button", { name: "Tệp" }));
  fireEvent.change(screen.getByLabelText("Tên mục"), { target: { value: "Tệp" } });
  fireEvent.change(screen.getByLabelText("Tệp tài sản"), {
    target: { files: [new File(["oversize"], "fixture.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu vào kho" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("dung lượng còn lại");
  expect(post).not.toHaveBeenCalled();
});
it("creates a scoped container only after valid submit", async () => {
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(containerFixture);
  const onClose = vi.fn();
  setup(<CreateGroupDialog vaultId={VAULT_ID} onClose={onClose} />);
  fireEvent.click(await screen.findByRole("button", { name: "Tạo nhóm" }));
  expect(post).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Hồ sơ" } });
  fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/containers`, {
    name: "Hồ sơ",
    description: "",
  });
});
it("retains edits after a 409 and never overwrites using a fresh etag or retries", async () => {
  const put = vi.spyOn(apiClient, "put").mockRejectedValue({
    isAxiosError: true,
    response: { status: 409, data: { code: "EDIT_CONFLICT" } },
  });
  setup(
    <GroupDetail
      container={{
        ...containerFixture,
        assetIds: [],
        beneficiaryIds: [],
        missingRequirements: [...containerFixture.missingRequirements],
      }}
      assets={[]}
      beneficiaries={[]}
    />,
  );
  fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Tên đang sửa" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Dữ liệu đã thay đổi");
  expect(screen.getByLabelText("Tên nhóm")).toHaveValue("Tên đang sửa");
  expect(put).toHaveBeenCalledTimes(1);
  expect(put.mock.calls[0][1]).toMatchObject({ etag: "container-v1" });
  expect(client.getQueryData(ownerVaultKeys.package(VAULT_ID, CONTAINER_ID))).toBeUndefined();
});
it("does not silently confirm plan deactivation when detaching the last asset", async () => {
  apiClient.defaults.adapter = async (config) => {
    throw new AxiosError("fixture", "ERR_BAD_REQUEST", config, undefined, {
      config,
      status: 409,
      statusText: "Conflict",
      headers: new AxiosHeaders(),
      data: { code: "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED" },
    });
  };
  const remove = vi.spyOn(apiClient, "delete");
  setup(
    <GroupDetail
      container={{
        ...containerFixture,
        assetIds: [VAULT_ID],
        beneficiaryIds: [],
        missingRequirements: [...containerFixture.missingRequirements],
      }}
      assets={[{ id: VAULT_ID, label: "Tệp" }]}
      beneficiaries={[]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Gỡ khỏi nhóm" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("đưa kế hoạch về nháp");
  expect(remove).toHaveBeenCalledTimes(1);
  expect(remove.mock.calls[0][1]).toMatchObject({ params: { confirmPlanDeactivation: false } });
});
it("requires contact information before submitting a beneficiary", async () => {
  const post = vi.spyOn(apiClient, "post");
  setup(<BeneficiaryForm vaultId={VAULT_ID} />);
  fireEvent.change(screen.getByLabelText("Số CCCD"), { target: { value: "012345678901" } });
  fireEvent.change(screen.getByLabelText("Họ tên"), { target: { value: "Người nhận thử" } });
  fireEvent.change(screen.getByLabelText("Ngày sinh"), { target: { value: "2015-01-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Tạo hồ sơ người nhận" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("ít nhất email");
  expect(post).not.toHaveBeenCalled();
});
const checkIn = {
  status: "NOT_STARTED" as const,
  planStatus: "DRAFT",
  serverTime: CREATED_AT,
  lastCheckInAt: null,
  nextCheckInDueAt: null,
  graceEndsAt: null,
  settings: {
    cycleDays: 30,
    graceDays: 7,
    pendingCycleDays: null,
    pendingGraceDays: null,
    etag: "settings-v1",
  },
  history: {
    items: [],
    totalCount: 0,
    pageIndex: 1,
    pageSize: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};
it("does not check in a draft plan and saves only the confirmed schedule fields with etag", async () => {
  const post = vi.spyOn(apiClient, "post");
  const patch = vi.spyOn(apiClient, "patch").mockResolvedValue(checkIn);
  setup(
    <>
      <CheckInNowButton vaultId={VAULT_ID} status={checkIn} label="Điểm danh bây giờ" />
      <CheckInSettingsForm vaultId={VAULT_ID} status={checkIn} />
    </>,
  );
  expect(screen.getByRole("button", { name: "Điểm danh bây giờ" })).toBeDisabled();
  expect(post).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Chu kỳ"), { target: { value: "60" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu lịch điểm danh" }));
  await waitFor(() =>
    expect(patch).toHaveBeenCalledWith("/vaults/me/check-in-settings", {
      etag: "settings-v1",
      cycleDays: 60,
      graceDays: 7,
    }),
  );
});
