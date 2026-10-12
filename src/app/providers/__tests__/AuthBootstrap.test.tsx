import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { useLogout } from "@/features/auth/model/useAuth";
import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import { cookieAuthService } from "@/features/auth/api/authService";
import {
  AUTH_SYSTEM_ROLES,
  AUTH_USER_STATUSES,
  type AuthUserDto,
} from "@/entities/user/model/authContract.types";
import { ROUTES } from "@/shared/config/routes.config";
import { AuthBootstrap } from "../AuthBootstrap";

vi.mock("@/features/auth/api/authService", () => ({
  cookieAuthService: { getSession: vi.fn(), logout: vi.fn() },
  authService: {},
}));

const sessionUser: AuthUserDto = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "verifier@example.com",
  fullName: "Session Verifier",
  phone: null,
  role: AUTH_SYSTEM_ROLES.VERIFIER,
  status: AUTH_USER_STATUSES.ACTIVE,
  createdAt: "2026-10-12T00:00:00Z",
  updatedAt: null,
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  window.history.replaceState(null, "", ROUTES.HOME);
});

/** @returns Bootstrap sous StrictMode với cache/store độc lập cho từng test. */
function setup(content = <p>App content</p>) {
  const store = configureStore({ reducer: { auth: authReducer } });
  const client = new QueryClient();
  render(
    <StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <AuthBootstrap>{content}</AuthBootstrap>
        </QueryClientProvider>
      </Provider>
    </StrictMode>,
  );
  return { store, client };
}

/** Exercise the real logout hook while bootstrap is still awaiting the server. */
function LogoutAction() {
  const logout = useLogout();
  return <button onClick={() => logout.mutate(undefined)}>Confirm logout</button>;
}

describe("AuthBootstrap request budget", () => {
  it("does not restore a late bootstrap response after confirmed logout", async () => {
    let resolveSession!: (value: { user: AuthUserDto }) => void;
    vi.mocked(cookieAuthService.getSession).mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );
    vi.mocked(cookieAuthService.logout).mockResolvedValue(undefined);
    const { store, client } = setup(<LogoutAction />);
    store.dispatch(setCredentials({ user: toAuthUserViewModel(sessionUser) }));
    await waitFor(() => expect(cookieAuthService.getSession).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Confirm logout" }));
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(false));
    await act(async () => {
      resolveSession({ user: sessionUser });
    });
    expect(store.getState().auth.user).toBeNull();
    expect(client.getQueryData(["auth", "session"])).toBeUndefined();
    client.clear();
  });

  it("deduplicates the initial session request under StrictMode", async () => {
    vi.mocked(cookieAuthService.getSession).mockResolvedValue({ user: sessionUser });
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isHydrating).toBe(false));
    expect(cookieAuthService.getSession).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.user).toEqual({
      ...sessionUser,
      phone: undefined,
      updatedAt: undefined,
    });
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(client.getQueryData(["auth", "session"])).toEqual({ user: sessionUser });
    client.clear();
  });

  it.each(Object.values(ROUTES.PREVIEW))(
    "does not request a session on development preview %s",
    (path) => {
      vi.stubEnv("DEV", true);
      window.history.replaceState(null, "", path);
      const { store, client } = setup();
      expect(cookieAuthService.getSession).not.toHaveBeenCalled();
      expect(store.getState().auth.isHydrating).toBe(false);
      expect(screen.getByText("App content")).toBeInTheDocument();
      client.clear();
    },
  );

  it("does not retry a failed session request", async () => {
    vi.mocked(cookieAuthService.getSession).mockRejectedValue(new Error("session unavailable"));
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isHydrating).toBe(false));
    expect(cookieAuthService.getSession).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.isAuthenticated).toBe(false);
    client.clear();
  });

  it("does not bypass session bootstrap in production", async () => {
    vi.stubEnv("DEV", false);
    window.history.replaceState(null, "", ROUTES.PREVIEW.VERIFIER);
    vi.mocked(cookieAuthService.getSession).mockResolvedValue({ user: sessionUser });
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isHydrating).toBe(false));
    expect(cookieAuthService.getSession).toHaveBeenCalledTimes(1);
    client.clear();
  });
});
