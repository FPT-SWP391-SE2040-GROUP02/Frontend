import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

function renderWorkspace(
  store: ReturnType<typeof configureStore>,
  path: string,
  title = "Fixture",
  eyebrow?: string,
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <OwnerWorkspace title={title} eyebrow={eyebrow} description="Fixture">
            <p>Nội dung</p>
          </OwnerWorkspace>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("workspace logo navigation", () => {
  it("has no Executor menu or role switcher when the account has no Executor vault", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    accessTokenMemory.set("owner-workspace-fixture");
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { user: null, isAuthenticated: true, isHydrating: false } },
    });
    renderWorkspace(store, "/dashboard");
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    expect(screen.queryByText("Chuyển vai trò")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Nhiệm vụ Executor" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Sang vai Người thực hiện" }),
    ).not.toBeInTheDocument();
  });

  it("offers the switch to the Executor space only for accounts with an Executor vault", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      {
        vaultId: "22222222-2222-4222-8222-222222222222",
        ownerFullName: "Chủ kho",
        planStatus: "ACTIVE",
        checkInOverdue: false,
        openDeathCaseId: null,
      },
    ]);
    accessTokenMemory.set("owner-workspace-fixture");
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { user: null, isAuthenticated: true, isHydrating: false } },
    });
    renderWorkspace(store, "/dashboard");
    // Có hai lối vào: mục trong menu (điện thoại) và nút ở chân khung.
    const links = await screen.findAllByRole("link", { name: "Sang vai Người thực hiện" });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link).toHaveAttribute("href", "/executor"));
    // Chỉ một nút hiện ở mỗi cỡ màn hình: mục trong menu chỉ dành cho điện thoại (< 768px), nút ở chân khung từ 768px
    // trở lên. Trước đây mục trong menu ẩn từ 1024px nên màn 768–1023px thấy hai nút.
    const inMenu = links.filter((link) => link.className.includes("owner-nav-link"));
    expect(inMenu).toHaveLength(1);
    // Dùng class CSS riêng vì `display: flex` của .owner-nav-link nằm ngoài layer nên thắng `md:hidden` của Tailwind.
    expect(inMenu[0].className).toContain("owner-nav-link--phone-only");
    expect(inMenu[0].className).not.toContain("md:hidden");
  });

  it("opens the phone navigation and closes it after choosing an Owner page", () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    renderWorkspace(store, "/dashboard", "Kho");
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

  it("shows the eyebrow above the title only when one is given", () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    renderWorkspace(store, "/dashboard", "kho cua tao", "Kho của tôi");
    expect(screen.getByRole("heading", { level: 1, name: "kho cua tao" })).toBeInTheDocument();
    expect(screen.getByText("Kho của tôi", { selector: "p" })).toBeInTheDocument();
    cleanup();
    renderWorkspace(store, "/dashboard", "Fixture");
    expect(screen.queryByText("Kho của tôi", { selector: "p" })).not.toBeInTheDocument();
  });

  it.each([
    ["/assets?filter=all#list", "Kho của tôi"],
    ["/wills/new", "Bàn giao"],
    ["/dashboard/wills/new", "Bàn giao"],
    ["/billing/history", "Gói dịch vụ"],
    ["/dashboard/identity", "Xác minh"],
  ])("keeps the correct navigation item active on %s", (path, label) => {
    const store = configureStore({ reducer: { auth: authReducer } });
    renderWorkspace(store, path);
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
      const get = vi.spyOn(apiClient, "get").mockResolvedValue([]);
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
      get.mockClear();
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
