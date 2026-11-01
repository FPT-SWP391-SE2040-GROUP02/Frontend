import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { CREATED_AT, VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { ROUTES } from "@/shared/config/routes.config";
import { AdminWorkspacePage } from "@/pages/admin/AdminWorkspacePage";
import { adminService } from "@/features/admin/api/adminService";
import { reviewDateError } from "@/features/admin/model/admin.content";
import { adminActionError } from "@/features/admin/model/adminError";

const INCIDENT_ID = "11111111-1111-4111-8111-111111111111";
const CASE_ID = "22222222-2222-4222-8222-222222222222";
const HOLD_ID = "33333333-3333-4333-8333-333333333333";
const OWNER_ALIVE_HOLD_ID = "44444444-4444-4444-8444-444444444444";
const VERIFIER_ID = "55555555-5555-4555-8555-555555555555";
const OTHER_USER_ID = "66666666-6666-4666-8666-666666666666";
const ADMIN_ID = VAULT_ID;
const KHO_ID = "77777777-7777-4777-8777-777777777777";

const page = <T,>(items: T[]) => ({
  items,
  totalCount: items.length,
  pageIndex: 1,
  pageSize: 20,
  totalPages: items.length === 0 ? 0 : 1,
  hasPreviousPage: false,
  hasNextPage: false,
});

const incidentSummary = (over: Record<string, unknown> = {}) => ({
  id: INCIDENT_ID,
  type: "NO_VERIFIER",
  status: "OPEN",
  vaultId: KHO_ID,
  targetType: "DEATH_CASE",
  targetId: CASE_ID,
  summary: "Hồ sơ chứng tử chưa có Verifier phù hợp để xét.",
  assigneeUserId: null,
  dueAt: "2026-10-21T00:00:00Z",
  overdue: false,
  nextReviewAt: "2026-10-20T00:00:00Z",
  createdAt: "2026-10-19T00:00:00Z",
  etag: "inc-1",
  ...over,
});
const incidentDetail = (over: Record<string, unknown> = {}) => ({
  ...incidentSummary(over),
  remindedCount: 0,
  escalatedAt: null,
  resolvedAt: null,
  resolutionNote: null,
  events: [
    { kind: "RAISED", actorUserId: null, note: "Phát sinh tự động", at: "2026-10-19T00:00:00Z" },
  ],
});
const holdBody = (over: Record<string, unknown> = {}) => ({
  id: HOLD_ID,
  vaultId: KHO_ID,
  scope: "VAULT",
  targetId: null,
  type: "ADMIN",
  status: "ACTIVE",
  reason: "Tranh chấp quyền thừa kế",
  responsibleUserId: ADMIN_ID,
  reviewAt: "2026-10-22T00:00:00Z",
  reviewOverdue: false,
  createdAt: "2026-10-19T00:00:00Z",
  releasedAt: null,
  releaseReason: null,
  etag: "hold-1",
  ...over,
});
const paymentBody = (over: Record<string, unknown> = {}) => ({
  id: "88888888-8888-4888-8888-888888888888",
  provider: "SePay",
  environment: "Test",
  providerTransactionId: 92704,
  status: "MATCHED",
  reconciliationReason: null,
  transferType: "IN",
  transferAmount: 199000,
  currency: "VND",
  paymentOrderId: null,
  paymentCode: "LVTEST01",
  gateway: "TestBank",
  referenceCode: "REF-01",
  transactionAt: "2026-10-19T00:00:00Z",
  receivedAt: "2026-10-19T00:00:05Z",
  processedAt: "2026-10-19T00:00:05Z",
  ...over,
});
const userBody = (id: string, role: string, name: string) => ({
  id,
  email: `${name.toLowerCase().replaceAll(" ", "")}@example.test`,
  fullName: name,
  role,
  status: "ACTIVE",
  emailVerified: true,
  createdAt: CREATED_AT,
  lastLoginAt: null,
  etag: `u-${id.slice(0, 4)}`,
});

class Fail {
  readonly status: number;
  readonly body: object;
  constructor(status: number, body: object = {}) {
    this.status = status;
    this.body = body;
  }
}
interface Call {
  method: string;
  url: string;
  params: Record<string, unknown> | undefined;
  body: unknown;
}
const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;
let calls: Call[];

/** Giả lập Backend theo route; trả `Fail` để mô phỏng lỗi HTTP có mã và lý do. */
function backend(handler: (call: Call) => unknown) {
  calls = [];
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const call: Call = {
      method: config.method ?? "get",
      url: config.url ?? "",
      params: config.params as Record<string, unknown> | undefined,
      body: typeof config.data === "string" ? JSON.parse(config.data) : undefined,
    };
    calls.push(call);
    const result = handler(call);
    if (result instanceof Fail) {
      throw new AxiosError("fail", "ERR_BAD_REQUEST", config, undefined, {
        config,
        data: result.body,
        status: result.status,
        statusText: "Error",
        headers: new AxiosHeaders(),
      });
    }
    return {
      config,
      data: result,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    } satisfies AxiosResponse;
  };
}
const callsTo = (method: string, url: string) =>
  calls.filter((call) => call.method === method && call.url === url);

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("admin-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

/** Mở ô chọn tùy biến trong hộp thoại rồi bấm một lựa chọn theo nhãn hiển thị. */
async function chooseOption(dialog: HTMLElement, fieldLabel: string, optionName: string) {
  await userEvent.click(within(dialog).getByLabelText(fieldLabel));
  await userEvent.click(await screen.findByRole("option", { name: optionName }));
}

function setup(path: string) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: ADMIN_ID,
        email: "admin@example.test",
        fullName: "Quản trị",
        role: "ADMIN",
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
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.ADMIN.ROOT} element={<AdminWorkspacePage />} />
            <Route path={ROUTES.DASHBOARD.USERS} element={<AdminWorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

const incidentsPath = `${ROUTES.ADMIN.ROOT}?view=incidents`;
const holdsPath = `${ROUTES.ADMIN.ROOT}?view=holds`;

describe("Sự cố", () => {
  it("tải danh sách, lọc theo trạng thái và ghi bộ lọc lên API", async () => {
    backend(() => page([incidentSummary()]));
    setup(incidentsPath);
    expect(await screen.findByText(/Hồ sơ chứng tử chưa có Verifier/)).toBeInTheDocument();
    expect(screen.getAllByText("Chưa có người phụ trách").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Trạng thái"), { target: { value: "OPEN" } });
    await waitFor(() =>
      expect(callsTo("get", "/admin/incidents").at(-1)?.params).toMatchObject({
        status: "OPEN",
        pageIndex: 1,
      }),
    );
  });

  it("phân biệt danh sách rỗng khi không và có bộ lọc, và cho xóa bộ lọc", async () => {
    backend(() => page([]));
    setup(`${incidentsPath}&status=RESOLVED`);
    expect(await screen.findByText("Không có sự cố khớp bộ lọc.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));
    expect(await screen.findByText("Hiện chưa có sự cố nào.")).toBeInTheDocument();
  });

  it("hiện lỗi thật kèm nút thử lại, không đổi thành danh sách rỗng", async () => {
    let fail = true;
    backend(() => (fail ? new Fail(500) : page([incidentSummary()])));
    setup(incidentsPath);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Hiện chưa có sự cố nào.")).not.toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText(/Hồ sơ chứng tử chưa có Verifier/)).toBeInTheDocument();
  });

  it("đóng sự cố cần xác nhận, gửi đúng etag và hiện trạng thái đã xử lý sau khi Backend xác nhận", async () => {
    let resolved = false;
    backend((call) => {
      if (call.url === `/admin/incidents/${INCIDENT_ID}/resolve`) {
        resolved = true;
        return incidentDetail({ status: "RESOLVED", etag: "inc-2" });
      }
      if (call.url === `/admin/incidents/${INCIDENT_ID}`)
        return incidentDetail(resolved ? { status: "RESOLVED", etag: "inc-2" } : {});
      if (call.url.startsWith("/admin/users")) return page([]);
      return page([incidentSummary()]);
    });
    setup(`${incidentsPath}&incident=${INCIDENT_ID}`);
    fireEvent.click(await screen.findByRole("button", { name: "Đóng sự cố" }));
    const dialog = await screen.findByRole("dialog");
    const submit = within(dialog).getByRole("button", { name: "Đóng sự cố" });
    expect(submit).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText("Kết quả xử lý"), "Đã giao Verifier");
    fireEvent.click(within(dialog).getByRole("checkbox"));
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    expect(
      await screen.findByText("Sự cố đã được xử lý nên không còn thao tác."),
    ).toBeInTheDocument();
    expect(callsTo("post", `/admin/incidents/${INCIDENT_ID}/resolve`)[0].body).toEqual({
      note: "Đã giao Verifier",
      etag: "inc-1",
    });
  });

  it("giữ hộp thoại và báo lý do riêng khi sự cố đã được xử lý ở nơi khác", async () => {
    backend((call) => {
      if (call.url.endsWith("/resolve"))
        return new Fail(409, { code: "INCIDENT_NOT_OPEN", status: 409 });
      return incidentDetail();
    });
    setup(`${incidentsPath}&incident=${INCIDENT_ID}`);
    fireEvent.click(await screen.findByRole("button", { name: "Đóng sự cố" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Kết quả xử lý"), "Xong");
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Đóng sự cố" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Sự cố đã được xử lý nên không thể thao tác thêm.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("giao người xét duyệt cho hồ sơ chưa có Verifier và chỉ hiện nút này với NO_VERIFIER", async () => {
    backend((call) => {
      if (call.url === `/admin/incidents/${INCIDENT_ID}`) return incidentDetail();
      if (call.url === "/admin/users")
        return call.params?.role === "VERIFIER"
          ? page([userBody(VERIFIER_ID, "VERIFIER", "Cô Lan")])
          : page([]);
      return undefined;
    });
    setup(`${incidentsPath}&incident=${INCIDENT_ID}`);
    fireEvent.click(await screen.findByRole("button", { name: "Giao người xét duyệt" }));
    const dialog = await screen.findByRole("dialog");
    const select = await within(dialog).findByLabelText("Người xét duyệt");
    await userEvent.selectOptions(select, VERIFIER_ID);
    await userEvent.type(within(dialog).getByLabelText("Lý do"), "Verifier cũ nghỉ việc");
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Giao người xét duyệt" }));
    await waitFor(() =>
      expect(callsTo("post", `/admin/death-cases/${CASE_ID}/reassign-verifier`)).toHaveLength(1),
    );
    expect(callsTo("post", `/admin/death-cases/${CASE_ID}/reassign-verifier`)[0].body).toEqual({
      verifierUserId: VERIFIER_ID,
      reason: "Verifier cũ nghỉ việc",
    });
  });

  it("không hiện nút giao người xét duyệt với sự cố loại khác", async () => {
    backend((call) =>
      call.url === `/admin/incidents/${INCIDENT_ID}`
        ? incidentDetail({ type: "NOTIFICATION_FAILED", targetType: "DEATH_CASE" })
        : page([]),
    );
    setup(`${incidentsPath}&incident=${INCIDENT_ID}`);
    expect(await screen.findByRole("button", { name: "Giao người phụ trách" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Giao người xét duyệt" })).not.toBeInTheDocument();
  });

  it("sự cố chủ kho báo còn sống chỉ cho giao lại người xét duyệt của hồ sơ, không giao hay đóng tay", async () => {
    backend((call) => {
      if (call.url === `/admin/incidents/${INCIDENT_ID}`)
        return incidentDetail({ type: "OWNER_ALIVE", status: "IN_PROGRESS" });
      if (call.url === "/admin/users")
        return call.params?.role === "VERIFIER"
          ? page([userBody(VERIFIER_ID, "VERIFIER", "Cô Lan")])
          : page([]);
      return undefined;
    });
    setup(`${incidentsPath}&incident=${INCIDENT_ID}`);
    fireEvent.click(await screen.findByRole("button", { name: "Giao người xét duyệt" }));
    expect(screen.queryByRole("button", { name: "Giao người phụ trách" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đóng sự cố" })).not.toBeInTheDocument();
    expect(screen.getByText(/Sự cố này đi theo hồ sơ/)).toBeInTheDocument();
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("lời báo còn sống và sự cố cùng chuyển");
    await userEvent.selectOptions(
      await within(dialog).findByLabelText("Người xét duyệt"),
      VERIFIER_ID,
    );
    await userEvent.type(within(dialog).getByLabelText("Lý do"), "Người cũ nghỉ phép");
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Giao người xét duyệt" }));
    await waitFor(() =>
      expect(callsTo("post", `/admin/death-cases/${CASE_ID}/reassign-verifier`)).toHaveLength(1),
    );
    expect(calls.some((call) => call.url.endsWith("/assign"))).toBe(false);
  });

  it("hẹn xem lại gửi thời điểm ISO và đúng etag", async () => {
    backend((call) =>
      call.url === `/admin/incidents/${INCIDENT_ID}` ? incidentDetail() : page([]),
    );
    setup(`${incidentsPath}&incident=${INCIDENT_ID}`);
    fireEvent.click(await screen.findByRole("button", { name: "Hẹn xem lại" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Kết quả xem lại"), "Đã liên hệ Verifier");
    fireEvent.click(within(dialog).getByRole("button", { name: "Ghi nhận" }));
    await waitFor(() =>
      expect(callsTo("post", `/admin/incidents/${INCIDENT_ID}/review`)).toHaveLength(1),
    );
    const body = callsTo("post", `/admin/incidents/${INCIDENT_ID}/review`)[0].body as {
      nextReviewAt: string;
      etag: string;
    };
    expect(body.etag).toBe("inc-1");
    expect(new Date(body.nextReviewAt).toISOString()).toBe(body.nextReviewAt);
  });
});

describe("Tạm giữ (chỉ xem)", () => {
  it("hold do chủ kho báo còn sống giải thích vì sao và không có nút thao tác", async () => {
    backend(() => holdBody({ id: OWNER_ALIVE_HOLD_ID, type: "OWNER_ALIVE" }));
    setup(`${holdsPath}&hold=${OWNER_ALIVE_HOLD_ID}`);
    expect(
      await screen.findByText(/chỉ người xét duyệt kết luận mới gỡ được/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hẹn rà soát" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gỡ tạm giữ" })).not.toBeInTheDocument();
  });

  it("chi tiết hold khác cũng chỉ xem, không có nút hẹn rà soát hay gỡ", async () => {
    backend(() => holdBody());
    setup(`${holdsPath}&hold=${HOLD_ID}`);
    expect(await screen.findByText("Phạm vi")).toBeInTheDocument();
    expect(screen.getByText(/Quản trị viên chỉ xem/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hẹn rà soát" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gỡ tạm giữ" })).not.toBeInTheDocument();
    expect(calls.filter((call) => call.method === "post")).toHaveLength(0);
  });

  it("danh sách tạm giữ không có nút đặt tạm giữ", async () => {
    backend(() => page([holdBody()]));
    setup(holdsPath);
    expect(await screen.findByText("Tranh chấp quyền thừa kế")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đặt tạm giữ" })).not.toBeInTheDocument();
  });
});

describe("Giao dịch thanh toán (chỉ xem)", () => {
  const paymentsPath = `${ROUTES.ADMIN.ROOT}?view=payments`;

  it("hiện giao dịch, lý do lệch và không có nút sửa giao dịch", async () => {
    backend(() =>
      page([
        paymentBody(),
        paymentBody({
          id: "99999999-9999-4999-8999-999999999999",
          providerTransactionId: 92705,
          status: "RECONCILIATION_REQUIRED",
          reconciliationReason: "AMOUNT_MISMATCH",
          transferAmount: 150000,
        }),
      ]),
    );
    setup(paymentsPath);
    expect(await screen.findByText("Lý do: Số tiền khác tổng tiền đơn")).toBeInTheDocument();
    expect(screen.getByText(/199\.000 VND/)).toBeInTheDocument();
    expect(screen.getAllByText("Cần đối chiếu").length).toBeGreaterThan(0);
    expect(screen.getByText("2 giao dịch · Trang 1/1")).toBeInTheDocument();
    expect(within(screen.getByRole("note")).getByRole("link", { name: "Sự cố" })).toHaveAttribute(
      "href",
      `${ROUTES.ADMIN.ROOT}?view=incidents&type=PAYMENT`,
    );
    expect(callsTo("get", "/admin/payment-transactions")[0].params).toEqual({
      pageIndex: 1,
      pageSize: 20,
    });
    expect(calls.filter((call) => call.method !== "get")).toHaveLength(0);
  });

  it("lọc theo trạng thái gửi đúng tham số và báo rỗng khi không khớp", async () => {
    backend((call) => {
      if (call.params?.status === "RESOLVED") return page([]);
      return page([paymentBody()]);
    });
    setup(paymentsPath);
    expect(await screen.findByText(/199\.000 VND/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Trạng thái"), { target: { value: "RESOLVED" } });
    expect(await screen.findByText("Không có giao dịch khớp bộ lọc.")).toBeInTheDocument();
    expect(callsTo("get", "/admin/payment-transactions").at(-1)?.params).toEqual({
      status: "RESOLVED",
      pageIndex: 1,
      pageSize: 20,
    });
  });
});

describe("Tài khoản", () => {
  const usersBackend = (extra?: (call: Call) => unknown) =>
    backend((call) => {
      const custom = extra?.(call);
      if (custom !== undefined) return custom;
      return page([
        userBody(ADMIN_ID, "ADMIN", "Quản trị"),
        userBody(OTHER_USER_ID, "USER", "Bạn Hai"),
      ]);
    });

  it("ẩn thao tác với chính tài khoản đang đăng nhập (BR-74)", async () => {
    usersBackend();
    setup(ROUTES.DASHBOARD.USERS);
    expect((await screen.findAllByText("Tài khoản của bạn")).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Đổi vai trò của Bạn Hai/ }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /Đổi vai trò của Quản trị/ }),
    ).not.toBeInTheDocument();
  });

  it("đổi vai trò bắt buộc lý do và xác nhận, rồi gửi đúng body", async () => {
    usersBackend((call) =>
      call.method === "put" ? userBody(OTHER_USER_ID, "VERIFIER", "Bạn Hai") : undefined,
    );
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click((await screen.findAllByRole("button", { name: /Đổi vai trò của Bạn Hai/ }))[0]);
    const dialog = await screen.findByRole("dialog");
    const submit = within(dialog).getByRole("button", { name: "Đổi vai trò" });
    expect(submit).toBeDisabled();
    await chooseOption(dialog, "Vai trò mới", "Người xét duyệt");
    await userEvent.type(within(dialog).getByLabelText("Lý do"), "Bổ sung người xét duyệt");
    fireEvent.click(within(dialog).getByRole("checkbox"));
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() =>
      expect(callsTo("put", `/admin/users/${OTHER_USER_ID}/role`)).toHaveLength(1),
    );
    expect(callsTo("put", `/admin/users/${OTHER_USER_ID}/role`)[0].body).toEqual({
      role: "VERIFIER",
      reason: "Bổ sung người xét duyệt",
    });
  });

  it("không cho tạo hay đổi sang vai trò EXECUTOR (Executor do Owner mời theo từng kho)", async () => {
    usersBackend();
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click(await screen.findByRole("button", { name: /Tạo tài khoản/ }));
    const createDialog = await screen.findByRole("dialog");
    const createOptions = within(within(createDialog).getByLabelText(/Vai trò hệ thống/))
      .getAllByRole("option")
      .map((option) => option.getAttribute("value"));
    expect(createOptions).toEqual(["VERIFIER", "ADMIN"]);
    fireEvent.click(within(createDialog).getByRole("button", { name: "Hủy" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click((await screen.findAllByRole("button", { name: /Đổi vai trò của Bạn Hai/ }))[0]);
    const roleDialog = await screen.findByRole("dialog");
    await userEvent.click(within(roleDialog).getByLabelText("Vai trò mới"));
    const roleOptions = (await screen.findAllByRole("option")).map((option) => option.textContent);
    expect(roleOptions).toEqual(["Người dùng", "Người xét duyệt", "Quản trị viên"]);
  });

  it.each([
    ["LAST_ADMIN", "phải còn ít nhất một quản trị viên"],
    ["CANNOT_CHANGE_SELF", "không thể đổi vai trò hoặc trạng thái của chính mình"],
  ])("báo lý do %s của ADMIN_ACTION_NOT_ALLOWED khi khóa tài khoản", async (reason, text) => {
    usersBackend((call) =>
      call.method === "put"
        ? new Fail(409, { code: "ADMIN_ACTION_NOT_ALLOWED", reason })
        : undefined,
    );
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click(
      (await screen.findAllByRole("button", { name: /Đổi trạng thái của Bạn Hai/ }))[0],
    );
    const dialog = await screen.findByRole("dialog");
    await chooseOption(dialog, "Trạng thái mới", "Tạm khóa");
    await userEvent.type(within(dialog).getByLabelText("Lý do"), "Nghi ngờ truy cập trái phép");
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Đổi trạng thái" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(text);
  });
});

describe("Hợp đồng dịch vụ và thông báo lỗi", () => {
  it("không gửi request khi thiếu lý do hoặc hạn xem lại sai định dạng", async () => {
    backend(() => incidentDetail());
    await expect(
      adminService.assignIncident(INCIDENT_ID, {
        assigneeUserId: VERIFIER_ID,
        reason: "   ",
        etag: "inc-1",
      }),
    ).rejects.toThrow();
    await expect(
      adminService.reviewIncident(INCIDENT_ID, { nextReviewAt: "mai", note: "x", etag: "inc-1" }),
    ).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it("phát hiện response sự cố có loại ngoài hợp đồng", async () => {
    backend(() => page([incidentSummary({ type: "LOAI_LA" })]));
    await expect(adminService.listIncidents({ pageIndex: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("chỉ gửi bộ lọc có giá trị lên danh sách sự cố", async () => {
    backend(() => page([]));
    await adminService.listIncidents({ pageIndex: 2, pageSize: 20, overdueOnly: false });
    expect(calls[0].params).toEqual({ pageIndex: 2, pageSize: 20 });
    await adminService.listIncidents({
      pageIndex: 1,
      pageSize: 20,
      status: "OPEN",
      type: "NO_VERIFIER",
      overdueOnly: true,
    });
    expect(calls[1].params).toEqual({
      pageIndex: 1,
      pageSize: 20,
      status: "OPEN",
      type: "NO_VERIFIER",
      overdueOnly: true,
    });
  });

  it.each([
    [{ code: "INCIDENT_NOT_FOUND" }, "Không tìm thấy sự cố"],
    [{ code: "HOLD_NOT_FOUND" }, "Không tìm thấy tạm giữ"],
    [{ code: "USER_NOT_FOUND" }, "Không tìm thấy tài khoản"],
    [{ code: "EDIT_CONFLICT" }, "vừa bị thay đổi"],
    [
      { code: "ADMIN_ACTION_NOT_ALLOWED", reason: "CASE_NOT_PENDING" },
      "không còn ở giai đoạn chờ xét",
    ],
  ])("adminActionError đọc %j", (body, text) => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const error = new AxiosError("x", "ERR", config, undefined, {
      config,
      data: body,
      status: 409,
      statusText: "Conflict",
      headers: new AxiosHeaders(),
    });
    expect(adminActionError(error)).toContain(text);
  });

  it("adminActionError trả rỗng với lý do lạ để dùng câu chung", () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const error = new AxiosError("x", "ERR", config, undefined, {
      config,
      data: { code: "ADMIN_ACTION_NOT_ALLOWED", reason: "LY_DO_LA" },
      status: 409,
      statusText: "Conflict",
      headers: new AxiosHeaders(),
    });
    expect(adminActionError(error)).toBe("");
    expect(adminActionError(new Error("x"))).toBe("");
  });

  it("reviewDateError chặn quá khứ, quá 7 ngày và giá trị rỗng", () => {
    const now = new Date("2026-10-19T00:00:00Z");
    expect(reviewDateError("", now)).not.toBe("");
    expect(reviewDateError("2026-10-18T00:00:00Z", now)).toContain("tương lai");
    expect(reviewDateError("2026-10-27T00:00:00Z", now)).toContain("7 ngày");
    expect(reviewDateError("2026-10-21T00:00:00Z", now)).toBe("");
  });
});
