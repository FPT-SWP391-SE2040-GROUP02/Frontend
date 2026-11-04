import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import {
  AUTH_SYSTEM_ROLES,
  AUTH_USER_STATUSES,
  type AuthUserDto,
} from "@/entities/user/model/authContract.types";
import authReducer, { clearCredentials, setUser } from "@/entities/user/model/authSlice";
import { publicSettingsService } from "@/features/maintenance/api/publicSettingsService";
import { MAINTENANCE_ERROR_CODE, reportMaintenance } from "@/shared/api/maintenance";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaintenanceGate } from "../MaintenanceGate";

vi.mock("@/features/maintenance/api/publicSettingsService", () => ({
  publicSettingsService: { getPublicSettings: vi.fn() },
}));

const getPublicSettings = vi.mocked(publicSettingsService.getPublicSettings);

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function account(role: AuthUserDto["role"]) {
  const dto: AuthUserDto = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "account@example.com",
    fullName: "Tài khoản thử",
    phone: null,
    role,
    status: AUTH_USER_STATUSES.ACTIVE,
    createdAt: "2026-11-04T00:00:00Z",
    emailVerified: true,
    hasPassword: true,
  };
  return toAuthUserViewModel(dto);
}

/** Render cổng bảo trì với store/cache riêng; user null nghĩa là khách đã khôi phục phiên xong. */
function setup(path: string, role?: AuthUserDto["role"]) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (role) store.dispatch(setUser(account(role)));
  else store.dispatch(clearCredentials());
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <MaintenanceGate>
            <p>Nội dung ứng dụng</p>
          </MaintenanceGate>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

const maintenanceTitle = { name: "Chúng tôi đang nâng cấp hệ thống" };

describe("MaintenanceGate", () => {
  it("hiện ứng dụng bình thường khi không bảo trì", async () => {
    getPublicSettings.mockResolvedValue({ "Features.MaintenanceMode": false });
    setup("/");
    expect(await screen.findByText("Nội dung ứng dụng")).toBeInTheDocument();
    expect(screen.queryByRole("heading", maintenanceTitle)).not.toBeInTheDocument();
  });

  it("chỉ hiện màn hình bảo trì cho khách và tài khoản thường, có lối đăng nhập quản trị", async () => {
    getPublicSettings.mockResolvedValue({ "Features.MaintenanceMode": true });
    setup("/login", AUTH_SYSTEM_ROLES.USER);
    expect(await screen.findByRole("heading", maintenanceTitle)).toBeInTheDocument();
    expect(screen.queryByText("Nội dung ứng dụng")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng nhập quản trị" })).toHaveAttribute(
      "href",
      "/login?admin=1",
    );
  });

  it("mở trang đăng nhập quản trị kèm dải giải thích", async () => {
    getPublicSettings.mockResolvedValue({ "Features.MaintenanceMode": true });
    setup("/login?admin=1");
    expect(
      await screen.findByText(/Chỉ tài khoản Quản trị viên đăng nhập được/),
    ).toBeInTheDocument();
    expect(screen.getByText("Nội dung ứng dụng")).toBeInTheDocument();
  });

  it("cho Admin dùng bình thường và nhắc chế độ bảo trì đang bật", async () => {
    getPublicSettings.mockResolvedValue({ "Features.MaintenanceMode": true });
    setup("/admin", AUTH_SYSTEM_ROLES.ADMIN);
    expect(await screen.findByText(/Chế độ bảo trì đang bật/)).toBeInTheDocument();
    expect(screen.getByText("Nội dung ứng dụng")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở Cấu hình hệ thống" })).toHaveAttribute(
      "href",
      "/admin?view=settings",
    );
  });

  it("chuyển ngay sang màn hình bảo trì khi API trả 503 MAINTENANCE_MODE", async () => {
    getPublicSettings.mockResolvedValue({});
    setup("/dashboard", AUTH_SYSTEM_ROLES.USER);
    expect(await screen.findByText("Nội dung ứng dụng")).toBeInTheDocument();

    const config = { headers: new AxiosHeaders() };
    act(() => {
      reportMaintenance(
        new AxiosError("maintenance", "ERR_BAD_RESPONSE", config, undefined, {
          status: 503,
          statusText: "",
          headers: {},
          config,
          data: { code: MAINTENANCE_ERROR_CODE },
        }),
      );
    });
    expect(await screen.findByRole("heading", maintenanceTitle)).toBeInTheDocument();
  });
});
