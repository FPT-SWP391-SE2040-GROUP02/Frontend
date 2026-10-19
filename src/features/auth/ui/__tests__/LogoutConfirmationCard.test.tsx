import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import type { User } from "@/entities/user";
import { STATUS } from "@/shared/constants";
import { ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/config/routes.config";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { sessionAuthService as authService } from "../../api/authService";
import { LogoutConfirmationCard } from "../LogoutConfirmationCard";
import { LOGOUT_CONTENT, LOGOUT_ROLE_LABELS } from "../../model/logout.content";

vi.mock("../../api/authService", () => ({
  sessionAuthService: { logout: vi.fn() },
  authService: {},
}));

/** Tài khoản giả phục vụ kiểm tra cleanup, không tạo phiên BE thật. */
const USER: User = {
  id: "logout-test-user",
  fullName: "Test Owner",
  email: "owner@example.test",
  role: ROLES.OWNER,
  status: STATUS.ACTIVE,
  createdAt: "2026-10-10T00:00:00Z",
};
/** Query private phải được giữ khi server thất bại và xóa khi logout thành công. */
const PRIVATE_KEY = ["logout-private-fixture"] as const;

beforeEach(() => {
  vi.resetAllMocks();
  accessTokenMemory.set("test-access-token");
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
});

/** @returns Providers thật và state để kiểm tra kết quả từ UI đến hook. */
function setup(user: User | null = USER) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (user) store.dispatch(setCredentials({ user }));
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(PRIVATE_KEY, "private-data");
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[ROUTES.AUTH.LOGOUT]}>
          <Routes>
            <Route path={ROUTES.AUTH.LOGOUT} element={<LogoutConfirmationCard />} />
            <Route path={ROUTES.AUTH.LOGGED_OUT} element={<p>Logout confirmed</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  return { store, client };
}

describe("LogoutConfirmationCard", () => {
  it("does not fabricate an account or heartbeat deadline when account data is absent", () => {
    const { client } = setup(null);
    expect(screen.getByRole("status")).toHaveTextContent(LOGOUT_CONTENT.accountUnavailable);
    expect(screen.getByText(LOGOUT_CONTENT.dmsGuidance)).toBeInTheDocument();
    expect(screen.queryByText(/Nguyễn Văn Nam|nam@example.com|28\/10\/2026|21 ngày/)).toBeNull();
    client.clear();
  });

  it.each(Object.values(ROLES))("displays the actual account and role %s", (role) => {
    const { client } = setup({ ...USER, role });
    expect(screen.getByText(USER.fullName)).toBeInTheDocument();
    expect(screen.getByText(`${LOGOUT_ROLE_LABELS[role]} · ${USER.email}`)).toBeInTheDocument();
    client.clear();
  });

  it("keeps the session on failure and clears it only after a successful retry", async () => {
    vi.mocked(authService.logout)
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(undefined);
    const { store, client } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Logout confirmed")).not.toBeInTheDocument();
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(accessTokenMemory.get()).toBe("test-access-token");
    expect(client.getQueryData(PRIVATE_KEY)).toBe("private-data");

    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(await screen.findByText("Logout confirmed")).toBeInTheDocument();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(accessTokenMemory.get()).toBeNull();
    expect(client.getQueryData(PRIVATE_KEY)).toBeUndefined();
    expect(authService.logout).toHaveBeenCalledTimes(2);
    expect(authService.logout).toHaveBeenLastCalledWith({ revokeAllDevices: false });
    client.clear();
  });

  it("waits for server confirmation and prevents duplicate clicks", async () => {
    let resolveLogout!: () => void;
    vi.mocked(authService.logout).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogout = resolve;
      }),
    );
    const { store, client } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    const pendingButton = await screen.findByRole("button", { name: "Đang xử lý..." });
    expect(pendingButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ở lại" })).toBeDisabled();
    fireEvent.click(pendingButton);
    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(accessTokenMemory.get()).toBe("test-access-token");
    expect(screen.queryByText("Logout confirmed")).not.toBeInTheDocument();
    await act(async () => {
      resolveLogout();
    });
    client.clear();
  });

  it("passes the all-devices choice to the cookie logout service", async () => {
    vi.mocked(authService.logout).mockResolvedValue(undefined);
    const { client } = setup();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    await screen.findByText("Logout confirmed");
    expect(authService.logout).toHaveBeenCalledWith({ revokeAllDevices: true });
    client.clear();
  });
});
