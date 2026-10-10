import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer from "@/entities/user/model/authSlice";
import { axiosClient } from "@/shared/api/axiosClient";
import { ROUTES } from "@/shared/config/routes.config";
import { AuthBootstrap } from "../AuthBootstrap";

vi.mock("@/shared/api/axiosClient", () => ({ axiosClient: { get: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  window.history.replaceState(null, "", ROUTES.HOME);
});

/** @returns Bootstrap sous StrictMode với cache/store độc lập cho từng test. */
function setup() {
  const store = configureStore({ reducer: { auth: authReducer } });
  const client = new QueryClient();
  render(<StrictMode><Provider store={store}><QueryClientProvider client={client}>
    <AuthBootstrap><p>App content</p></AuthBootstrap>
  </QueryClientProvider></Provider></StrictMode>);
  return { store, client };
}

describe("AuthBootstrap request budget", () => {
  it("deduplicates the initial session request under StrictMode", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({ user: null });
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isHydrating).toBe(false));
    expect(axiosClient.get).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it.each(Object.values(ROUTES.PREVIEW))("does not request a session on development preview %s", (path) => {
    vi.stubEnv("DEV", true);
    window.history.replaceState(null, "", path);
    const { store, client } = setup();
    expect(axiosClient.get).not.toHaveBeenCalled();
    expect(store.getState().auth.isHydrating).toBe(false);
    expect(screen.getByText("App content")).toBeInTheDocument();
    client.clear();
  });

  it("does not retry a failed session request", async () => {
    vi.mocked(axiosClient.get).mockRejectedValue(new Error("session unavailable"));
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isHydrating).toBe(false));
    expect(axiosClient.get).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.isAuthenticated).toBe(false);
    client.clear();
  });

  it("does not bypass session bootstrap in production", async () => {
    vi.stubEnv("DEV", false);
    window.history.replaceState(null, "", ROUTES.PREVIEW.VERIFIER);
    vi.mocked(axiosClient.get).mockResolvedValue({ user: null });
    const { store, client } = setup();
    await waitFor(() => expect(store.getState().auth.isHydrating).toBe(false));
    expect(axiosClient.get).toHaveBeenCalledTimes(1);
    client.clear();
  });
});
