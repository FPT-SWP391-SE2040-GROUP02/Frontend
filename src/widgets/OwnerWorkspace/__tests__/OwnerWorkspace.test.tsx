import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { OwnerWorkspace } from "../OwnerWorkspace";
import { ownerVaultKeys } from "@/features/vault-management/model/useOwnerVault";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";

afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("workspace logo navigation", () => {
  it.each(["/dashboard", "/executor/claim"])("has no role switcher in %s", (path) => {
    const store = configureStore({ reducer: { auth: authReducer } });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <OwnerWorkspace title="Fixture" description="Fixture">
            <p>Content</p>
          </OwnerWorkspace>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.queryByText("Chuyển vai trò")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Nội dung được nhận" })).not.toBeInTheDocument();
    if (path === "/dashboard")
      expect(screen.queryByRole("link", { name: "Nhiệm vụ Executor" })).not.toBeInTheDocument();
    else {
      expect(screen.getByRole("link", { name: "Nhiệm vụ Executor" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.queryByRole("link", { name: "Kho của tôi" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Cài đặt" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "LegacyVault" })).toHaveAttribute(
        "href",
        "/executor/claim",
      );
    }
  });
  it("opens the phone navigation and closes it after choosing an Owner page", () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <OwnerWorkspace title="Kho" description="Fixture">
            <p>Nội dung</p>
          </OwnerWorkspace>
        </MemoryRouter>
      </Provider>,
    );
    const toggle = screen.getByRole("button", { name: "Menu Chủ kho" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("link", { name: "Kho của tôi" }));
    expect(screen.getByRole("button", { name: "Menu Chủ kho" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("link", { name: "Kho của tôi" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it.each([
    ["/assets?filter=all#list", "Kho của tôi"],
    ["/wills/new", "Kế hoạch bàn giao"],
    ["/dashboard/wills/new", "Kế hoạch bàn giao"],
    ["/billing/history", "Gói dịch vụ"],
  ])("keeps the correct navigation item active on %s", (path, label) => {
    const store = configureStore({ reducer: { auth: authReducer } });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <OwnerWorkspace title="Fixture" description="Fixture">
            <p>Nội dung</p>
          </OwnerWorkspace>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    expect(
      screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page"),
    ).toHaveLength(1);
  });

  it.each(["USER", "ADMIN", "VERIFIER"] as const)(
    "keeps %s credentials and private cache while navigating to account home",
    (role) => {
      const store = configureStore({ reducer: { auth: authReducer } });
      store.dispatch(
        setCredentials({
          user: {
            id: "11111111-1111-4111-8111-111111111111",
            fullName: "Navigation fixture",
            email: "nav@example.test",
            role,
            status: "ACTIVE",
            createdAt: "2026-10-15T00:00:00Z",
            emailVerified: true,
            hasPassword: false,
          },
        }),
      );
      const original = store.getState().auth;
      accessTokenMemory.set("navigation-fixture-access");
      const client = new QueryClient();
      // Có dữ liệu kho trước khi bấm logo: kiểm tra riêng điều hướng không tạo request hoặc đổi phiên.
      client.setQueryDefaults(ownerVaultKeys.mine, { staleTime: Infinity });
      client.setQueryData(ownerVaultKeys.mine, { ...vaultFixture, serviceTier: "XS_MAX" });
      const key = ["private-vault", "fixture"];
      client.setQueryData(key, { name: "Private fixture" });
      const get = vi.spyOn(apiClient, "get");
      const post = vi.spyOn(apiClient, "post");
      const target =
        role === "ADMIN" ? "/admin" : role === "VERIFIER" ? "/notary/workspace" : "/dashboard";
      render(
        <Provider store={store}>
          <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/dashboard/assets?filter=all#list"]}>
              <Routes>
                <Route
                  path="/dashboard/assets"
                  element={
                    <OwnerWorkspace title="Kho" description="Fixture">
                      <p>Current page</p>
                    </OwnerWorkspace>
                  }
                />
                <Route path={target} element={<p>Account dashboard</p>} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </Provider>,
      );
      if (role === "USER") expect(screen.getByText("Legacy XS Max")).toBeInTheDocument();
      else expect(screen.queryByText("Legacy XS Max")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("link", { name: "LegacyVault" }));
      expect(screen.getByText("Account dashboard")).toBeInTheDocument();
      expect(store.getState().auth).toEqual(original);
      expect(accessTokenMemory.get()).toBe("navigation-fixture-access");
      expect(client.getQueryData(key)).toEqual({ name: "Private fixture" });
      expect(get).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
      client.clear();
    },
  );

  it("sends a guest to the public landing page", () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    function Probe() {
      return <a href={useAccountHome()}>Home</a>;
    }
    render(
      <Provider store={store}>
        <Probe />
      </Provider>,
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });
});
