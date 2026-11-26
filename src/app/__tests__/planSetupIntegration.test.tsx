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
  assignedAssetCount: 5,
  unassignedAssets: [],
  warnings: [],
};
const invitationFixture = {
  id: CONTAINER_ID,
  status: "INVITED",
  inviteeEmail: "executor@example.test",
  expiresAt: CREATED_AT,
  acceptedAt: null,
  invitationSentAt: null,
  acceptedScopeVersion: null,
  etag: '"0"',
};
const directoryFixture = [
  ["executor@example.test", "Luật sư Một"],
  ["fixture@example.test", "Chủ tài sản"],
  ["moi@example.test", "Luật sư Mới"],
].map(([email, fullName], index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`,
  fullName,
  email,
  phoneMasked: null,
  executorRoleTitle: "Người thực thi",
  assignedVaultsCount: 0,
  isAvailable: true,
}));

/** GET /system-executors trả danh bạ, mọi GET khác trả dữ liệu kế hoạch. */
function mockGetWith(setup: unknown) {
  return vi
    .spyOn(apiClient, "get")
    .mockImplementation(async (url: string) =>
      url === "/system-executors" ? directoryFixture : setup,
    );
}

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
const PIN = "482913";
const PIN_LABEL = "Nhập mã PIN của kho (6 số)";
/** Tick ô xác nhận và nhập đủ PIN để nút Ký và kích hoạt mở khóa. */
function agreeAndEnterPin(pin = PIN): void {
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.change(screen.getByLabelText(PIN_LABEL), { target: { value: pin } });
}

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

it("requires explicit Owner acknowledgement and PIN, sends current config/policy once with X-Vault-Pin", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(setupFixture);
  const post = vi
    .spyOn(apiClient, "post")
    .mockResolvedValue({ ...setupFixture, planStatus: "ACTIVE", canActivate: false });
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  await openPreview();
  const activate = await screen.findByRole("button", { name: "Ký và gửi Người thực thi" });
  expect(activate).toBeDisabled();
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(activate).toBeDisabled();
  fireEvent.change(screen.getByLabelText(PIN_LABEL), { target: { value: PIN } });
  fireEvent.click(activate);
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith(
    `/vaults/${VAULT_ID}/activate`,
    {
      configVersion: 7,
      policyVersion: "setup-2026-10-15",
      acknowledgePolicy: true,
    },
    expect.objectContaining({ headers: { "X-Vault-Pin": PIN } }),
  );
});

it("missing eKYC and Executor keep activation disabled even after acknowledgement", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    canActivate: false,
    missingRequirements: ["OWNER_EKYC_REQUIRED", "PRIMARY_EXECUTOR_REQUIRED"],
    assignedAssetCount: 0,
    unassignedAssets: [],
    warnings: [],
  });
  const post = vi.spyOn(apiClient, "post");
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  expect(
    await screen.findByText("Chủ tài sản cần hoàn tất xác minh danh tính eKYC."),
  ).toBeInTheDocument();
  await openPreview();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("button", { name: "Ký và gửi Người thực thi" })).toBeDisabled();
  expect(screen.getByLabelText(PIN_LABEL)).toBeDisabled();
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
  await openPreview();
  const activate = await screen.findByRole("button", { name: "Ký và gửi Người thực thi" });
  agreeAndEnterPin();
  fireEvent.click(activate);
  expect(await screen.findByText(/Kế hoạch chưa đủ điều kiện/)).toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(1);
});

it("does not misreport an undelivered invitation as accepted or sent", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({ ...setupFixture, executors: [invitationFixture] });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  expect(await screen.findByText(/Chưa xác nhận gửi được email/)).toBeInTheDocument();
  expect(screen.getByText("Chờ đồng ý")).toBeInTheDocument();
  expect(screen.queryByText("Đã đồng ý")).not.toBeInTheDocument();
});

it("keeps inspect separate from acceptance, sends token in body and never caches it", async () => {
  const token = "synthetic-invitation-token-at-least-32-characters";
  const requests: { url?: string; data: unknown }[] = [];
  apiClient.defaults.adapter = async (config) => {
    if (config.url === "/dev/clock") {
      // Đồng hồ hệ thống (chế độ demo) chạy song song với lời mời; không thuộc luồng lời mời nên không đếm.
      const now = new Date().toISOString();
      return {
        data: { nowUtc: now, realNowUtc: now, offsetSeconds: 0, isSimulated: false },
        config,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
      };
    }
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
  // Trả lời ở trang Lời mời, nơi xem được biên bản phân chia trước khi ký.
  expect(await screen.findByRole("link", { name: "Xem biên bản và trả lời" })).toHaveAttribute(
    "href",
    "/executor/invitations",
  );
  expect(screen.queryByRole("button", { name: "Ký nhận vai" })).not.toBeInTheDocument();
  expect(requests).toHaveLength(1);
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
  expect(screen.queryByRole("button", { name: "Ký nhận vai" })).not.toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(1);
});

it("shows the real reason and no retry when the invitation is no longer valid", async () => {
  vi.spyOn(apiClient, "post").mockRejectedValue(
    new AxiosError("private", undefined, undefined, undefined, {
      status: 404,
      statusText: "Not Found",
      config: { headers: new AxiosHeaders() },
      headers: {},
      data: { code: "EXECUTOR_INVITATION_INVALID" },
    }),
  );
  setup(<ExecutorInvitationPanel token={"x".repeat(40)} />, false);
  expect(await screen.findByText("Lời mời không còn dùng được")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Về trang chủ" })).toBeInTheDocument();
});

/** Mở khung xem trước biên bản phân chia (nút ở cột phải đổi chữ theo trạng thái) rồi chờ khung hiện. */
async function openPreview(): Promise<void> {
  fireEvent.click(await screen.findByRole("button", { name: /^Xem trước/ }));
  await screen.findByRole("dialog", { name: "Xem trước biên bản phân chia" });
}
it("offers retry when the invitation check fails because of the network", async () => {
  vi.spyOn(apiClient, "post").mockRejectedValue(new AxiosError("net"));
  setup(<ExecutorInvitationPanel token={"x".repeat(40)} />, false);
  expect(await screen.findByText("Không kết nối được máy chủ")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
});

it("rejects a malformed readiness response rather than pretending activation is available", () => {
  expect(planSetupSchema.safeParse({ ...setupFixture, canActivate: "true" }).success).toBe(false);
});

it("lets Owner activate when the server says canActivate and shows no backup warning", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(setupFixture);
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  await openPreview();
  expect(
    await screen.findByRole("button", { name: "Ký và gửi Người thực thi" }),
  ).toBeInTheDocument();
  expect(screen.queryByText(/dự phòng/)).not.toBeInTheDocument();
  agreeAndEnterPin();
  expect(screen.getByRole("button", { name: "Ký và gửi Người thực thi" })).toBeEnabled();
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
  await screen.findByRole("region", { name: "Tiến độ bàn giao" });
  expect(get).toHaveBeenCalledTimes(2);
  expect(post).not.toHaveBeenCalled();
});

it("tolerates an older backend without the will fields and parses the new ones", () => {
  const older = planSetupSchema.safeParse(setupFixture);
  expect(older.success).toBe(true);
  const newer = planSetupSchema.safeParse({
    ...setupFixture,
    ownerFullName: "Trần Văn An",
    ownerEmail: "an@example.test",
    activatedAt: "2026-11-15T02:42:00Z",
    executors: [{ ...invitationFixture, fullName: "Lê Thị Mẫu" }],
    recipients: [
      {
        beneficiaryId: VAULT_ID,
        fullName: "Trần Thị Bình",
        hasMessage: true,
        assets: [{ id: CONTAINER_ID, name: "Sổ đỏ", kind: "FILE", sharedWithCount: 2 }],
      },
    ],
  });
  expect(newer.success).toBe(true);
  if (older.success && newer.success) {
    expect(older.data.recipients).toBeUndefined();
    expect(newer.data.recipients?.[0].hasMessage).toBe(true);
    expect(newer.data.executors[0].fullName).toBe("Lê Thị Mẫu");
  }
});

it.each(["assignedAssetCount", "unassignedAssets", "warnings"])(
  "rejects a missing %s contract field",
  (field) => {
    const response: Record<string, unknown> = { ...setupFixture };
    delete response[field];
    expect(planSetupSchema.safeParse(response).success).toBe(false);
  },
);

it("hiện thẻ việc: việc đạt có dấu xong, việc thiếu kèm nút đi tiếp, tiến độ 2/4", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    canActivate: false,
    missingRequirements: ["OWNER_EKYC_REQUIRED", "PRIMARY_EXECUTOR_REQUIRED"],
  });
  setup(<PlanSetupPanel vaultId={VAULT_ID} />);
  expect(await screen.findByRole("heading", { name: /Tài sản và người nhận/ })).toBeVisible();
  expect(screen.getByText(/^5 tài sản đã gán/)).toBeInTheDocument();
  expect(screen.getByText("Gói dịch vụ trả phí còn hạn.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Chọn Người thực thi" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Đi xác minh danh tính" })).toBeInTheDocument();
  expect(screen.queryByText(/Đã xác minh\. Tên trên biên bản phân chia/)).not.toBeInTheDocument();
  // Hai điều kiện thiếu trong bốn điều kiện: đạt 2/4, danh sách điều kiện chưa đạt ở cột phải.
  const progress = screen.getByRole("region", { name: "Tiến độ bàn giao" });
  expect(within(progress).getByText("Còn 2 điều kiện chưa đạt")).toBeInTheDocument();
  expect(within(progress).getByText("Chưa xác minh danh tính (eKYC)")).toBeInTheDocument();
  expect(within(progress).getByText("Chưa chọn Người thực thi")).toBeInTheDocument();
  const bar = screen.getByRole("progressbar", { name: "Tiến độ điền biên bản phân chia" });
  expect(bar).toHaveAttribute("aria-valuenow", "2");
  expect(bar).toHaveAttribute("aria-valuemax", "4");
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

it("Người thực thi: kế hoạch nháp mời được Người thực thi, không gửi vai trò", async () => {
  mockGetWith(setupFixture);
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(invitationFixture);
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Chọn Người thực thi" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(
    await within(dialog).findByRole("button", { name: "Chọn người này: Luật sư Một" }),
  );
  fireEvent.click(within(dialog).getByRole("checkbox", { name: /là nhân viên LegacyVault/ }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Gửi lời mời" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  // Người thực thi không còn kiêm người nhận: payload chỉ có email.
  expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/executors`, {
    email: "executor@example.test",
  });
  const sent = post.mock.calls[0][1] as Record<string, unknown>;
  expect(Object.keys(sent)).toEqual(["email"]);
});

it("Người thực thi: kế hoạch đang chạy không cho thu hồi trực tiếp, chỉ Thay người khác", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    planStatus: "ACTIVE",
    executors: [acceptedPrimary],
  });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  await screen.findByText("chinh@example.test");
  expect(screen.getByRole("button", { name: "Thay người khác" })).toBeInTheDocument();
  // Người thực thi đã đồng ý phải đi qua "Thay người khác", không có nút thu hồi.
  expect(screen.queryByRole("button", { name: /^Thu hồi/ })).not.toBeInTheDocument();
  expect(screen.getByText(/không thu hồi trực tiếp/)).toBeInTheDocument();
});

it("Người thực thi: kế hoạch nháp thu hồi gửi etag hiện tại và chờ Backend xác nhận", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    executors: [acceptedPrimary],
  });
  const post = vi
    .spyOn(apiClient, "post")
    .mockResolvedValue({ ...acceptedPrimary, status: "REVOKED" });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Thu hồi vai" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Thu hồi vai Người thực thi?")).toBeInTheDocument();
  expect(dialog).toHaveTextContent("Người này sẽ không còn là Người thực thi của kho.");
  expect(dialog).not.toHaveTextContent("Liên kết trong email mời");
  expect(within(dialog).getByRole("button", { name: "Giữ nguyên" })).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Thu hồi vai" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/executors/${VAULT_ID}/revoke`, {
    etag: '"0"',
  });
});

it("Người thực thi: gửi lại lời mời thành công thì báo đã gửi kèm hạn mới", async () => {
  const suspended = { ...acceptedPrimary, status: "SUSPENDED" };
  vi.spyOn(apiClient, "get").mockResolvedValue({ ...setupFixture, executors: [suspended] });
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({
    ...suspended,
    status: "INVITED",
    acceptedAt: null,
    invitationSentAt: CREATED_AT,
  });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Gửi lại lời mời" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/executors/${VAULT_ID}/resend`, {
    etag: '"0"',
  });
  expect(await screen.findByText(/Đã gửi lại lời mời tới chinh@example.test/)).toBeInTheDocument();
});

it("Người thực thi: gửi lại mà máy chủ chưa gửi được email thì không báo đã gửi", async () => {
  const suspended = { ...acceptedPrimary, status: "SUSPENDED" };
  vi.spyOn(apiClient, "get").mockResolvedValue({ ...setupFixture, executors: [suspended] });
  vi.spyOn(apiClient, "post").mockResolvedValue({
    ...suspended,
    status: "INVITED",
    acceptedAt: null,
    invitationSentAt: null,
  });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Gửi lại lời mời" }));
  expect(await screen.findByText(/chưa gửi được email/)).toBeInTheDocument();
  expect(screen.queryByText(/Đã gửi lại lời mời tới/)).not.toBeInTheDocument();
});

it("Người thực thi: giữ nguyên lỗi của Backend khi thu hồi bị chặn, không báo thành công", async () => {
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
  fireEvent.click(await screen.findByRole("button", { name: "Thu hồi vai" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Thu hồi vai" }));
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("nên không thu hồi trực tiếp");
});

it("Người thực thi: kế hoạch có hồ sơ báo tử chỉ xem, không có nút thao tác", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...setupFixture,
    planStatus: "HANDOVER_REQUESTED",
    executors: [acceptedPrimary],
  });
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  await screen.findByText("chinh@example.test");
  expect(screen.getByText(/Bạn chỉ xem được/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Chọn Người thực thi" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Thu hồi/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Thay người khác" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Gửi lại lời mời" })).not.toBeInTheDocument();
});

it("Người thực thi: rào lỗi ngay trên form nếu Owner tự mời chính mình", async () => {
  mockGetWith(setupFixture);
  const post = vi.spyOn(apiClient, "post");
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Chọn Người thực thi" }));
  const dialog = await screen.findByRole("dialog");
  expect(
    await within(dialog).findByRole("button", { name: "Chọn người này: Chủ tài sản" }),
  ).toBeDisabled();
  expect(within(dialog).getByText("Đây là tài khoản của bạn.")).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});

it("Người thực thi: rào lỗi ngay trên form nếu mời trùng email với Người thực thi hiện có", async () => {
  mockGetWith({ ...setupFixture, executors: [acceptedPrimary, pendingReplacement] });
  const post = vi.spyOn(apiClient, "post");
  setup(<ExecutorsSection vaultId={VAULT_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Thay người khác" }));
  const dialog = await screen.findByRole("dialog");
  // Người đã được mời không chọn được: nút bị khóa kèm lý do, không có request nào gửi đi.
  expect(
    await within(dialog).findByRole("button", { name: "Chọn người này: Luật sư Mới" }),
  ).toBeDisabled();
  expect(
    within(dialog).getByText("Người này đã được mời hoặc đang là Người thực thi."),
  ).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});
