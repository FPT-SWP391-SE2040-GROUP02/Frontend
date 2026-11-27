import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { phoneService } from "@/entities/user/api/phoneService";
import authReducer, { setUser } from "@/entities/user/model/authSlice";
import type { User } from "@/entities/user";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ProfilePhoneField } from "../ProfilePhoneField";

const USER: User = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.test",
  fullName: "Nguyễn An",
  role: "USER",
  status: "ACTIVE",
  createdAt: "2026-10-01T00:00:00Z",
  hasAvatar: false,
};

function renderField(user: User = USER) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(setUser(user));
  render(
    <Provider store={store}>
      <dl>
        <ProfilePhoneField phone={user.phone} />
      </dl>
    </Provider>,
  );
  return store;
}

function problem(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("x", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
}

beforeEach(() => {
  accessTokenMemory.set("phone-fixture");
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("ProfilePhoneField", () => {
  it("offers to add a number when the account has none", () => {
    renderField();
    expect(screen.getByText("Chưa có thông tin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm số" })).toBeInTheDocument();
  });

  it("shows the current number and offers to edit it", () => {
    renderField({ ...USER, phone: "0912345678" });
    expect(screen.getByText("0912345678")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sửa số" })).toBeInTheDocument();
  });

  it("saves the normalized number and puts the confirmed user into the session", async () => {
    const set = vi.spyOn(phoneService, "set").mockResolvedValue({ ...USER, phone: "0912345678" });
    const store = renderField();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Thêm số" }));
    await user.type(screen.getByLabelText("Số điện thoại"), "091 234-5678");
    await user.click(screen.getByRole("button", { name: "Lưu số điện thoại" }));

    await waitFor(() => expect(set).toHaveBeenCalledWith("0912345678"));
    await waitFor(() => expect(store.getState().auth.user?.phone).toBe("0912345678"));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Lưu số điện thoại" })).not.toBeInTheDocument(),
    );
  });

  it("requires a number and does not call the backend", async () => {
    const set = vi.spyOn(phoneService, "set");
    renderField();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Thêm số" }));
    await user.click(screen.getByRole("button", { name: "Lưu số điện thoại" }));

    expect(await screen.findByText("Số điện thoại là bắt buộc.")).toBeInTheDocument();
    expect(set).not.toHaveBeenCalled();
  });

  it("rejects a number longer than 20 characters", async () => {
    const set = vi.spyOn(phoneService, "set");
    renderField();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Thêm số" }));
    await user.type(screen.getByLabelText("Số điện thoại"), "1".repeat(21));
    await user.click(screen.getByRole("button", { name: "Lưu số điện thoại" }));

    expect(await screen.findByText("Số điện thoại tối đa 20 ký tự.")).toBeInTheDocument();
    expect(set).not.toHaveBeenCalled();
  });

  it("does not call the backend when the number is unchanged", async () => {
    const set = vi.spyOn(phoneService, "set");
    renderField({ ...USER, phone: "0912345678" });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Sửa số" }));
    await user.click(screen.getByRole("button", { name: "Lưu số điện thoại" }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Lưu số điện thoại" })).not.toBeInTheDocument(),
    );
    expect(set).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and the session unchanged when the number belongs to another account", async () => {
    vi.spyOn(phoneService, "set").mockRejectedValue(
      problem(409, { code: "PHONE_ALREADY_EXISTS", field: "phone" }),
    );
    const store = renderField({ ...USER, phone: "0912345678" });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Sửa số" }));
    const input = screen.getByLabelText("Số điện thoại");
    await user.clear(input);
    await user.type(input, "0987654321");
    await user.click(screen.getByRole("button", { name: "Lưu số điện thoại" }));

    expect(await screen.findByText("Số điện thoại đã được dùng.")).toBeInTheDocument();
    expect(store.getState().auth.user?.phone).toBe("0912345678");
    expect(screen.getByRole("button", { name: "Lưu số điện thoại" })).toBeInTheDocument();
  });
});
