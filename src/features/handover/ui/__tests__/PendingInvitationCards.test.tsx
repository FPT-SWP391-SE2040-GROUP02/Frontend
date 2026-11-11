import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ROUTES } from "@/shared/config/routes.config";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { PendingInvitationCards } from "../PendingInvitationCards";

const TURN_ID = CONTAINER_ID;
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
const invitation = {
  turnId: TURN_ID,
  containerName: "Gói gia đình",
  ownerFullName: "Nguyễn Văn A",
  invitedAt: "2026-11-08T02:00:00Z",
};
const claimedTurn = {
  id: TURN_ID,
  status: "IDENTITY_IN_PROGRESS",
  serverTime: "2026-11-09T02:00:00Z",
  invitedAt: "2026-11-08T02:00:00Z",
  responseDeadline: "2026-11-13T02:00:00Z",
  decisionDeadline: null,
  identityBypassed: false,
  identityConfirmedByExecutor: false,
  container: null,
  items: [],
  grant: null,
};
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("recipient-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup() {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(setCredentials({ user }));
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[ROUTES.BENEFICIARY.CLAIM]}>
          <Routes>
            <Route path={ROUTES.BENEFICIARY.CLAIM} element={<PendingInvitationCards />} />
            <Route path={ROUTES.BENEFICIARY.HANDOVER} element={<p>Màn nộp hồ sơ</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

function rejection(status: number, body: object) {
  const headers = new AxiosHeaders();
  return new AxiosError("fail", "ERR_BAD_REQUEST", { headers }, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers },
    data: body,
  });
}

/** Biên bản trả về sau khi tạo; chỉ cần đủ để schema nhận. */
const createdDocument = { id: TURN_ID };

describe("PendingInvitationCards (thẻ thư mời trong cổng người nhận)", () => {
  it("hiện thẻ vàng với tên gói, người gửi, email và hai nút; chỉ mở trang thì KHÔNG gọi API nhận", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([invitation]);
    const post = vi.spyOn(apiClient, "post");
    setup();

    expect(await screen.findByText("GÓI MỚI CHỜ BẠN XÁC NHẬN")).toBeInTheDocument();
    expect(screen.getByText("Gói gia đình")).toBeInTheDocument();
    expect(
      screen.getByText("Từ Nguyễn Văn A · gửi tới nguoi-nhan@example.com"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bạn muốn nhận gói này không\?/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đồng ý nhận" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Từ chối nhận" })).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("không có lời mời thì không hiện khu nào", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup();

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(screen.queryByText("GÓI MỚI CHỜ BẠN XÁC NHẬN")).toBeNull();
  });

  it("Đồng ý nhận: gọi API nhận lượt, tạo biên bản ACCEPT rồi chuyển sang màn nộp hồ sơ", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([invitation]);
    const post = vi.spyOn(apiClient, "post").mockImplementation((url: string) => {
      if (url.endsWith("/claim")) return Promise.resolve(claimedTurn);
      return Promise.resolve(createdDocument);
    });
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "Đồng ý nhận" }));

    expect(await screen.findByText("Màn nộp hồ sơ")).toBeInTheDocument();
    expect(post.mock.calls[0][0]).toBe(`/handover/turns/${TURN_ID}/claim`);
    expect(post.mock.calls[1][0]).toBe(`/handover/turns/${TURN_ID}/document`);
    expect(post.mock.calls[1][1]).toEqual({ kind: "ACCEPT" });
  });

  it("Từ chối nhận: chọn sẵn DECLINE ở màn nộp hồ sơ", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([invitation]);
    const post = vi.spyOn(apiClient, "post").mockImplementation((url: string) => {
      if (url.endsWith("/claim")) return Promise.resolve(claimedTurn);
      return Promise.resolve(createdDocument);
    });
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "Từ chối nhận" }));

    expect(await screen.findByText("Màn nộp hồ sơ")).toBeInTheDocument();
    expect(post.mock.calls[1][1]).toEqual({ kind: "DECLINE" });
  });

  it("trong lúc chờ hiện dòng đang mở bước tải ảnh căn cước và ký biên bản", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([invitation]);
    vi.spyOn(apiClient, "post").mockImplementation(() => new Promise(() => {}));
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "Đồng ý nhận" }));

    expect(
      await screen.findByText("Đang mở bước tải ảnh căn cước và ký biên bản…"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Từ chối nhận" })).toBeDisabled();
  });

  it("nhận lượt lỗi (sai email) thì báo ngay trên thẻ, không chuyển màn", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([invitation]);
    vi.spyOn(apiClient, "post").mockRejectedValue(
      rejection(403, {
        code: "HANDOVER_EMAIL_MISMATCH",
        invitedEmailMasked: "n••••••••n@example.com",
      }),
    );
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "Đồng ý nhận" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Lời mời này gửi tới n••••••••n@example.com",
    );
    expect(screen.queryByText("Màn nộp hồ sơ")).toBeNull();
    expect(screen.getByRole("button", { name: "Đồng ý nhận" })).toBeEnabled();
  });
});
