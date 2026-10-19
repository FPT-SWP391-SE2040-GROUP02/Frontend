import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { CREATED_AT, VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { ROUTES } from "@/shared/config/routes.config";
import { ROLES } from "@/shared/constants/roles";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { AdminWorkspacePage } from "@/pages/admin/AdminWorkspacePage";
import { AdminUsersFilters } from "@/features/admin/ui/AdminUsersFilters";

const dashboardFixture = {
  openIncidents: 4,
  overdueIncidents: 1,
  unassignedIncidents: 0,
  activeHolds: 2,
  holdsPastReview: 0,
  activeVerifiers: 3,
  activeAdmins: 1,
  casesWithoutVerifier: 2,
  serverTime: "2026-10-18T02:42:00+00:00",
};
const makeUser = (index: number) => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  email: `user${index}@example.test`,
  fullName: `Người dùng ${index}`,
  role: index === 1 ? "VERIFIER" : "USER",
  status: index === 2 ? "LOCKED" : "ACTIVE",
  emailVerified: index !== 2,
  createdAt: CREATED_AT,
  lastLoginAt: index === 1 ? CREATED_AT : null,
  etag: `u-${index}`,
});
const pageOf = (pageIndex: number, totalPages = 3, count = 2) => ({
  items: Array.from({ length: count }, (_, i) => makeUser(pageIndex * 10 + i + 1)),
  totalCount: totalPages * 20,
  pageIndex,
  pageSize: 20,
  totalPages,
  hasPreviousPage: pageIndex > 1,
  hasNextPage: pageIndex < totalPages,
});

const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("admin-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function setup(initialPath: string, role: "ADMIN" | "USER" = "ADMIN") {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: VAULT_ID,
        email: "admin@example.test",
        fullName: "Quản trị",
        role,
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
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path={ROUTES.ADMIN.ROOT} element={<AdminWorkspacePage />} />
              <Route path={ROUTES.ADMIN.AUDIT_LOG} element={<AdminWorkspacePage />} />
              <Route path={ROUTES.DASHBOARD.USERS} element={<AdminWorkspacePage />} />
            </Route>
            <Route path="*" element={<p>Trang khác</p>} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

function httpError(status: number) {
  const headers = new AxiosHeaders();
  return new AxiosError("fail", "ERR", { headers }, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers },
    data: {},
  });
}

const usersCalls = (get: { mock: { calls: unknown[][] } }) =>
  get.mock.calls.filter((call) => call[0] === "/admin/users");

it("Admin xem đủ 8 bộ đếm thật và giờ máy chủ; số cần xử lý > 0 được đánh dấu", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(dashboardFixture);
  setup(ROUTES.ADMIN.ROOT);
  expect(await screen.findByText("Quá hạn xử lý")).toBeInTheDocument();
  expect(get).toHaveBeenCalledWith("/admin/dashboard", expect.anything());
  for (const label of [
    "Đang mở",
    "Chưa có người phụ trách",
    "Đang hiệu lực",
    "Quá hạn rà soát",
    "Người xét duyệt hoạt động",
    "Quản trị viên hoạt động",
    "Hồ sơ chưa có người xét duyệt",
  ])
    expect(screen.getByText(label)).toBeInTheDocument();
  expect(screen.getAllByText("Cần xử lý")).toHaveLength(2);
  expect(screen.getByText(/giờ máy chủ/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Người dùng" })).toHaveAttribute(
    "href",
    ROUTES.DASHBOARD.USERS,
  );
});

it("404 từ BE hiện không có quyền, không hiện số 0 hay nút thử lại", async () => {
  vi.spyOn(apiClient, "get").mockRejectedValue(httpError(404));
  setup(ROUTES.ADMIN.ROOT);
  expect(await screen.findByText(/không có quyền truy cập khu vực quản trị/)).toBeInTheDocument();
  expect(screen.queryByText("Đang mở")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
});

it("response dashboard thiếu field bị phát hiện, thử lại được", async () => {
  const user = userEvent.setup();
  const missing: Partial<typeof dashboardFixture> = { ...dashboardFixture };
  delete missing.serverTime;
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(missing);
  setup(ROUTES.ADMIN.ROOT);
  expect(await screen.findByText("Dữ liệu từ máy chủ không hợp lệ.")).toBeInTheDocument();
  get.mockResolvedValue(dashboardFixture);
  await user.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByText("Quá hạn xử lý")).toBeInTheDocument();
});

it("non-Admin bị chặn trước khi gọi API quản trị", async () => {
  const get = vi.spyOn(apiClient, "get");
  setup(ROUTES.ADMIN.ROOT, "USER");
  expect(await screen.findByText("Trang khác")).toBeInTheDocument();
  expect(screen.getByTestId("location")).toHaveTextContent(ROUTES.ERROR.FORBIDDEN);
  expect(get).not.toHaveBeenCalled();
});

it("bộ lọc từ URL được gửi đúng tên query của AdminController", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(pageOf(1));
  setup(`${ROUTES.DASHBOARD.USERS}?q=an&role=VERIFIER&status=LOCKED&page=2`);
  await screen.findAllByText("user11@example.test");
  expect(get).toHaveBeenCalledWith("/admin/users", {
    params: { pageIndex: 2, pageSize: 20, search: "an", role: "VERIFIER", status: "LOCKED" },
    signal: expect.any(AbortSignal),
  });
  expect(screen.getByRole("button", { name: "Người xét duyệt" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByLabelText("Trạng thái")).toHaveValue("LOCKED");
});

it("giá trị URL sai enum bị bỏ qua thay vì gửi lên BE", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(pageOf(1));
  setup(`${ROUTES.DASHBOARD.USERS}?role=OWNER&status=x&page=abc`);
  await screen.findAllByText("user11@example.test");
  expect(get).toHaveBeenCalledWith("/admin/users", {
    params: { pageIndex: 1, pageSize: 20 },
    signal: expect.any(AbortSignal),
  });
});

it("gõ tìm kiếm chỉ gọi một lần sau debounce và quay về trang 1", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(pageOf(1));
  setup(`${ROUTES.DASHBOARD.USERS}?page=2`);
  await screen.findAllByText("user11@example.test");
  const before = usersCalls(get).length;
  const input = screen.getByLabelText("Tìm theo tên hoặc email");
  fireEvent.change(input, { target: { value: "l" } });
  fireEvent.change(input, { target: { value: "la" } });
  fireEvent.change(input, { target: { value: "lan" } });
  expect(usersCalls(get)).toHaveLength(before);
  await act(async () => {
    vi.advanceTimersByTime(450);
  });
  await waitFor(() => expect(usersCalls(get)).toHaveLength(before + 1));
  expect(usersCalls(get).at(-1)?.[1]).toMatchObject({
    params: { pageIndex: 1, pageSize: 20, search: "lan" },
  });
  expect(screen.getByTestId("location")).toHaveTextContent(`${ROUTES.DASHBOARD.USERS}?q=lan`);
});

it("đổi tìm kiếm từ URL hủy debounce cũ và đồng bộ ô nhập", async () => {
  vi.useFakeTimers();
  const onChange = vi.fn();
  const props = {
    filters: { search: "old", role: undefined, status: undefined },
    hasFilters: true,
    onChange,
    onClear: vi.fn(),
  };
  const view = render(<AdminUsersFilters {...props} />);
  fireEvent.change(screen.getByLabelText("Tìm theo tên hoặc email"), {
    target: { value: "pending" },
  });
  view.rerender(<AdminUsersFilters {...props} filters={{ ...props.filters, search: "back" }} />);
  expect(screen.getByLabelText("Tìm theo tên hoặc email")).toHaveValue("back");
  await act(async () => {
    vi.advanceTimersByTime(450);
  });
  expect(onChange).not.toHaveBeenCalled();
});

it.each(["?q=an", "?role=ADMIN"])(
  "xoá bộ lọc %s hủy tìm kiếm đang chờ debounce",
  async (search) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(pageOf(1));
    setup(`${ROUTES.DASHBOARD.USERS}${search}`);
    await screen.findAllByText("user11@example.test");
    const input = screen.getByLabelText("Tìm theo tên hoặc email");
    fireEvent.change(input, { target: { value: "new" } });
    fireEvent.click(screen.getByRole("button", { name: "Xoá bộ lọc" }));
    expect(input).toHaveValue("");
    await act(async () => {
      vi.advanceTimersByTime(450);
    });
    expect(screen.getByTestId("location")).toHaveTextContent(
      new RegExp(`${ROUTES.DASHBOARD.USERS}$`),
    );
    expect(get).not.toHaveBeenCalledWith(
      "/admin/users",
      expect.objectContaining({ params: expect.objectContaining({ search: "new" }) }),
    );
  },
);

it("đổi vai trò về trang 1; xoá bộ lọc trả URL sạch", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(pageOf(1));
  setup(`${ROUTES.DASHBOARD.USERS}?q=an&page=3`);
  await screen.findAllByText("user11@example.test");
  await user.click(screen.getByRole("button", { name: "Quản trị viên" }));
  expect(screen.getByTestId("location")).toHaveTextContent(
    `${ROUTES.DASHBOARD.USERS}?q=an&role=ADMIN`,
  );
  await user.click(screen.getByRole("button", { name: "Xoá bộ lọc" }));
  expect(screen.getByTestId("location")).toHaveTextContent(
    new RegExp(`${ROUTES.DASHBOARD.USERS}$`),
  );
  expect(screen.getByLabelText("Tìm theo tên hoặc email")).toHaveValue("");
});

it("phân trang theo hasNextPage của BE và hiển thị nhãn tiếng Việt", async () => {
  const user = userEvent.setup();
  const get = vi
    .spyOn(apiClient, "get")
    .mockImplementation(async (_url, config) =>
      pageOf((config?.params as { pageIndex: number }).pageIndex),
    );
  setup(ROUTES.DASHBOARD.USERS);
  await screen.findAllByText("user11@example.test");
  expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();
  expect(
    within(screen.getByRole("table")).getAllByRole("cell", { name: "Người dùng" }),
  ).toHaveLength(2);
  expect(screen.getAllByText("Chưa đăng nhập").length).toBeGreaterThan(0);
  await user.click(screen.getByRole("button", { name: "Trang sau" }));
  await screen.findAllByText("user21@example.test");
  expect(screen.getByTestId("location")).toHaveTextContent("page=2");
  expect(usersCalls(get).at(-1)?.[1]).toMatchObject({ params: { pageIndex: 2 } });
});

it("rỗng có filter khác rỗng không filter; out-of-range có đường về trang cuối", async () => {
  const user = userEvent.setup();
  const get = vi
    .spyOn(apiClient, "get")
    .mockResolvedValue({ ...pageOf(1, 0, 0), totalCount: 0, hasNextPage: false });
  setup(`${ROUTES.DASHBOARD.USERS}?q=zzz`);
  expect(await screen.findByText("Không có tài khoản khớp bộ lọc.")).toBeInTheDocument();
  cleanup();

  get.mockResolvedValue({ ...pageOf(1, 0, 0), totalCount: 0, hasNextPage: false });
  setup(ROUTES.DASHBOARD.USERS);
  expect(await screen.findByText("Chưa có tài khoản nào.")).toBeInTheDocument();
  cleanup();

  get.mockImplementation(async (_url, config) => {
    const pageIndex = (config?.params as { pageIndex: number }).pageIndex;
    return {
      ...pageOf(Math.min(pageIndex, 3)),
      pageIndex,
      items: pageIndex > 3 ? [] : pageOf(pageIndex).items,
    };
  });
  setup(`${ROUTES.DASHBOARD.USERS}?page=9`);
  expect(await screen.findByText("Trang 9 không tồn tại.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Về trang cuối" }));
  await screen.findAllByText("user31@example.test");
  expect(screen.getByTestId("location")).toHaveTextContent("page=3");
});

it("users 404 không thành danh sách rỗng; 400 có đặt lại bộ lọc", async () => {
  const user = userEvent.setup();
  const get = vi.spyOn(apiClient, "get").mockRejectedValue(httpError(404));
  setup(ROUTES.DASHBOARD.USERS);
  expect(await screen.findByText(/không có quyền truy cập/)).toBeInTheDocument();
  expect(screen.queryByText("Chưa có tài khoản nào.")).not.toBeInTheDocument();
  cleanup();
  client.clear();

  get.mockRejectedValue(httpError(400));
  setup(`${ROUTES.DASHBOARD.USERS}?q=bad`);
  expect(await screen.findByText("Bộ lọc không hợp lệ.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Đặt lại bộ lọc" }));
  expect(screen.getByTestId("location")).toHaveTextContent(
    new RegExp(`${ROUTES.DASHBOARD.USERS}$`),
  );
});

it("trang nhật ký kiểm toán không gọi API và không dựng dữ liệu mẫu", async () => {
  const get = vi.spyOn(apiClient, "get");
  setup(ROUTES.ADMIN.AUDIT_LOG);
  expect(await screen.findByText(/chưa có API ở Backend/)).toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
  expect(screen.queryByText(/DEMO-AUDIT/)).not.toBeInTheDocument();
});
