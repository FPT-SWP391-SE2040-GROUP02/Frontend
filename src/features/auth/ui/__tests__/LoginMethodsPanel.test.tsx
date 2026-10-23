import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authReducer from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { loginMethodsService } from "../../api/loginMethodsService";
import { sessionAuthService } from "../../api/authService";
import { LoginMethodsPanel } from "../LoginMethodsPanel";

/** GIS không chạy được trong jsdom: nút giả gọi onCredential như Google trả credential. */
vi.mock("../GoogleSignInButton", () => ({
  GoogleSignInButton: ({
    disabled,
    onCredential,
  }: {
    disabled: boolean;
    onCredential: (token: string, nonce: string) => Promise<void>;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onCredential("google-token", "n1")}
    >
      Google giả
    </button>
  ),
}));

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.test",
  fullName: "Owner",
  phone: null,
  role: "USER" as const,
  status: "ACTIVE" as const,
  emailVerified: true,
  hasPassword: true,
  createdAt: "2026-10-20T00:00:00+00:00",
};
const password = {
  method: "PASSWORD" as const,
  email: null,
  linkedAt: "2026-10-01T00:00:00+00:00",
  lastUsedAt: null,
  canRemove: true,
};
const google = {
  method: "GOOGLE" as const,
  email: "owner@gmail.test",
  linkedAt: "2026-10-02T00:00:00+00:00",
  lastUsedAt: null,
  canRemove: true,
};

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("methods-fixture");
  vi.spyOn(sessionAuthService, "getSession").mockResolvedValue(user);
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function problem(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("x", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data: { code },
  });
}

function renderPanel() {
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <LoginMethodsPanel />
      </QueryClientProvider>
    </Provider>,
  );
}

describe("LoginMethodsPanel", () => {
  it("lists both methods with status chips and offers to unlink Google when a password remains", async () => {
    vi.spyOn(loginMethodsService, "list").mockResolvedValue([password, google]);
    renderPanel();
    expect(await screen.findByText(/owner@gmail.test/)).toBeInTheDocument();
    expect(screen.getByText("2/2 phương thức")).toBeInTheDocument();
    expect(screen.getByText("Đang dùng")).toBeInTheDocument();
    expect(screen.getByText("Đã liên kết")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gỡ liên kết Google" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Gỡ mật khẩu" })).toBeEnabled();
  });

  it("locks removal of the last method instead of letting the user try", async () => {
    vi.spyOn(loginMethodsService, "list").mockResolvedValue([{ ...password, canRemove: false }]);
    renderPanel();
    expect(
      await screen.findByText(
        /phương thức đăng nhập cuối cùng nên không thể gỡ\. Hãy liên kết Google trước/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("1/2 phương thức")).toBeInTheDocument();
    // Không có Google nên không thể gỡ mật khẩu dù canRemove.
    expect(screen.getByRole("button", { name: "Gỡ mật khẩu" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Liên kết Google" })).toBeEnabled();
  });

  it("unlinks Google with the current password and refreshes the list and profile", async () => {
    const u = userEvent.setup();
    const list = vi
      .spyOn(loginMethodsService, "list")
      .mockResolvedValueOnce([password, google])
      .mockResolvedValue([password]);
    const unlink = vi.spyOn(loginMethodsService, "unlinkGoogle").mockResolvedValue();
    renderPanel();
    await u.click(await screen.findByRole("button", { name: "Gỡ liên kết Google" }));
    const confirm = screen.getByRole("button", { name: "Gỡ liên kết" });
    expect(confirm).toBeDisabled();
    await u.type(screen.getByLabelText("Mật khẩu hiện tại"), "OldPass123!");
    await u.click(confirm);
    await waitFor(() => expect(unlink).toHaveBeenCalledWith({ currentPassword: "OldPass123!" }));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(sessionAuthService.getSession).toHaveBeenCalled();
  });

  it("keeps the dialog and says the password is wrong without calling it an expired session", async () => {
    const u = userEvent.setup();
    vi.spyOn(loginMethodsService, "list").mockResolvedValue([password, google]);
    vi.spyOn(loginMethodsService, "unlinkGoogle").mockRejectedValue(
      problem(401, "REAUTHENTICATION_FAILED"),
    );
    renderPanel();
    await u.click(await screen.findByRole("button", { name: "Gỡ liên kết Google" }));
    await u.type(screen.getByLabelText("Mật khẩu hiện tại"), "wrong");
    await u.click(screen.getByRole("button", { name: "Gỡ liên kết" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Mật khẩu hiện tại chưa đúng/);
    expect(alert).not.toHaveTextContent(/hết hạn/);
    expect(screen.getByLabelText("Mật khẩu hiện tại")).toBeInTheDocument();
  });

  it("shows the Google step only after the password is confirmed, then links with the fresh token", async () => {
    const u = userEvent.setup();
    vi.spyOn(loginMethodsService, "list").mockResolvedValue([password]);
    const verify = vi.spyOn(loginMethodsService, "verifyPassword").mockResolvedValue();
    const link = vi.spyOn(loginMethodsService, "linkGoogle").mockResolvedValue(google);
    renderPanel();
    await u.click(await screen.findByRole("button", { name: "Liên kết Google" }));
    expect(screen.queryByRole("button", { name: "Google giả" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận mật khẩu" })).toBeDisabled();
    await u.type(screen.getByLabelText("Mật khẩu hiện tại"), "OldPass123!");
    expect(screen.queryByRole("button", { name: "Google giả" })).not.toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Xác nhận mật khẩu" }));
    await waitFor(() => expect(verify).toHaveBeenCalledWith({ currentPassword: "OldPass123!" }));
    const googleButton = await screen.findByRole("button", { name: "Google giả" });
    expect(screen.getByText(/Mật khẩu đúng\./)).toBeInTheDocument();
    expect(link).not.toHaveBeenCalled();
    await u.click(googleButton);
    await waitFor(() =>
      expect(link).toHaveBeenCalledWith({
        idToken: "google-token",
        nonce: "n1",
        currentPassword: "OldPass123!",
      }),
    );
  });

  it("keeps the Google step hidden when the password is wrong", async () => {
    const u = userEvent.setup();
    vi.spyOn(loginMethodsService, "list").mockResolvedValue([password]);
    vi.spyOn(loginMethodsService, "verifyPassword").mockRejectedValue(
      problem(401, "REAUTHENTICATION_FAILED"),
    );
    renderPanel();
    await u.click(await screen.findByRole("button", { name: "Liên kết Google" }));
    await u.type(screen.getByLabelText("Mật khẩu hiện tại"), "sai");
    await u.click(screen.getByRole("button", { name: "Xác nhận mật khẩu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Mật khẩu hiện tại chưa đúng/);
    expect(screen.queryByRole("button", { name: "Google giả" })).not.toBeInTheDocument();
  });

  it("hides the Google step again when the confirmed password is edited", async () => {
    const u = userEvent.setup();
    vi.spyOn(loginMethodsService, "list").mockResolvedValue([password]);
    vi.spyOn(loginMethodsService, "verifyPassword").mockResolvedValue();
    renderPanel();
    await u.click(await screen.findByRole("button", { name: "Liên kết Google" }));
    await u.type(screen.getByLabelText("Mật khẩu hiện tại"), "OldPass123!");
    await u.click(screen.getByRole("button", { name: "Xác nhận mật khẩu" }));
    await screen.findByRole("button", { name: "Google giả" });
    await u.type(screen.getByLabelText("Mật khẩu hiện tại"), "x");
    expect(screen.queryByRole("button", { name: "Google giả" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận mật khẩu" })).toBeEnabled();
  });

  it("explains that the Google account already belongs to someone else", async () => {
    const u = userEvent.setup();
    vi.spyOn(loginMethodsService, "list").mockResolvedValue([password]);
    vi.spyOn(loginMethodsService, "linkGoogle").mockRejectedValue(
      problem(409, "GOOGLE_ACCOUNT_ALREADY_LINKED"),
    );
    vi.spyOn(loginMethodsService, "verifyPassword").mockResolvedValue();
    renderPanel();
    await u.click(await screen.findByRole("button", { name: "Liên kết Google" }));
    await u.type(screen.getByLabelText("Mật khẩu hiện tại"), "OldPass123!");
    await u.click(screen.getByRole("button", { name: "Xác nhận mật khẩu" }));
    await u.click(await screen.findByRole("button", { name: "Google giả" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /đã được dùng ở một tài khoản LegacyVault khác/,
    );
  });

  it("validates the new password before the Google step and sends all fields", async () => {
    const u = userEvent.setup();
    vi.spyOn(loginMethodsService, "list").mockResolvedValue([google]);
    const set = vi.spyOn(loginMethodsService, "setPassword").mockResolvedValue();
    renderPanel();
    await u.click(await screen.findByRole("button", { name: "Đặt mật khẩu" }));
    const googleButton = screen.getByRole("button", { name: "Google giả" });
    expect(googleButton).toBeDisabled();
    await u.type(screen.getByLabelText("Mật khẩu mới"), "short");
    expect(await screen.findByRole("alert")).toHaveTextContent(/phải có ít nhất 8 ký tự/);
    await u.clear(screen.getByLabelText("Mật khẩu mới"));
    await u.type(screen.getByLabelText("Mật khẩu mới"), "NewPass123!");
    await u.type(screen.getByLabelText("Nhập lại mật khẩu"), "Different1!");
    expect(await screen.findByText(/không khớp/)).toBeInTheDocument();
    expect(googleButton).toBeDisabled();
    await u.clear(screen.getByLabelText("Nhập lại mật khẩu"));
    await u.type(screen.getByLabelText("Nhập lại mật khẩu"), "NewPass123!");
    await u.click(googleButton);
    await waitFor(() =>
      expect(set).toHaveBeenCalledWith({
        googleIdToken: "google-token",
        nonce: "n1",
        newPassword: "NewPass123!",
        confirmPassword: "NewPass123!",
      }),
    );
  });

  it("removes the password only with the current password plus a fresh Google token", async () => {
    const u = userEvent.setup();
    vi.spyOn(loginMethodsService, "list").mockResolvedValue([password, google]);
    const remove = vi.spyOn(loginMethodsService, "removePassword").mockResolvedValue();
    renderPanel();
    await u.click(await screen.findByRole("button", { name: "Gỡ mật khẩu" }));
    expect(screen.getByRole("button", { name: "Google giả" })).toBeDisabled();
    await u.type(screen.getByLabelText("Mật khẩu hiện tại"), "OldPass123!");
    await u.click(screen.getByRole("button", { name: "Google giả" }));
    await waitFor(() =>
      expect(remove).toHaveBeenCalledWith({
        currentPassword: "OldPass123!",
        googleIdToken: "google-token",
        nonce: "n1",
      }),
    );
  });

  it("offers a retry when the list cannot be read", async () => {
    vi.spyOn(loginMethodsService, "list").mockRejectedValue(new Error("down"));
    renderPanel();
    expect(await screen.findByRole("alert")).toHaveTextContent(/Không đọc được/);
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
