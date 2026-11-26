import { ROUTES } from "@/shared/config/routes.config";
import { cleanup, render, screen } from "@testing-library/react";
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
import { TurnDetail } from "@/features/handover/ui/TurnDetail";
import { TurnHub } from "@/features/handover/ui/TurnHub";
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
/** Biên bản đang ở bước ký mà người nhận đọc kèm lượt chờ ký. */
const SIGNING_RECORD = {
  id: "0198a000-0000-7000-8000-000000000003",
  vaultId: VAULT_ID,
  vaultName: "Tài sản thử",
  ownerName: "Chủ tài sản thử",
  status: "SIGNING",
  revisionNo: 1,
  requestedAt: CREATED_AT,
  finalizedAt: CREATED_AT,
  completedAt: null,
  verifierName: "Luật sư thử",
  executorName: "Người thực thi thử",
  verifierSignedAt: null,
  executorSignedAt: null,
  recipients: [],
  canSign: true,
  availableAssets: [],
  availableRecipients: [],
  ownerSplit: [],
};
function backendReturns(turns: unknown[]) {
  apiClient.defaults.adapter = async (config) => {
    if (config.url?.endsWith("/record")) {
      return ok(config, SIGNING_RECORD);
    }
    if (config.url?.includes("/handover/invitations/") && config.method === "get") {
      return ok(config, { valid: true, responseExpired: false });
    }
    if (config.url?.endsWith("/claim")) {
      return ok(config, turn("IDENTITY_IN_PROGRESS"));
    }
    if (config.method === "get" && config.url?.endsWith("/submission")) return ok(config, "");
    if (config.method === "get" && /\/handover\/turns\/(?!me$)[^/]+$/.test(config.url ?? "")) {
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
      ownerFullName: "Chủ tài sản thử",
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
  setup(<TurnDetail turnId={CONTAINER_ID} />);
  expect(await screen.findByText("Hạn phản hồi")).toBeInTheDocument();
  expect(screen.queryByText("Hạn quyết định")).not.toBeInTheDocument();
  expect(screen.queryByText(/Nhóm “Lượt bàn giao”/)).not.toBeInTheDocument();
});

it("drops the response deadline once the turn is waiting for signatures, with no decision deadline", async () => {
  backendReturns([turn("READY_TO_ACCEPT", withContent)]);
  setup(<TurnDetail turnId={CONTAINER_ID} />);
  expect(await screen.findByRole("heading", { name: "Gói gia đình" })).toBeInTheDocument();
  expect(screen.queryByText("Hạn phản hồi")).not.toBeInTheDocument();
  expect(screen.queryByText("Hạn quyết định")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Đồng ý nhận/ })).not.toBeInTheDocument();
});

it("shows the download countdown once the record is fully signed", async () => {
  backendReturns([
    turn("HANDOVER_COMMITTED", {
      ...withContent,
      grant: { id: GRANT_ID, status: "ACTIVE", expiresAt: "2026-12-05T02:00:00Z" },
    }),
  ]);
  setup(<TurnDetail turnId={CONTAINER_ID} />);
  expect(await screen.findByRole("heading", { name: "Gói gia đình" })).toBeInTheDocument();
  expect(screen.getByText(/để tải nội dung/)).toBeInTheDocument();
});

it("tells a recipient with no turn how to get the invitation, with no support link", async () => {
  backendReturns([]);
  setup(<TurnHub />);
  expect(await screen.findByText(/đăng nhập bằng đúng email ghi trong thư/)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Liên hệ hỗ trợ" })).not.toBeInTheDocument();
});

it("shows no support link under a terminal state either", async () => {
  backendReturns([turn("CANCELLED")]);
  setup(<TurnDetail turnId={CONTAINER_ID} />);
  await screen.findByText(/Lượt này đã bị hủy vì luật sư đã sửa biên bản/);
  expect(screen.queryByRole("link", { name: "Liên hệ hỗ trợ" })).not.toBeInTheDocument();
});

it("has no Xác minh item in the recipient menu", async () => {
  backendReturns([turn("IDENTITY_IN_PROGRESS")]);
  setup(
    <RecipientLayout active="overview">
      <p>nội dung</p>
    </RecipientLayout>,
  );
  await screen.findByText("nội dung");
  expect(screen.queryByRole("link", { name: "Xác minh" })).not.toBeInTheDocument();
});
