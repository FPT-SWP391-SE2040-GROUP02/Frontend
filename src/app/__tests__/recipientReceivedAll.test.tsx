import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { TurnDetail } from "@/features/handover/ui/TurnDetail";

const originalAdapter = apiClient.defaults.adapter;
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
};

function turn(extra: object = {}) {
  return {
    id: CONTAINER_ID,
    status: "HANDOVER_COMMITTED",
    serverTime: CREATED_AT,
    invitedAt: CREATED_AT,
    responseDeadline: "2026-12-01T00:00:00Z",
    decisionDeadline: "2026-12-02T00:00:00Z",
    identityBypassed: false,
    identityConfirmedByExecutor: true,
    container: { name: "Gói thử" },
    items: [
      {
        id: "0198a000-0000-7000-8000-0000000000a1",
        name: "Mục A",
        kind: "TEXT",
        fileName: null,
        contentType: "text/plain",
        sizeBytes: 11,
      },
    ],
    grant: {
      id: "0198a000-0000-7000-8000-000000000001",
      status: "ACTIVE",
      expiresAt: "2026-12-30T00:00:00Z",
    },
    reviewer: { fullName: "Luật sư Dũng", lawyerCardNumber: "LS-12345" },
    ...extra,
  };
}

/** Biên bản người nhận đọc kèm lượt: dùng cho tờ phiếu giao nhận (ô chữ ký Bên nhận). */
const RECORD = {
  id: "0198a000-0000-7000-8000-000000000003",
  vaultId: VAULT_ID,
  vaultName: "Tài sản thử",
  ownerName: "Chủ tài sản thử",
  status: "COMPLETED",
  revisionNo: 1,
  requestedAt: CREATED_AT,
  finalizedAt: CREATED_AT,
  completedAt: CREATED_AT,
  verifierName: "Luật sư Dũng",
  executorName: "Người thực thi thử",
  verifierSignedAt: CREATED_AT,
  executorSignedAt: CREATED_AT,
  recipients: [
    {
      beneficiaryId: "0198a000-0000-7000-8000-000000000004",
      fullName: "Người nhận thử",
      citizenId: "001090000001",
      assets: [],
      turnId: CONTAINER_ID,
      turnStatus: "HANDOVER_COMMITTED",
      claimed: true,
      submissionId: null,
      submissionStatus: "",
      identityConfirmedAt: CREATED_AT,
      signedAt: CREATED_AT,
    },
  ],
  canSign: false,
  availableAssets: [],
  availableRecipients: [],
  ownerSplit: [],
};

function ok(config: InternalAxiosRequestConfig, data: unknown): AxiosResponse {
  return { config, data, status: 200, statusText: "OK", headers: new AxiosHeaders() };
}

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

function setup() {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(setCredentials({ user }));
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <TurnDetail turnId={CONTAINER_ID} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

it("hiện Người xét duyệt kèm số thẻ luật sư và ký phiếu trong tờ phiếu gọi đúng API", async () => {
  const posts: string[] = [];
  let received: string | null = null;
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "post" && config.url?.endsWith("/received-all")) {
      posts.push(config.url);
      received = "2026-10-20T03:00:00Z";
    }
    if (config.url?.endsWith("/record")) return ok(config, RECORD);
    return ok(
      config,
      config.url?.endsWith("/handover/turns/me")
        ? [turn({ receivedAllAt: received })]
        : turn({ receivedAllAt: received }),
    );
  };
  setup();

  expect(await screen.findByText("Luật sư Dũng (thẻ luật sư LS-12345)")).toBeInTheDocument();
  // Ngoài tờ phiếu không có nút ký: chỉ có nút mở phiếu.
  expect(
    screen.queryByRole("button", { name: "Tôi đã nhận đủ, ký phiếu" }),
  ).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole("button", { name: "Xem và ký phiếu giao nhận" }));
  const sign = await screen.findByRole("button", { name: "Tôi đã nhận đủ, ký phiếu" });
  // Nút ký nằm ngay ô chữ ký của Bên nhận.
  expect(sign.closest("div.break-inside-avoid")).toHaveTextContent("Bên nhận");
  fireEvent.click(sign);

  await waitFor(() => expect(posts).toHaveLength(1));
  expect(posts[0]).toContain(`/handover/turns/${CONTAINER_ID}/received-all`);
  expect(await screen.findByText(/Bạn đã xác nhận nhận đủ lúc/)).toBeInTheDocument();
  // Nhận đủ rồi: không còn khung tải về và cả 6 bước của tiến trình đều "Xong".
  expect(screen.queryByRole("button", { name: "Tải xuống Mục A" })).not.toBeInTheDocument();
  expect(screen.getAllByText("Xong")).toHaveLength(6);
  expect(screen.queryByText("Đang ở đây")).not.toBeInTheDocument();
});

it("chưa tải hết các mục thì khóa nút Xem và ký phiếu giao nhận và báo còn mấy mục", async () => {
  const pending = turn({ items: [{ ...turn().items[0], downloaded: false }] });
  apiClient.defaults.adapter = async (config) => {
    if (config.url?.endsWith("/record")) return ok(config, RECORD);
    return ok(config, config.url?.endsWith("/handover/turns/me") ? [pending] : pending);
  };
  setup();

  const button = await screen.findByRole("button", { name: "Xem và ký phiếu giao nhận" });
  expect(button).toBeDisabled();
  expect(screen.getByText(/Tải hết rồi mới xác nhận được/)).toBeInTheDocument();
});

it("báo thiếu hoặc sai gửi đúng nội dung", async () => {
  let body: unknown = null;
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "post" && config.url?.endsWith("/receipt-issue")) {
      body = JSON.parse(String(config.data));
    }
    return ok(config, config.url?.endsWith("/handover/turns/me") ? [turn()] : turn());
  };
  setup();

  fireEvent.change(await screen.findByLabelText("Tài sản thiếu hoặc sai"), {
    target: { value: "Thiếu ảnh" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Báo thiếu hoặc sai" }));
  await waitFor(() => expect(body).toEqual({ note: "Thiếu ảnh" }));
});
