import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AxiosError } from "axios";
import authReducer from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { APP_MESSAGES, STATUS } from "@/shared/constants";
import { ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/config/routes.config";
import { cookieAuthService as authService } from "../../api/authService";
import type { AuthSessionDto as AuthSession } from "@/entities/user/model/authContract.types";
import { getLoginRedirect, getLoginErrorMessage } from "../../lib/loginFeedback";
import { LoginForm } from "../LoginForm";

vi.mock("../../api/authService", () => ({
  cookieAuthService: { login: vi.fn() },
  authService: {},
}));

/** Public cookie session fixture with no bearer tokens in JSON. */
const SESSION: AuthSession = {
  userId: "11111111-1111-4111-8111-111111111111",
  expiresIn: 300,
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Test Owner",
    email: "owner@example.test",
    role: ROLES.OWNER,
    status: STATUS.ACTIVE,
    createdAt: "2026-10-10T00:00:00Z",
    phone: null,
    updatedAt: null,
  },
};
const clients: QueryClient[] = [];

beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  accessTokenMemory.clear();
});

/** @returns Current destination for navigation assertions. */
function Destination() {
  const location = useLocation();
  return (
    <p>
      {location.pathname}
      {location.search}
      {location.hash}
    </p>
  );
}

/** @param query Login URL query. @returns Form rendered with real mutation and store providers. */
function setup(query = "") {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  clients.push(client);
  const store = configureStore({ reducer: { auth: authReducer } });
  const view = render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`${ROUTES.AUTH.LOGIN}${query}`]}>
          <Routes>
            <Route path={ROUTES.AUTH.LOGIN} element={<LoginForm />} />
            <Route path="*" element={<Destination />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  return { ...view, store, client };
}

/** @description Enter existing credentials without applying the new-password policy. */
function fillCredentials() {
  fireEvent.change(screen.getByLabelText("Email", { exact: true }), {
    target: { value: SESSION.user.email },
  });
  fireEvent.change(screen.getByLabelText("Mật khẩu", { exact: true }), {
    target: { value: "old" },
  });
}

describe("LoginForm", () => {
  it("does not restore the previous account's pending query after confirmed login", async () => {
    vi.mocked(authService.login).mockResolvedValue(SESSION);
    const { client, store } = setup();
    const previousAccountKey = ["vaults", "previous-account"];
    let resolvePrevious!: (value: string) => void;
    const pending = client
      .fetchQuery({
        queryKey: previousAccountKey,
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolvePrevious = resolve;
          }),
      })
      .catch(() => undefined);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
    await act(async () => {
      resolvePrevious("Previous owner's private data");
      await pending;
    });
    expect(client.getQueryData(previousAccountKey)).toBeUndefined();
    expect(store.getState().auth.user?.id).toBe(SESSION.user.id);
  });

  it("removes cached data from the previous account after confirmed login", async () => {
    vi.mocked(authService.login).mockResolvedValue(SESSION);
    const { client, store } = setup();
    const previousAccountKey = ["vaults", "previous-account"];
    client.setQueryData(previousAccountKey, { privateName: "Previous owner's vault" });
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
    expect(client.getQueryData(previousAccountKey)).toBeUndefined();
    expect(client.getQueryData(["auth", "session"])).toEqual({ user: SESSION.user });
  });

  it("keeps existing cached data when login fails", async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new AxiosError("network unavailable", AxiosError.ERR_NETWORK),
    );
    const { client } = setup();
    const previousAccountKey = ["vaults", "previous-account"];
    const previousData = { privateName: "Previous owner's vault" };
    client.setQueryData(previousAccountKey, previousData);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(APP_MESSAGES.ERROR.NETWORK);
    expect(client.getQueryData(previousAccountKey)).toEqual(previousData);
  });

  it("blocks invalid input locally before calling the API", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Email", { exact: true }), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(authService.login).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
  });

  it("does not invent a lockout after repeated network errors or a URL state", async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new AxiosError("private transport details", AxiosError.ERR_NETWORK),
    );
    setup("?state=locked");
    fillCredentials();
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
      await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(attempt));
      await waitFor(() => expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeEnabled());
      expect(screen.getByRole("alert")).toHaveTextContent(APP_MESSAGES.ERROR.NETWORK);
    }
    expect(screen.getByLabelText("Email", { exact: true })).toHaveValue(SESSION.user.email);
    expect(
      screen.queryByText(/lần thử|15 phút|private transport details/i),
    ).not.toBeInTheDocument();
  });

  it("disables credentials and alternative login while pending and prevents another click", async () => {
    vi.mocked(authService.login).mockReturnValue(new Promise<AuthSession>(() => {}));
    setup();
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    const pending = await screen.findByRole("button", { name: "Đang xác thực..." });
    expect(pending).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tiếp tục với Google" })).toBeDisabled();
    expect(screen.getByLabelText("Mật khẩu", { exact: true })).toBeDisabled();
    fireEvent.click(pending);
    expect(authService.login).toHaveBeenCalledTimes(1);
  });

  it("keeps internal query and hash after successful cookie login", async () => {
    vi.mocked(authService.login).mockResolvedValue(SESSION);
    accessTokenMemory.set("stale-legacy-fixture-token");
    const destination = `${ROUTES.DASHBOARD.ROOT}/assets?tab=files#list`;
    const { store } = setup(`?redirect=${encodeURIComponent(destination)}`);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByText(destination)).toBeInTheDocument();
    expect(store.getState().auth.user).toEqual({
      ...SESSION.user,
      phone: undefined,
      updatedAt: undefined,
    });
    expect(accessTokenMemory.get()).toBeNull();
    expect(authService.login).toHaveBeenCalledWith({
      email: SESSION.user.email,
      password: "old",
      rememberMe: true,
    });
  });

  it("provides an accessible password visibility toggle without changing the value", () => {
    setup();
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(screen.getByLabelText("Mật khẩu", { exact: true })).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Mật khẩu", { exact: true })).toHaveValue("old");
    expect(screen.getByRole("button", { name: "Ẩn mật khẩu" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("login feedback boundaries", () => {
  it.each([
    null,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "javascript:alert(1)",
    "/%2f%2fevil.test",
    "/%5cevil.test",
    "/%00",
    "/%zz",
    "/login",
  ])("rejects unsafe or recursive redirect %s", (value) => {
    expect(getLoginRedirect(value)).toBe(ROUTES.DASHBOARD.ROOT);
  });

  it("distinguishes timeout while hiding arbitrary exception details", () => {
    expect(getLoginErrorMessage(new AxiosError("secret", AxiosError.ETIMEDOUT))).toBe(
      APP_MESSAGES.ERROR.TIMEOUT,
    );
    expect(getLoginErrorMessage(new Error("secret"))).toBe(APP_MESSAGES.ERROR.DEFAULT);
  });
});
