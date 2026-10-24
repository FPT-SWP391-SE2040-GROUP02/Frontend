import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { ForgotPasswordForm } from "@/features/auth/ui/ForgotPasswordForm";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(content: ReactNode, path = "/forgot-password") {
  const store = configureStore({ reducer: { auth: authReducer } });
  function Location() {
    return <output aria-label="Current query">{useLocation().search}</output>;
  }
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          {content}
          <Location />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  return store;
}
function failure(status: number, code: string) {
  return new AxiosError("private error", undefined, undefined, undefined, {
    status,
    statusText: "Error",
    data: { code, detail: "secret server detail" },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}
function fillPassword() {
  fireEvent.change(screen.getByLabelText("Mật khẩu mới", { exact: true }), {
    target: { value: "Abcdefg!" },
  });
  fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu mới"), {
    target: { value: "Abcdefg!" },
  });
}

it("sends one forgot-password request, waits for acknowledgement and shows the success copy", async () => {
  let finish!: () => void;
  const post = vi.spyOn(apiClient, "post").mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  setup(<ForgotPasswordForm />);
  fireEvent.change(screen.getByLabelText("Email đã đăng ký"), {
    target: { value: "unknown@example.test" },
  });
  const send = screen.getByRole("button", { name: "Yêu cầu đặt lại mật khẩu" });
  fireEvent.click(send);
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  fireEvent.click(send);
  expect(screen.queryByText("Gửi email thành công")).not.toBeInTheDocument();
  expect(send).toBeDisabled();
  finish();
  await screen.findByText("Gửi email thành công");
  expect(post).toHaveBeenCalledExactlyOnceWith("/auth/forgot-password", {
    email: "unknown@example.test",
  });
  expect(screen.getByText(/đã gửi liên kết đặt lại mật khẩu/)).toBeInTheDocument();
  expect(client.getMutationCache().getAll()).toHaveLength(0);
});

it("shows a not-registered error and keeps the form for unknown emails", async () => {
  vi.spyOn(apiClient, "post").mockRejectedValue(failure(404, "EMAIL_NOT_FOUND"));
  setup(<ForgotPasswordForm />);
  fireEvent.change(screen.getByLabelText("Email đã đăng ký"), {
    target: { value: "khongco@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Yêu cầu đặt lại mật khẩu" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("chưa được đăng ký");
  expect(screen.queryByText("Gửi email thành công")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Email đã đăng ký")).toHaveValue("khongco@example.test");
  fireEvent.change(screen.getByLabelText("Email đã đăng ký"), { target: { value: "khongco@" } });
  expect(screen.queryByText(/chưa được đăng ký/)).not.toBeInTheDocument();
});

it("keeps the email on rate limit and exposes no server details", async () => {
  vi.spyOn(apiClient, "post").mockRejectedValue(failure(429, "RATE_LIMITED"));
  setup(<ForgotPasswordForm />);
  fireEvent.change(screen.getByLabelText("Email đã đăng ký"), {
    target: { value: "fixture@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Yêu cầu đặt lại mật khẩu" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("thao tác quá nhanh");
  expect(screen.getByLabelText("Email đã đăng ký")).toHaveValue("fixture@example.test");
  expect(screen.queryByText(/secret server detail/)).not.toBeInTheDocument();
});

it.each(["", "?token=", "?token=a&token=b", `?token=${"a".repeat(257)}`])(
  "blocks unusable reset links %s without submitting",
  (query) => {
    const post = vi.spyOn(apiClient, "post");
    setup(<ResetPasswordPage />, "/reset-password" + query);
    expect(screen.getByRole("heading", { name: "Liên kết không hợp lệ" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đặt lại mật khẩu" })).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  },
);

it("maps reset DTO only on submit, waits for 204, clears session/cache and removes token", async () => {
  let finish!: () => void;
  const post = vi.spyOn(apiClient, "post").mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const store = setup(<ResetPasswordPage />, "/reset-password?token=opaque-link");
  store.dispatch(
    setCredentials({
      user: {
        id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10",
        email: "fixture@example.test",
        fullName: "Fixture",
        role: "USER",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: true,
        createdAt: "2026-10-18T00:00:00Z",
      },
    }),
  );
  accessTokenMemory.set("old-session");
  client.setQueryData(["private-fixture"], "old data");
  expect(post).not.toHaveBeenCalled();
  fillPassword();
  const submit = screen.getByRole("button", { name: "Đặt lại mật khẩu" });
  fireEvent.click(submit);
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  fireEvent.click(submit);
  expect(screen.queryByText("Đã đặt lại mật khẩu")).not.toBeInTheDocument();
  finish();
  await screen.findByRole("heading", { name: "Đã đặt lại mật khẩu" });
  expect(post).toHaveBeenCalledExactlyOnceWith("/auth/reset-password", {
    token: "opaque-link",
    newPassword: "Abcdefg!",
    confirmPassword: "Abcdefg!",
  });
  expect(screen.getByLabelText("Current query")).toBeEmptyDOMElement();
  expect(accessTokenMemory.get()).toBeNull();
  expect(store.getState().auth.isAuthenticated).toBe(false);
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  expect(client.getMutationCache().getAll()).toHaveLength(0);
});

it("stops retrying an invalid token and offers a new link", async () => {
  const post = vi.spyOn(apiClient, "post").mockRejectedValue(failure(400, "INVALID_RESET_TOKEN"));
  setup(<ResetPasswordPage />, "/reset-password?token=used");
  fillPassword();
  fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("đã hết hạn hoặc đã dùng");
  expect(screen.getByRole("button", { name: "Đặt lại mật khẩu" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Yêu cầu liên kết mới" })).toHaveAttribute(
    "href",
    "/forgot-password",
  );
  expect(post).toHaveBeenCalledTimes(1);
});

it("retains the form on network failure without claiming success", async () => {
  vi.spyOn(apiClient, "post").mockRejectedValue(new AxiosError("network"));
  setup(<ResetPasswordPage />, "/reset-password?token=opaque-link");
  fillPassword();
  fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Mật khẩu mới", { exact: true })).toHaveValue("Abcdefg!");
  expect(screen.queryByText("Đã đặt lại mật khẩu")).not.toBeInTheDocument();
});

it("drops old form state and late feedback when switching reset tokens", async () => {
  let reject!: (error: Error) => void;
  vi.spyOn(apiClient, "post").mockImplementation(
    () =>
      new Promise<void>((_, fail) => {
        reject = fail;
      }),
  );
  function SwitchLink() {
    const navigate = useNavigate();
    return (
      <>
        <ResetPasswordPage />
        <button onClick={() => navigate("/reset-password?token=new-link")}>New link</button>
      </>
    );
  }
  setup(<SwitchLink />, "/reset-password?token=old-link");
  fillPassword();
  fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  await waitFor(() => expect(reject).toBeTypeOf("function"));
  fireEvent.click(screen.getByRole("button", { name: "New link" }));
  reject(new Error("old failure"));
  await waitFor(() =>
    expect(screen.getByLabelText("Mật khẩu mới", { exact: true })).toHaveValue(""),
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
