import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { AxiosError, AxiosHeaders } from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { PlanSetupPanel } from "@/features/plan-setup/ui/PlanSetupPanel";
import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { ExecutorInvitationPanel } from "@/features/plan-setup/ui/ExecutorInvitationPanel";
import { planSetupSchema } from "@/features/plan-setup/model/planSetup.schema";

const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;
const setupFixture = {
  planStatus: "DRAFT",
  configVersion: 7,
  canActivate: true,
  missingRequirements: [],
  policyVersion: "setup-2026-10-15",
  policyText: "Cảnh báo hạn phản hồi, tải và lưu/xóa.",
  executorScopeVersion: "executor-2026-10-15",
  executorScopeText: "Phạm vi Executor.",
  executors: [],
  containers: [
    {
      id: CONTAINER_ID,
      name: "Gói gia đình",
      status: "READY",
      assetCount: 5,
      designationCount: 2,
      missingRequirements: [],
    },
  ],
  assetsOutsideContainer: [],
  warnings: [],
};
const invitationFixture = {
  id: CONTAINER_ID,
  status: "INVITED",
  inviteeEmail: "executor@example.test",
  isBeneficiary: false,
  expiresAt: CREATED_AT,
  acceptedAt: null,
  invitationSentAt: null,
  acceptedScopeVersion: null,
  etag: '"0"',
};
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("setup-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});
function setup(children: ReactNode, authenticated = true) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (authenticated)
    store.dispatch(
      setCredentials({
        user: {
          id: VAULT_ID,
          email: "fixture@example.test",
          fullName: "Fixture",
          role: "USER",
          status: "ACTIVE",
          emailVerified: true,
          hasPassword: false,
          createdAt: CREATED_AT,
        },
      }),
    );
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  return store;
}

it("requires explicit Owner acknowledgement and sends current config/policy only once", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(setupFixture);
  const post = vi
    .spyOn(apiClient, "post")
    .mockResolvedValue({ ...setupFixture, planStatus: "ACTIVE", canActivate: false });
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  const activate = await screen.findByRole("button", { name: "Kích hoạt kế hoạch" });
  expect(activate).toBeDisabled();
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(activate);
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/activate`, {
    configVersion: 7,
    policyVersion: "setup-2026-10-15",
    acknowledgePolicy: true,
  });
});

it("missing eKYC and Executor keep activation disabled even after acknowledgement", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    canActivate: false,
    missingRequirements: ["OWNER_EKYC_REQUIRED", "PRIMARY_EXECUTOR_REQUIRED"],
    containers: [],
    assetsOutsideContainer: [],
    warnings: [],
  });
  const post = vi.spyOn(apiClient, "post");
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  expect(
    await screen.findByText("Chủ kho cần hoàn tất xác minh danh tính eKYC."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("button", { name: "Kích hoạt kế hoạch" })).toBeDisabled();
  expect(post).not.toHaveBeenCalled();
});

it("retains server failure and does not retry activation or show success", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(setupFixture);
  const post = vi.spyOn(apiClient, "post").mockRejectedValue(
    new AxiosError("private", undefined, undefined, undefined, {
      status: 409,
      statusText: "Conflict",
      config: { headers: new AxiosHeaders() },
      headers: {},
      data: { code: "PLAN_ACTIVATION_REQUIREMENTS_NOT_MET" },
    }),
  );
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  const activate = await screen.findByRole("button", { name: "Kích hoạt kế hoạch" });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(activate);
  expect(await screen.findByRole("alert")).toHaveTextContent("Kế hoạch chưa đủ điều kiện");
  expect(post).toHaveBeenCalledTimes(1);
});

it("does not misreport an undelivered invitation as accepted or sent", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({ ...setupFixture, executors: [invitationFixture] });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  expect(await screen.findByText(/Chưa xác nhận gửi được email/)).toBeInTheDocument();
  expect(screen.getByText(/Chờ phản hồi/)).toBeInTheDocument();
  expect(screen.queryByText("Đã chấp nhận")).not.toBeInTheDocument();
});

it("keeps inspect separate from acceptance, sends token in body and never caches it", async () => {
  const token = "synthetic-invitation-token-at-least-32-characters";
  const requests: { url?: string; data: unknown }[] = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push({ url: config.url, data: config.data });
    return {
      data: config.url?.endsWith("inspect")
        ? {
            expiresAt: CREATED_AT,
            status: "INVITED",
            scopeVersion: "executor-2026-10-15",
            scopeText: "Phạm vi thử.",
          }
        : {
            ...invitationFixture,
            status: "ACCEPTED",
            acceptedAt: CREATED_AT,
            acceptedScopeVersion: "executor-2026-10-15",
          },
      config,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    };
  };
  setup(<ExecutorInvitationPanel token={token} />);
  const accept = await screen.findByRole("button", { name: "Chấp nhận lời mời" });
  expect(accept).toBeDisabled();
  expect(requests).toHaveLength(1);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(accept);
  expect(await screen.findByText("Bạn đã là người thực hiện")).toBeInTheDocument();
  expect(requests).toHaveLength(2);
  expect(requests[1].url).toBe("/executor-invitations/respond");
  expect(JSON.parse(String(requests[1].data))).toMatchObject({
    token,
    accept: true,
    acknowledgeScope: true,
  });
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((q) => ({ key: q.queryKey, data: q.state.data })),
    ),
  ).not.toContain(token);
  expect(client.getMutationCache().getAll()).toHaveLength(0);
});

it("guest only inspects and receives login redirect, no acceptance controls", async () => {
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({
    expiresAt: CREATED_AT,
    status: "INVITED",
    scopeVersion: "v1",
    scopeText: "Scope",
  });
  setup(<ExecutorInvitationPanel token={"x".repeat(40)} />, false);
  expect(await screen.findByRole("link", { name: "Đăng nhập để tự quyết định" })).toHaveAttribute(
    "href",
    expect.stringContaining("%23token%3D"),
  );
  expect(screen.queryByRole("button", { name: "Chấp nhận lời mời" })).not.toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(1);
});

it("rejects a malformed readiness response rather than pretending activation is available", () => {
  expect(planSetupSchema.safeParse({ ...setupFixture, canActivate: "true" }).success).toBe(false);
});

it("lets Owner activate when the server says canActivate and shows no backup warning", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(setupFixture);
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  expect(await screen.findByRole("button", { name: "Kích hoạt kế hoạch" })).toBeInTheDocument();
  expect(screen.queryByText(/dự phòng/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("button", { name: "Kích hoạt kế hoạch" })).toBeEnabled();
});

it("sends Owner eKYC to the Owner dashboard", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    canActivate: false,
    missingRequirements: ["OWNER_EKYC_REQUIRED"],
  });
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  expect(await screen.findByRole("link", { name: "Đi xác minh danh tính" })).toHaveAttribute(
    "href",
    "/dashboard/identity",
  );
});

it("recovers a failed readiness request without automatically activating", async () => {
  const get = vi
    .spyOn(apiClient, "get")
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValue(setupFixture);
  const post = vi.spyOn(apiClient, "post");
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  await screen.findByText(/Sẵn sàng kích hoạt/);
  expect(get).toHaveBeenCalledTimes(2);
  expect(post).not.toHaveBeenCalled();
});

it.each(["containers", "assetsOutsideContainer", "warnings"])(
  "rejects a missing %s contract field",
  (field) => {
    const response: Record<string, unknown> = { ...setupFixture };
    delete response[field];
    expect(planSetupSchema.safeParse(response).success).toBe(false);
  },
);

it("hiện checklist kích hoạt: mục đạt có dấu tích, mục thiếu kèm lối đi tiếp", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    canActivate: false,
    missingRequirements: ["OWNER_EKYC_REQUIRED", "PRIMARY_EXECUTOR_REQUIRED"],
  });
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  expect(await screen.findByText("Có ít nhất một gói sẵn sàng bàn giao.")).toBeInTheDocument();
  expect(screen.getByText("Gói dịch vụ trả phí còn hạn.")).toBeInTheDocument();
  expect(screen.getByText("Cần Executor đã chấp nhận nhiệm vụ.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Đến Người tin cậy" })).toHaveAttribute(
    "href",
    "/dashboard/trusted-people",
  );
  expect(screen.getByRole("link", { name: "Đi xác minh danh tính" })).toBeInTheDocument();
  expect(screen.queryByText("Đã xác minh danh tính eKYC.")).not.toBeInTheDocument();
  // Hai điều kiện thiếu trong bốn điều kiện: đạt 2/4, thanh tiến độ 50%.
  expect(screen.getByText("Đã đạt 2/4 điều kiện")).toBeInTheDocument();
  expect(screen.getByRole("progressbar", { name: "Tiến độ điều kiện kích hoạt" })).toHaveAttribute(
    "aria-valuenow",
    "50",
  );
});

const acceptedPrimary = {
  ...invitationFixture,
  id: VAULT_ID,
  status: "ACCEPTED",
  inviteeEmail: "chinh@example.test",
  acceptedAt: CREATED_AT,
  invitationSentAt: CREATED_AT,
};
const pendingReplacement = {
  ...invitationFixture,
  inviteeEmail: "moi@example.test",
};

it("Người tin cậy: kế hoạch nháp mời được Executor, không gửi vai trò", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(setupFixture);
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(invitationFixture);
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Mời người thực hiện" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Email Executor"), {
    target: { value: "executor@example.test" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Gửi lời mời" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/executors`, {
    email: "executor@example.test",
    beneficiaryId: null,
  });
});

it("Người tin cậy: kế hoạch đang chạy không cho thu hồi người chính trực tiếp, chỉ mời người thay", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    planStatus: "ACTIVE",
    executors: [acceptedPrimary],
  });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  await screen.findByText("chinh@example.test");
  expect(screen.getByRole("button", { name: "Mời người thay" })).toBeInTheDocument();
  // Người thực hiện đã nhận nhiệm vụ phải đi qua "Mời người thay", không có nút Thu hồi.
  expect(screen.queryByRole("button", { name: "Thu hồi" })).not.toBeInTheDocument();
  expect(screen.getByText(/không thu hồi trực tiếp/)).toBeInTheDocument();
});

it("Người tin cậy: kế hoạch nháp thu hồi Executor gửi etag hiện tại và chờ Backend xác nhận", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    executors: [acceptedPrimary],
  });
  const post = vi
    .spyOn(apiClient, "post")
    .mockResolvedValue({ ...acceptedPrimary, status: "REVOKED" });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Thu hồi" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Thu hồi chinh@example.test?")).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Thu hồi" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/executors/${VAULT_ID}/revoke`, {
    etag: '"0"',
  });
});

it("Người tin cậy: giữ nguyên lỗi của Backend khi thu hồi bị chặn, không báo thành công", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    executors: [acceptedPrimary],
  });
  vi.spyOn(apiClient, "post").mockRejectedValue(
    new AxiosError("private", undefined, undefined, undefined, {
      status: 409,
      statusText: "Conflict",
      config: { headers: new AxiosHeaders() },
      headers: {},
      data: { code: "EXECUTOR_NOT_ALLOWED", reason: "REPLACEMENT_REQUIRED" },
    }),
  );
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Thu hồi" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Thu hồi" }));
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("nên không thu hồi trực tiếp");
});

it("Người tin cậy: kế hoạch có hồ sơ báo tử chỉ xem, không có nút thao tác", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    planStatus: "DEATH_CASE_OPEN",
    executors: [acceptedPrimary],
  });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  await screen.findByText("chinh@example.test");
  expect(screen.getByText(/Bạn chỉ xem được/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Mời người thực hiện" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Thu hồi" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Mời người thay" })).not.toBeInTheDocument();
});

it("Người tin cậy: rào lỗi ngay trên form nếu Owner tự mời chính mình", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(setupFixture);
  const post = vi.spyOn(apiClient, "post");
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Mời người thực hiện" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Email Executor"), {
    target: { value: "fixture@example.test" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Gửi lời mời" }));
  expect(
    await within(dialog).findByText("Bạn không thể tự mời chính mình làm Người thực hiện."),
  ).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});

it("Người tin cậy: rào lỗi ngay trên form nếu mời trùng email với Executor hiện có", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    executors: [acceptedPrimary, pendingReplacement],
  });
  const post = vi.spyOn(apiClient, "post");
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Mời người thay" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Email Executor"), {
    target: { value: "moi@example.test" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Gửi lời mời" }));
  expect(
    await within(dialog).findByText("Email này đã được mời hoặc đang là Người thực hiện."),
  ).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});
