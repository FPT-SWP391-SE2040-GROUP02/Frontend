import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import authReducer from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import { useVaultPageTitle } from "../useVaultPageTitle";

function wrapper(isAuthenticated: boolean) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, isAuthenticated, isHydrating: false } },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </Provider>
    );
  };
}

afterEach(() => {
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("useVaultPageTitle", () => {
  it("shows the default label first, then the vault name once it loads", async () => {
    accessTokenMemory.set("vault-title-fixture");
    vi.spyOn(apiClient, "get").mockResolvedValue({ ...vaultFixture, name: "kho cua tao" });
    const { result } = renderHook(() => useVaultPageTitle(), { wrapper: wrapper(true) });
    expect(result.current).toEqual({ title: "Kho của tôi" });
    await waitFor(() =>
      expect(result.current).toEqual({ title: "kho cua tao", eyebrow: "Kho của tôi" }),
    );
  });

  it("keeps the default label for a vault that kept the default name", async () => {
    accessTokenMemory.set("vault-title-fixture");
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue({ ...vaultFixture, name: "Kho của tôi" });
    const { result } = renderHook(() => useVaultPageTitle(), { wrapper: wrapper(true) });
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(result.current).toEqual({ title: "Kho của tôi" });
  });

  it("does not call the API without a ready session", () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(vaultFixture);
    const { result } = renderHook(() => useVaultPageTitle(), { wrapper: wrapper(false) });
    expect(result.current).toEqual({ title: "Kho của tôi" });
    expect(get).not.toHaveBeenCalled();
  });
});
