import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import {
  AUTH_SYSTEM_ROLES,
  AUTH_USER_STATUSES,
  type AuthUserDto,
} from "@/entities/user/model/authContract.types";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { sessionAuthService } from "@/features/auth/api/authService";
import { authKeys, useLogin, useLogout } from "@/features/auth/model/useAuth";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ROUTES } from "@/shared/config/routes.config";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthBootstrap } from "../AuthBootstrap";

vi.mock("@/features/auth/api/authService", () => ({
  sessionAuthService: { getSession: vi.fn(), login: vi.fn(), logout: vi.fn(), refresh: vi.fn() },
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
  emailVerified: true,
  hasPassword: true,
};

afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  window.history.replaceState(null, "", ROUTES.HOME);
});

/** @returns Bootstrap sous StrictMode với cache/store độc lập cho từng test. */
function setup(content = <p>App content</p>, existingToken = true) {
  if (existingToken) accessTokenMemory.set("existing-token");
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

/** Exercise confirmed login while the initial session request remains in flight. */
function LoginAction() {
  const login = useLogin();
  return (
    <button
      onClick={() => login.mutate({ email: sessionUser.email, password: "fixture-password" })}
    >
      Confirm login
    </button>
  );
}

describe("AuthBootstrap request budget", () => {
  it.each(["success", "failure"] as const)(
    "preserves the new login after late bootstrap %s",
    async (outcome) => {
      let resolveSession!: (value: AuthUserDto) => void;
      let rejectSession!: (reason: Error) => void;
      vi.mocked(sessionAuthService.getSession).mockReturnValue(
        new Promise((resolve, reject) => {
          resolveSession = resolve;
          rejectSession = reject;
        }),
      );
      vi.mocked(sessionAuthService.login).mockResolvedValue({
        accessToken: "new-access",
        expiresIn: 900,
        user: sessionUser,
      });
      const { store, client } = setup(<LoginAction />);
      await waitFor(() => expect(sessionAuthService.getSession).toHaveBeenCalledTimes(1));
      fireEvent.click(screen.getByRole("button", { name: "Confirm login" }));
      await waitFor(() => expect(store.getState().auth.user?.id).toBe(sessionUser.id));
      await act(async () => {
        if (outcome === "success") {
          resolveSession({
            ...sessionUser,
            id: "22222222-2222-4222-8222-222222222222",
            email: "old@example.test",
          });
        } else {
          rejectSession(new Error("old session expired"));
        }
      });
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.user).toEqual(toAuthUserViewModel(sessionUser));
      expect(client.getQueryData(authKeys.session())).toEqual({ user: sessionUser });
      client.clear();
    },
  );

  it("does not restore a late bootstrap response after confirmed logout", async () => {
    let resolveSession!: (value: AuthUserDto) => void;
    vi.mocked(sessionAuthService.getSession).mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );
    vi.mocked(sessionAuthService.logout).mockResolvedValue(undefined);
    const { store, client } = setup(<LogoutAction />);
    store.dispatch(setCredentials({ user: toAuthUserViewModel(sessionUser) }));
    await waitFor(() => expect(sessionAuthService.getSession).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Confirm logout" }));
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(false));
    await act(async () => {
      resolveSession(sessionUser);
    });
    expect(store.getState().auth.user).toBeNull();
    expect(client.getQueryData(["auth", "session"])).toBeUndefined();
    client.clear();
  });

  it("deduplicates the initial session request under StrictMode", async () => {
    vi.mocked(sessionAuthService.getSession).mockResolvedValue(sessionUser);
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isHydrating).toBe(false));
    expect(sessionAuthService.getSession).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.user).toEqual(toAuthUserViewModel(sessionUser));
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(client.getQueryData(["auth", "session"])).toEqual({ user: sessionUser });
    client.clear();
  });

  it("does not retry a failed session request", async () => {
    vi.mocked(sessionAuthService.getSession).mockRejectedValue(new Error("session unavailable"));
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isHydrating).toBe(false));
    expect(sessionAuthService.getSession).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.isAuthenticated).toBe(false);
    client.clear();
  });

  it("does not bypass session bootstrap in production", async () => {
    vi.stubEnv("DEV", false);
    window.history.replaceState(null, "", "/preview/verifier");
    vi.mocked(sessionAuthService.getSession).mockResolvedValue(sessionUser);
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isHydrating).toBe(false));
    expect(sessionAuthService.getSession).toHaveBeenCalledTimes(1);
    client.clear();
  });
});

describe("Bearer restore after reload", () => {
  it("deduplicates refresh under StrictMode and caches only user", async () => {
    vi.stubGlobal("navigator", {
      locks: {
        request: vi.fn(async (_name: string, callback: () => Promise<unknown>) => callback()),
      },
    });
    vi.mocked(sessionAuthService.refresh).mockResolvedValue({
      accessToken: "restored-access",
      expiresIn: 900,
      user: sessionUser,
    });
    const { store, client } = setup(<p>App content</p>, false);
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
    expect(sessionAuthService.refresh).toHaveBeenCalledTimes(1);
    expect(sessionAuthService.getSession).not.toHaveBeenCalled();
    expect(accessTokenMemory.get()).toBe("restored-access");
    expect(client.getQueryData(authKeys.session())).toEqual({ user: sessionUser });
    expect(store.getState().auth).not.toHaveProperty("accessToken");
    client.clear();
  });
  it("does not automatically rotate shared cookies without a cross-tab lock", () => {
    vi.stubGlobal("navigator", {});
    const { store, client } = setup(<p>App content</p>, false);
    expect(sessionAuthService.refresh).not.toHaveBeenCalled();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.isHydrating).toBe(false);
    client.clear();
  });
});

describe("Cross-browser active session verification", () => {
  it("triggers getSession when tab visibility changes to visible", async () => {
    vi.mocked(sessionAuthService.getSession).mockResolvedValue(sessionUser);
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
    expect(sessionAuthService.getSession).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => expect(sessionAuthService.getSession).toHaveBeenCalledTimes(2));
    client.clear();
  });
});
