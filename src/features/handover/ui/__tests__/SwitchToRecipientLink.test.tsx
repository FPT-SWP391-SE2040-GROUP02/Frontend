import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ROUTES } from "@/shared/config/routes.config";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { SwitchToRecipientLink } from "../SwitchToRecipientLink";
import { RecipientInvitationBanner } from "../RecipientInvitationBanner";

const user = {
  id: VAULT_ID,
  email: "chu-kho@example.com",
  fullName: "Chủ kho",
  role: "USER" as const,
  status: "ACTIVE" as const,
  emailVerified: true,
  hasPassword: false,
  createdAt: CREATED_AT,
};
const invitation = {
  turnId: CONTAINER_ID,
  containerName: "Gói gia đình",
  ownerFullName: "Nguyễn Văn A",
  invitedAt: "2026-11-08T02:00:00Z",
};
const turn = {
  id: CONTAINER_ID,
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
  accessTokenMemory.set("owner-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

/** Giả lập Backend: lời mời chờ và danh sách lượt do test quy định. */
function backend(invitations: unknown[], turns: unknown[]) {
  return vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
    if (url.endsWith("/invitations/mine")) return Promise.resolve(invitations);
    if (url.endsWith("/turns/me")) return Promise.resolve(turns);
    return Promise.resolve([]);
  });
}

function setup(children: React.ReactNode) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(setCredentials({ user }));
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("SwitchToRecipientLink", () => {
  it("không hiện khi tài khoản chưa có lời mời và chưa có lượt", async () => {
    const get = backend([], []);
    setup(<SwitchToRecipientLink className="x" />);

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("link", { name: /Sang vai Người nhận/ })).toBeNull();
  });

  it("hiện kèm huy hiệu số lời mời khi có lời mời chờ", async () => {
    backend([invitation], []);
    setup(<SwitchToRecipientLink className="x" />);

    const link = await screen.findByRole("link", { name: /Sang vai Người nhận/ });
    expect(link).toHaveAttribute("href", ROUTES.BENEFICIARY.CLAIM);
    expect(screen.getByLabelText("1 lời mời đang chờ")).toBeInTheDocument();
  });

  it("hiện (không huy hiệu) khi đã có lượt dù không còn lời mời chờ", async () => {
    backend([], [turn]);
    setup(<SwitchToRecipientLink className="x" />);

    expect(await screen.findByRole("link", { name: /Sang vai Người nhận/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/lời mời đang chờ/)).toBeNull();
  });
});

describe("RecipientInvitationBanner (Tổng quan Chủ kho)", () => {
  it("hiện khung vàng với nút Mở cổng người nhận khi có lời mời chờ", async () => {
    backend([invitation], []);
    setup(<RecipientInvitationBanner />);

    expect(await screen.findByText("Nguyễn Văn A đã để lại cho bạn một gói")).toBeInTheDocument();
    expect(
      screen.getByText(/Gói nằm ở cổng người nhận, bạn có thể mở bất cứ lúc nào bạn sẵn sàng/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở cổng người nhận" })).toHaveAttribute(
      "href",
      ROUTES.BENEFICIARY.CLAIM,
    );
  });

  it("không hiện khi không có lời mời chờ", async () => {
    const get = backend([], [turn]);
    setup(<RecipientInvitationBanner />);

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(screen.queryByRole("link", { name: "Mở cổng người nhận" })).toBeNull();
  });
});
