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
import {
  authService as googleService,
  sessionAuthService as authService,
} from "../../api/authService";
import type { AuthSessionDto as AuthSession } from "@/entities/user/model/authContract.types";
import { getLoginRedirect, getLoginErrorMessage } from "../../lib/loginFeedback";
import { invalidateAuthSession } from "../../model/authTransitions";
import { LoginForm, type LoginFormProps } from "../LoginForm";

vi.mock("../../api/authService", () => ({
  sessionAuthService: { login: vi.fn() },
  authService: { loginWithGoogle: vi.fn(), linkGoogleAccount: vi.fn() },
}));

vi.mock("../GoogleSignInButton", () => ({
  GoogleSignInButton: ({
    disabled,
    onCredential,
  }: {
    disabled: boolean;
    onCredential: (token: string, nonce: string) => Promise<void>;
  }) => (
    <button disabled={disabled} onClick={() => void onCredential("google-credential", "nonce")}>
      Tiếp tục với Google
    </button>
  ),
}));

/** Public cookie session fixture with no bearer tokens in JSON. */
const SESSION: AuthSession = {
  accessToken: "fixture-login-access",
  expiresIn: 300,
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Test Owner",
    email: "owner@example.test",
    role: ROLES.USER,
    status: STATUS.ACTIVE,
    createdAt: "2026-10-10T00:00:00Z",
    phone: null,
    emailVerified: true,
    hasPassword: true,
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
function setup(query = "", invitationContext?: LoginFormProps["invitationContext"]) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  clients.push(client);
  const store = configureStore({ reducer: { auth: authReducer } });
  const view = render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`${ROUTES.AUTH.LOGIN}${query}`]}>
          <Routes>
            <Route
              path={ROUTES.AUTH.LOGIN}
              element={<LoginForm invitationContext={invitationContext} />}
            />
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
  it("shows an unverified invitation notice and encodes the complete token in the register link", () => {
    const token = "opaque&redirect=https://example.invalid#fragment+=";
    setup("?pkg=Private%20vault&from=Private%20owner", { token });
    expect(screen.getByText("Bạn đang mở liên kết lời mời.")).toBeInTheDocument();
    expect(
      screen.getByText(/Thông tin và hiệu lực lời mời cần được hệ thống xác minh/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Private vault|Private owner/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tạo tài khoản để nhận" })).toHaveAttribute(
      "href",
      `${ROUTES.AUTH.REGISTER}?invitation=${encodeURIComponent(token)}`,
    );
  });

  it("publishes the Google session without retaining its bearer in mutation results", async () => {
    vi.mocked(googleService.loginWithGoogle).mockResolvedValue({
      signedIn: true,
      accountCreated: false,
      returnUrl: "https://evil.test",
      session: SESSION,
    });
    const { client, store } = setup("?redirect=%2Fdashboard%3Ftab%3Dfiles%23list");
    client.setQueryData(["previous-private-data"], "private");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục với Google" }));
    expect(await screen.findByText("/dashboard?tab=files#list")).toBeInTheDocument();
    expect(googleService.loginWithGoogle).toHaveBeenCalledWith({
      idToken: "google-credential",
      nonce: "nonce",
      rememberMe: true,
      returnUrl: "/dashboard?tab=files#list",
    });
    expect(store.getState().auth.user?.id).toBe(SESSION.user.id);
    expect(accessTokenMemory.get()).toBe(SESSION.accessToken);
    expect(client.getQueryData(["previous-private-data"])).toBeUndefined();
    expect(
      JSON.stringify(
        client
          .getMutationCache()
          .getAll()
          .map((item) => item.state.data),
      ),
    ).not.toContain(SESSION.accessToken);
  });

  it("keeps the link ticket off URL/storage, then confirms the existing password and signs in", async () => {
    vi.mocked(googleService.loginWithGoogle).mockResolvedValue({
      signedIn: false,
      accountCreated: false,
      returnUrl: null,
      linkTicket: "secret-ticket",
      maskedEmail: "o***@example.test",
    });
    vi.mocked(googleService.linkGoogleAccount).mockResolvedValue(SESSION);
    const { store, client } = setup("?redirect=%2Fdashboard%3Ftab%3Dfiles");
    client.setQueryData(["previous-private-data"], "private");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục với Google" }));
    expect(await screen.findByText("Email này đã có tài khoản")).toBeInTheDocument();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(accessTokenMemory.get()).toBeNull();
    expect(client.getQueryData(["previous-private-data"])).toBe("private");
    expect(window.location.href).not.toContain("secret-ticket");
    expect(JSON.stringify(localStorage)).not.toContain("secret-ticket");
    expect(JSON.stringify(sessionStorage)).not.toContain("secret-ticket");
    fireEvent.change(screen.getByLabelText("Mật khẩu hiện có"), { target: { value: "old" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận và liên kết" }));
    expect(await screen.findByText("/dashboard?tab=files")).toBeInTheDocument();
    expect(googleService.linkGoogleAccount).toHaveBeenCalledWith({
      linkTicket: "secret-ticket",
      password: "old",
      rememberMe: true,
    });
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(client.getQueryData(["previous-private-data"])).toBeUndefined();
  });

  it("shows an invalid-ticket recovery action and cancels back to Google", async () => {
    vi.mocked(googleService.loginWithGoogle).mockResolvedValue({
      signedIn: false,
      accountCreated: false,
      returnUrl: null,
      linkTicket: "expired",
      maskedEmail: "o***@example.test",
    });
    vi.mocked(googleService.linkGoogleAccount).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: { code: "INVALID_LINK_TICKET", detail: "private server info" },
      },
    });
    const { store } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục với Google" }));
    fireEvent.change(await screen.findByLabelText("Mật khẩu hiện có"), {
      target: { value: "old" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận và liên kết" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Phiên liên kết không còn hợp lệ");
    expect(screen.queryByText("private server info")).not.toBeInTheDocument();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Quay lại đăng nhập Google" }));
    expect(screen.getByRole("button", { name: "Tiếp tục với Google" })).toBeEnabled();
  });

  it("does not publish a late Google response after auth was invalidated", async () => {
    let complete!: (value: Awaited<ReturnType<typeof googleService.loginWithGoogle>>) => void;
    vi.mocked(googleService.loginWithGoogle).mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const { store } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục với Google" }));
    await waitFor(() => expect(googleService.loginWithGoogle).toHaveBeenCalledOnce());
    invalidateAuthSession();
    await act(async () =>
      complete({ signedIn: true, accountCreated: false, returnUrl: null, session: SESSION }),
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(accessTokenMemory.get()).toBeNull();
  });

  it("keeps password recovery in the keyboard tab order", () => {
    setup();
    const recovery = screen.getByRole("link", { name: "Quên mật khẩu?" });
    expect(recovery).toHaveAttribute("href", ROUTES.AUTH.FORGOT_PASSWORD);
    expect(recovery.tabIndex).toBe(0);
  });

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
    let rejectLogin!: (error: Error) => void;
    vi.mocked(authService.login).mockReturnValue(
      new Promise<AuthSession>((_, reject) => {
        rejectLogin = reject;
      }),
    );
    setup();
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    const pending = await screen.findByRole("button", { name: "Đang xác thực..." });
    expect(pending).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tiếp tục với Google" })).toBeDisabled();
    expect(screen.getByLabelText("Mật khẩu", { exact: true })).toBeDisabled();
    fireEvent.click(pending);
    expect(authService.login).toHaveBeenCalledTimes(1);
    await act(async () => {
      rejectLogin(new Error("fixture cleanup"));
    });
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
    });
    expect(accessTokenMemory.get()).toBe(SESSION.accessToken);
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
