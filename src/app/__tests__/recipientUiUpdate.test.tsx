import { ROUTES } from "@/shared/config/routes.config";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { HandoverPortal } from "@/features/handover/ui/HandoverPortal";
import { InvitationPanel } from "@/features/handover/ui/InvitationPanel";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";

const originalAdapter = apiClient.defaults.adapter;
const TOKEN = "Zk3p9QmX2vLw8TnR5sYb1HcA7dFgJe4U";
const ITEM_ID = "0198a000-0000-7000-8000-000000000002";
const GRANT_ID = "0198a000-0000-7000-8000-000000000001";
let client: QueryClient;
const user = {
  id: VAULT_ID,
  email: "recipient@example.test",
  fullName: "Recipient",
  role: "USER" as const,
  status: "ACTIVE" as const,
  emailVerified: true,
  hasPassword: false,
  createdAt: CREATED_AT,
  phone: "0912345678",
};

/** Lượt mẫu: tên gói và danh sách mục chỉ có khi chờ quyết định hoặc đã nhận, giống Backend. */
function turn(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: CONTAINER_ID,
    status,
    serverTime: "2026-11-09T02:00:00Z",
    invitedAt: "2026-11-08T02:00:00Z",
    responseDeadline: "2026-11-13T02:00:00Z",
    decisionDeadline: null,
    identityBypassed: false,
    identityConfirmedByExecutor: false,
    container: null,
    items: [],
    grant: null,
    ...extra,
  };
}
const withContent = {
  container: { name: "Gói gia đình" },
  items: [
    {
      id: ITEM_ID,
      name: "Sổ đỏ",
      kind: "FILE",
      fileName: "so-do.pdf",
      contentType: "application/pdf",
      sizeBytes: 12,
    },
  ],
};

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("recipient-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});
function ok(config: InternalAxiosRequestConfig, data: unknown): AxiosResponse {
  return { config, data, status: 200, statusText: "OK", headers: new AxiosHeaders() };
}
function setup(children: ReactNode, authenticated = true, path = "/") {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (authenticated) {
    store.dispatch(setCredentials({ user }));
  }
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}
function backendReturns(turns: unknown[]) {
  apiClient.defaults.adapter = async (config) => {
    if (config.url?.includes("/handover/invitations/") && config.method === "get") {
      return ok(config, { valid: true, responseExpired: false });
    }
    if (config.url?.endsWith("/claim")) {
      return ok(config, turn("IDENTITY_IN_PROGRESS"));
    }
    if (config.url?.endsWith("/accept")) {
      turns.splice(
        0,
        turns.length,
        turn("HANDOVER_COMMITTED", {
          ...withContent,
          grant: { id: GRANT_ID, status: "ACTIVE", expiresAt: "2026-12-05T02:00:00Z" },
        }),
      );
      return ok(config, turns[0]);
    }
    return ok(config, turns);
  };
}

it("keeps the way to the portal when the recipient creates an account, and lists the three steps", async () => {
  apiClient.defaults.adapter = async (config) =>
    ok(config, {
      valid: true,
      responseExpired: false,
      invitedEmailMasked: "r•••••t@example.test",
      accountExists: false,
      ownerFullName: "Chủ kho thử",
    });
  setup(<InvitationPanel />, false, `/receive?token=${TOKEN}`);
  const create = await screen.findByRole("link", { name: "Tạo tài khoản bằng email này" });
  expect(decodeURIComponent(create.getAttribute("href") ?? "")).toContain(
    `redirect=${ROUTES.BENEFICIARY.CLAIM}`,
  );
  expect(screen.getByRole("heading", { name: "Bạn sẽ làm gì" })).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.queryByRole("button", { name: "Nhận lời mời" })).not.toBeInTheDocument();
});

it("sends a signed-in recipient straight to the portal without claiming anything", async () => {
  backendReturns([]);
  const post = vi.spyOn(apiClient, "post");
  setup(
    <Routes>
      <Route path={ROUTES.RECEIVE} element={<InvitationPanel />} />
      <Route path={ROUTES.BENEFICIARY.CLAIM} element={<p>Cổng người nhận</p>} />
    </Routes>,
    true,
    `/receive?token=${TOKEN}`,
  );
  expect(await screen.findByText("Cổng người nhận")).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});

it("shows only the deadline that still matters and drops the title that sounds like a group", async () => {
  backendReturns([turn("IDENTITY_IN_PROGRESS")]);
  setup(<HandoverPortal />);
  expect(await screen.findByText("Hạn phản hồi")).toBeInTheDocument();
  expect(screen.queryByText("Hạn quyết định")).not.toBeInTheDocument();
  expect(screen.queryByText("Phần để lại")).not.toBeInTheDocument();
  expect(screen.queryByText(/Nhóm “Lượt bàn giao”/)).not.toBeInTheDocument();
});

it("drops the response deadline once the turn is waiting for the decision", async () => {
  backendReturns([
    turn("READY_TO_ACCEPT", { ...withContent, decisionDeadline: "2026-11-12T02:00:00Z" }),
  ]);
  setup(<HandoverPortal />);
  expect(await screen.findByText("Hạn quyết định")).toBeInTheDocument();
  expect(screen.queryByText("Hạn phản hồi")).not.toBeInTheDocument();
});

it("lists the content before the response panel so the recipient reviews first, then decides", async () => {
  backendReturns([
    turn("READY_TO_ACCEPT", { ...withContent, decisionDeadline: "2026-11-12T02:00:00Z" }),
  ]);
  setup(<HandoverPortal />);
  const items = await screen.findByRole("heading", { name: "Các mục dành cho bạn" });
  const response = screen.getByRole("heading", { name: "Phản hồi" });
  expect(items.compareDocumentPosition(response) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("confirms an accepted turn once at the top of the card and keeps the countdown above the title", async () => {
  const turns = [
    turn("READY_TO_ACCEPT", { ...withContent, decisionDeadline: "2026-11-12T02:00:00Z" }),
  ];
  backendReturns(turns);
  setup(<HandoverPortal />);
  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: /Đồng ý nhận/ }));
  await waitFor(() => expect(screen.getByText("Thành công")).toBeInTheDocument());
  const article = screen.getByRole("article");
  const first = within(article).getByText("Thành công");
  const countdown = screen.getByText(/để tải nội dung/);
  const title = screen.getByRole("heading", { name: "Gói gia đình" });
  expect(first.compareDocumentPosition(countdown) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(countdown.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("tells a recipient with no turn how to get the invitation, with no support link", async () => {
  backendReturns([]);
  setup(<HandoverPortal />);
  expect(await screen.findByText(/đăng nhập bằng đúng email ghi trong thư/)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Liên hệ hỗ trợ" })).not.toBeInTheDocument();
});

it("shows no support link under a terminal state either", async () => {
  backendReturns([turn("CANCELLED")]);
  setup(<HandoverPortal />);
  await screen.findByText(/Lượt bàn giao này đã bị hủy/);
  expect(screen.queryByRole("link", { name: "Liên hệ hỗ trợ" })).not.toBeInTheDocument();
});

it("sends the Xác minh menu to the handover portal where the ID photo dossier is submitted", async () => {
  backendReturns([turn("IDENTITY_IN_PROGRESS")]);
  setup(
    <RecipientLayout active="overview">
      <p>nội dung</p>
    </RecipientLayout>,
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Xác minh" }).getAttribute("href")).toBe(
      ROUTES.BENEFICIARY.HANDOVER,
    ),
  );
});
