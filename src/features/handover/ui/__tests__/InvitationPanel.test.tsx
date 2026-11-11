import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { ROUTES } from "@/shared/config/routes.config";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { InvitationPanel } from "../InvitationPanel";

const MASKED = "n••••••••n@example.com";
const user = {
  id: VAULT_ID,
  email: "nguoi-nhan@example.com",
  fullName: "Người nhận",
  role: "USER" as const,
  status: "ACTIVE" as const,
  emailVerified: true,
  hasPassword: false,
  createdAt: CREATED_AT,
};
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

function invitation(accountExists: boolean) {
  return {
    valid: true,
    responseExpired: false,
    invitedEmailMasked: MASKED,
    invitedEmail: "nguoi-nhan@example.com",
    accountExists,
    ownerFullName: "Nguyễn Văn A",
  };
}

function setup(authenticatedAs: typeof user | null, onSignOut = vi.fn()) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (authenticatedAs) store.dispatch(setCredentials({ user: authenticatedAs }));
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/receive?token=tok"]}>
          <Routes>
            <Route path={ROUTES.RECEIVE} element={<InvitationPanel onSignOut={onSignOut} />} />
            <Route path={ROUTES.BENEFICIARY.CLAIM} element={<p>Cổng người nhận</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  return onSignOut;
}

describe("InvitationPanel (cửa vào của link email)", () => {
  it("chưa đăng nhập và email đã có tài khoản: nút chính là Đăng nhập, có Quên mật khẩu, không có nút nhận", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(invitation(true));
    const post = vi.spyOn(apiClient, "post");
    setup(null);

    expect(
      await screen.findByRole("heading", { name: "Nguyễn Văn A đã để lại cho bạn một gói" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Chúng tôi rất tiếc về mất mát của bạn/)).toBeInTheDocument();
    expect(screen.getByText("nguoi-nhan@example.com")).toBeInTheDocument();
    const login = screen.getByRole("link", { name: "Đăng nhập để mở thư mời" });
    expect(login).toHaveAttribute("href", "/login?redirect=%2Fclaim%2Fbeneficiary");
    expect(screen.getByRole("link", { name: "Quên mật khẩu?" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tạo tài khoản bằng email này" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Nhận lời mời|Đồng ý nhận/ })).toBeNull();
    expect(screen.getByText("Đăng nhập tài khoản của bạn")).toBeInTheDocument();
    expect(screen.getByText(/Chờ Người xét duyệt, rồi nhập mã mở gói/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("chưa có tài khoản: nút chính là Tạo tài khoản bằng email này, mang redirect về cổng", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(invitation(false));
    setup(null);

    const create = await screen.findByRole("link", { name: "Tạo tài khoản bằng email này" });
    const href = decodeURIComponent(create.getAttribute("href") ?? "");
    expect(href).toContain(`redirect=${ROUTES.BENEFICIARY.CLAIM}`);
    expect(href).toContain("email=nguoi-nhan@example.com");
    expect(
      screen.getByText("Tạo tài khoản bằng email này", { selector: "li" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Đăng nhập để mở thư mời" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Quên mật khẩu?" })).toBeNull();
  });

  it("giữ kiểm tra thư bằng mã hồ sơ dưới dạng một dòng nhỏ", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(invitation(true));
    setup(null);

    expect(
      await screen.findByText("Không chắc email này có thật? Kiểm tra thư bằng mã hồ sơ"),
    ).toBeInTheDocument();
  });

  it("đã đăng nhập đúng email: chuyển thẳng tới cổng người nhận, không gọi API nhận", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(invitation(true));
    const post = vi.spyOn(apiClient, "post");
    setup(user);

    expect(await screen.findByText("Cổng người nhận")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("đăng nhập sai email: hiện màn tài khoản khác với email đang dùng và email được mời đã che", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(invitation(true));
    const onSignOut = setup({ ...user, email: "nguoi-khac@example.com" });

    expect(
      await screen.findByRole("heading", { name: "Bạn đang đăng nhập bằng tài khoản khác" }),
    ).toBeInTheDocument();
    expect(screen.getByText("nguoi-khac@example.com")).toBeInTheDocument();
    expect(screen.getByText("nguoi-nhan@example.com")).toBeInTheDocument();
    expect(screen.queryByText("Cổng người nhận")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất và đăng nhập đúng email" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("link không hợp lệ: báo lời mời chưa dùng được", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("404"));
    setup(null);

    expect(await screen.findByText("Lời mời chưa dùng được")).toBeInTheDocument();
  });
});
