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
import { adminActionError } from "@/features/admin/model/adminError";

const OTHER_USER_ID = "66666666-6666-4666-8666-666666666666";
const ADMIN_ID = VAULT_ID;

const page = <T,>(items: T[]) => ({
  items,
  totalCount: items.length,
  pageIndex: 1,
  pageSize: 20,
  totalPages: items.length === 0 ? 0 : 1,
  hasPreviousPage: false,
  hasNextPage: false,
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
    expect(screen.getByText(/dòng/)).toHaveTextContent("2 dòng");
    expect(screen.getByRole("note")).toHaveTextContent("chỉ xem");
    expect(callsTo("get", "/admin/payment-transactions")[0].params).toEqual({
      pageIndex: 1,
      pageSize: 20,
    });
    expect(calls.filter((call) => call.method !== "get")).toHaveLength(0);
  });

  it("lọc theo trạng thái gửi đúng tham số và báo rỗng khi không khớp", async () => {
    backend((call) => {
      if (call.params?.status === "SUCCESS") return page([]);
      return page([paymentBody()]);
    });
    setup(paymentsPath);
    expect(await screen.findByText(/199\.000 VND/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Trạng thái"), { target: { value: "SUCCESS" } });
    expect(await screen.findByText("Không có giao dịch khớp bộ lọc.")).toBeInTheDocument();
    expect(callsTo("get", "/admin/payment-transactions").at(-1)?.params).toEqual({
      status: "SUCCESS",
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

  it("tạo và đổi sang vai trò EXECUTOR được (Người thực thi hệ thống cho danh bạ của Chủ tài sản)", async () => {
    usersBackend();
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click(await screen.findByRole("button", { name: /Tạo tài khoản/ }));
    const createDialog = await screen.findByRole("dialog");
    const createOptions = within(within(createDialog).getByLabelText(/Vai trò hệ thống/))
      .getAllByRole("option")
      .map((option) => option.getAttribute("value"));
    expect(createOptions).toEqual(["VERIFIER", "EXECUTOR", "ADMIN"]);
    fireEvent.click(within(createDialog).getByRole("button", { name: "Hủy" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click((await screen.findAllByRole("button", { name: /Đổi vai trò của Bạn Hai/ }))[0]);
    const roleDialog = await screen.findByRole("dialog");
    await userEvent.click(within(roleDialog).getByLabelText("Vai trò mới"));
    const roleOptions = (await screen.findAllByRole("option")).map((option) => option.textContent);
    expect(roleOptions).toEqual([
      "Người dùng",
      "Người xét duyệt",
      "Người thực thi",
      "Quản trị viên",
    ]);
  });

  it("tạo Người thực thi: chỉ 1 bước tài khoản, không có bước ảnh thẻ, tạo xong không tải ảnh", async () => {
    const NEW_ID = "77777777-7777-4777-8777-777777777777";
    usersBackend((call) => {
      if (call.method === "post" && call.url === "/admin/users") {
        return userBody(NEW_ID, "EXECUTOR", "Nhan Vien Thu");
      }
      return undefined;
    });
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click(await screen.findByRole("button", { name: /Tạo tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/Họ và tên/), "Nhan Vien Thu");
    await userEvent.type(within(dialog).getByLabelText(/Email đăng nhập/), "nv.thu@example.test");
    await userEvent.selectOptions(within(dialog).getByLabelText(/Vai trò hệ thống/), "EXECUTOR");
    // Người thực thi có ô mật khẩu khởi tạo nhưng không bắt buộc: để trống thì nhận thư mời đặt mật khẩu.
    expect(within(dialog).getByLabelText(/Mật khẩu khởi tạo/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Để trống thì hệ thống gửi thư mời/)).toBeInTheDocument();
    // Không có thanh bước, không có nút Tiếp tục, không có ô ảnh thẻ và không còn chữ nói Người thực thi có thẻ.
    expect(within(dialog).queryByRole("listitem")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Tiếp tục" })).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Ảnh thẻ/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/xác minh pháp lý/)).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Tạo tài khoản" }));

    await waitFor(() => expect(callsTo("post", "/admin/users")).toHaveLength(1));
    expect(callsTo("post", "/admin/users")[0].body).toMatchObject({ role: "EXECUTOR" });
    expect(calls.some((call) => call.url.includes("notary-card"))).toBe(false);
  });

  it("tạo tài khoản: số điện thoại sai định dạng bị chặn ngay dưới ô, đúng thì gửi đi", async () => {
    const NEW_ID = "77777777-7777-4777-8777-777777777778";
    usersBackend((call) => {
      if (call.method === "post" && call.url === "/admin/users") {
        return userBody(NEW_ID, "EXECUTOR", "Nhan Vien Thu");
      }
      return undefined;
    });
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click(await screen.findByRole("button", { name: /Tạo tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/Họ và tên/), "Nhan Vien Thu");
    await userEvent.type(within(dialog).getByLabelText(/Email đăng nhập/), "nv.thu@example.test");
    await userEvent.selectOptions(within(dialog).getByLabelText(/Vai trò hệ thống/), "EXECUTOR");
    const phone = within(dialog).getByLabelText(/Số điện thoại/);

    await userEvent.type(phone, "3232");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tạo tài khoản" }));
    expect(
      await within(dialog).findByText(/Số điện thoại không đúng định dạng/),
    ).toBeInTheDocument();
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(callsTo("post", "/admin/users")).toHaveLength(0);

    await userEvent.clear(phone);
    await userEvent.type(phone, "091 234 5678");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tạo tài khoản" }));
    await waitFor(() => expect(callsTo("post", "/admin/users")).toHaveLength(1));
    expect(callsTo("post", "/admin/users")[0].body).toMatchObject({ phone: "091 234 5678" });
  });

  it("tạo tài khoản: Người xét duyệt 2 bước (mật khẩu không bắt buộc), Quản trị viên 1 bước và bắt buộc mật khẩu", async () => {
    usersBackend();
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click(await screen.findByRole("button", { name: /Tạo tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    const role = within(dialog).getByLabelText(/Vai trò hệ thống/);

    await userEvent.selectOptions(role, "VERIFIER");
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(2);
    expect(within(dialog).getByLabelText(/Mật khẩu khởi tạo/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Để trống thì hệ thống gửi thư mời/)).toBeInTheDocument();

    await userEvent.selectOptions(role, "EXECUTOR");
    expect(within(dialog).queryByRole("listitem")).not.toBeInTheDocument();

    await userEvent.selectOptions(role, "ADMIN");
    expect(within(dialog).queryByRole("listitem")).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Mật khẩu khởi tạo/)).toBeInTheDocument();
  });

  it("tạo tài khoản: họ tên chứa số bị chặn ở bước 1", async () => {
    usersBackend();
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click(await screen.findByRole("button", { name: /Tạo tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/Họ và tên/), "3213213");
    await userEvent.type(within(dialog).getByLabelText(/Email đăng nhập/), "a@example.test");

    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));

    expect(
      await within(dialog).findByText("Họ và tên chỉ được chứa chữ cái và khoảng trắng."),
    ).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Ảnh thẻ/)).not.toBeInTheDocument();
  });

  it("tạo tài khoản: Quay lại rồi Tiếp tục vẫn về bước ảnh thẻ, không tự tạo tài khoản; họ tên không nhận số", async () => {
    usersBackend();
    const post = vi.spyOn(apiClient, "post");
    const put = vi.spyOn(apiClient, "put");
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click(await screen.findByRole("button", { name: /Tạo tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/Họ và tên/), "3213213");
    await userEvent.type(within(dialog).getByLabelText(/Email đăng nhập/), "ls.thu@example.test");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByText(/Họ và tên chỉ được chứa chữ cái/)).toBeInTheDocument();

    await userEvent.clear(within(dialog).getByLabelText(/Họ và tên/));
    await userEvent.type(within(dialog).getByLabelText(/Họ và tên/), "Luật Sư Thử");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByLabelText(/Ảnh thẻ/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    await userEvent.click(await within(dialog).findByRole("button", { name: "Tiếp tục" }));

    expect(await within(dialog).findByLabelText(/Ảnh thẻ/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("tạo tài khoản: bước 1 báo lỗi ô thiếu và chưa cho sang bước sau", async () => {
    usersBackend();
    setup(ROUTES.DASHBOARD.USERS);
    fireEvent.click(await screen.findByRole("button", { name: /Tạo tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.selectOptions(within(dialog).getByLabelText(/Vai trò hệ thống/), "VERIFIER");

    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));

    expect(await within(dialog).findByText("Vui lòng nhập họ và tên.")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Ảnh thẻ luật sư/)).not.toBeInTheDocument();
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
  it.each([
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
});
