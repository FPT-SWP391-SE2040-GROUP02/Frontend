import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { avatarService } from "@/entities/user/api/avatarService";
import authReducer, { setUser } from "@/entities/user/model/authSlice";
import type { User } from "@/entities/user";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { AvatarEditor } from "../AvatarEditor";

const USER: User = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.test",
  fullName: "Nguyễn An",
  role: "USER",
  status: "ACTIVE",
  createdAt: "2026-10-01T00:00:00Z",
  hasAvatar: false,
};

function renderEditor(user: User = USER) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(setUser(user));
  render(
    <Provider store={store}>
      <AvatarEditor />
    </Provider>,
  );
  return store;
}

function pngFile(size = 100, type = "image/png") {
  return new File([new Uint8Array(size)], "a.png", { type });
}

function badRequest(message: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("x", undefined, config, undefined, {
    status: 400,
    statusText: "",
    headers: {},
    config,
    data: { code: "VALIDATION_ERROR", errors: { file: [message] } },
  });
}

beforeEach(() => {
  accessTokenMemory.set("avatar-fixture");
  vi.spyOn(avatarService, "download").mockRejectedValue(new Error("no avatar"));
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("AvatarEditor", () => {
  it("offers to add a photo and hides delete when there is no avatar", () => {
    renderEditor();
    expect(screen.getByRole("button", { name: "Thêm ảnh" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xóa ảnh" })).not.toBeInTheDocument();
  });

  it("uploads the chosen image and puts the confirmed user into the session", async () => {
    const user = userEvent.setup();
    const updated: User = { ...USER, hasAvatar: true, avatarUpdatedAt: "2026-10-24T06:00:00Z" };
    const upload = vi.spyOn(avatarService, "upload").mockResolvedValue(updated);
    const store = renderEditor();
    const file = pngFile();
    await user.upload(screen.getByLabelText("Chọn ảnh đại diện"), file);
    await waitFor(() => expect(upload).toHaveBeenCalledWith(file));
    await waitFor(() => expect(store.getState().auth.user).toEqual(updated));
    expect(await screen.findByRole("status")).toHaveTextContent("Đã cập nhật ảnh đại diện.");
  });

  it("blocks a wrong type or oversized image before calling the Backend", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const upload = vi.spyOn(avatarService, "upload");
    renderEditor();
    const input = screen.getByLabelText("Chọn ảnh đại diện");
    await user.upload(input, pngFile(100, "application/pdf"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
    await user.upload(input, pngFile(2 * 1024 * 1024 + 1));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ảnh tối đa 2 MB.");
    expect(upload).not.toHaveBeenCalled();
  });

  it("shows the specific Backend message and keeps the current user when upload fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(avatarService, "upload").mockRejectedValue(
      badRequest("Chỉ nhận ảnh JPEG, PNG hoặc WebP."),
    );
    const store = renderEditor();
    await user.upload(screen.getByLabelText("Chọn ảnh đại diện"), pngFile());
    expect(await screen.findByRole("alert")).toHaveTextContent("Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
    expect(store.getState().auth.user).toEqual(USER);
  });

  it("removes the avatar and updates the session after the Backend confirms", async () => {
    const user = userEvent.setup();
    const withAvatar: User = { ...USER, hasAvatar: true, avatarUpdatedAt: "2026-10-24T06:00:00Z" };
    vi.spyOn(avatarService, "download").mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:avatar"), revokeObjectURL: vi.fn() });
    const remove = vi.spyOn(avatarService, "remove").mockResolvedValue(USER);
    const store = renderEditor(withAvatar);
    expect(screen.getByRole("button", { name: "Đổi ảnh" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xóa ảnh" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(store.getState().auth.user?.hasAvatar).toBe(false));
    expect(await screen.findByRole("button", { name: "Thêm ảnh" })).toBeInTheDocument();
  });
});
