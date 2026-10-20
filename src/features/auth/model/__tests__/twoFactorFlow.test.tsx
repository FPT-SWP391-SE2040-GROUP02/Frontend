import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authReducer from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { authService, sessionAuthService } from "../../api/authService";
import { useLogin, useTwoFactorVerify } from "../useAuth";
import { twoFactorChallengeMemory } from "../twoFactorChallenge";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "admin@example.test",
  fullName: "Admin",
  phone: null,
  role: "ADMIN" as const,
  status: "ACTIVE" as const,
  emailVerified: true,
  hasPassword: true,
  createdAt: "2026-10-20T00:00:00+00:00",
};
const session = { accessToken: "fixture-access", expiresIn: 900, user };

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </Provider>
  );
}

beforeEach(() => {
  store = makeStore();
  accessTokenMemory.clear();
  twoFactorChallengeMemory.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  accessTokenMemory.clear();
  twoFactorChallengeMemory.clear();
});

describe("Admin two-factor sign-in", () => {
  it("keeps a login challenge in memory and grants no session", async () => {
    vi.spyOn(sessionAuthService, "login").mockResolvedValue({
      twoFactorRequired: true,
      challengeToken: "challenge",
      expiresIn: 300,
    });
    const { result } = renderHook(() => useLogin(), { wrapper });
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.mutateAsync({ email: user.email, password: "x" });
    });
    expect(outcome).toEqual({ twoFactorRequired: true });
    expect(twoFactorChallengeMemory.get()).toBe("challenge");
    expect(accessTokenMemory.get()).toBeNull();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("completes the session only after the code is verified, then drops the challenge", async () => {
    twoFactorChallengeMemory.set({
      twoFactorRequired: true,
      challengeToken: "challenge",
      expiresIn: 300,
    });
    const verify = vi.spyOn(authService, "verifyTwoFactor").mockResolvedValue(session);
    const { result } = renderHook(() => useTwoFactorVerify(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync("012345");
    });
    expect(verify).toHaveBeenCalledWith({ challengeToken: "challenge", code: "012345" });
    expect(accessTokenMemory.get()).toBe("fixture-access");
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(twoFactorChallengeMemory.get()).toBeNull();
  });

  it("keeps the challenge after a wrong code so the Admin can retry", async () => {
    twoFactorChallengeMemory.set({
      twoFactorRequired: true,
      challengeToken: "challenge",
      expiresIn: 300,
    });
    vi.spyOn(authService, "verifyTwoFactor").mockRejectedValue(new Error("wrong code"));
    const { result } = renderHook(() => useTwoFactorVerify(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync("000000").catch(() => undefined);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(twoFactorChallengeMemory.get()).toBe("challenge");
    expect(accessTokenMemory.get()).toBeNull();
  });

  it("does not call the Backend when no challenge is held", async () => {
    const verify = vi.spyOn(authService, "verifyTwoFactor");
    const { result } = renderHook(() => useTwoFactorVerify(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync("012345").catch(() => undefined);
    });
    expect(verify).not.toHaveBeenCalled();
    expect(accessTokenMemory.get()).toBeNull();
  });

  it("forgets an expired challenge", () => {
    vi.useFakeTimers();
    twoFactorChallengeMemory.set({
      twoFactorRequired: true,
      challengeToken: "challenge",
      expiresIn: 300,
    });
    vi.advanceTimersByTime(301_000);
    expect(twoFactorChallengeMemory.get()).toBeNull();
    vi.useRealTimers();
  });
});
