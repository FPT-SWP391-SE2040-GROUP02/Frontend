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
import { HandoverPortal } from "@/features/handover/ui/HandoverPortal";

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
    items: [],
    grant: {
      id: "0198a000-0000-7000-8000-000000000001",
      status: "ACTIVE",
      expiresAt: "2026-12-30T00:00:00Z",
    },
    reviewer: { fullName: "Luật sư Dũng", lawyerCardNumber: "LS-12345" },
    ...extra,
  };
}

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
          <HandoverPortal />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

it("hiện Người xét duyệt kèm số thẻ luật sư và nút Tôi đã nhận đủ gọi đúng API", async () => {
  const posts: string[] = [];
  let received: string | null = null;
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "post" && config.url?.endsWith("/received-all")) {
      posts.push(config.url);
      received = "2026-10-20T03:00:00Z";
    }
    return ok(
      config,
      config.url?.endsWith("/handover/turns/me")
        ? [turn({ receivedAllAt: received })]
        : turn({ receivedAllAt: received }),
    );
  };
  setup();

  expect(await screen.findByTestId("reviewer-line")).toHaveTextContent(
    "Luật sư Dũng (thẻ luật sư LS-12345)",
  );
  fireEvent.click(screen.getByRole("button", { name: "Tôi đã nhận đủ" }));

  await waitFor(() => expect(posts).toHaveLength(1));
  expect(posts[0]).toContain(`/handover/turns/${CONTAINER_ID}/received-all`);
  expect(await screen.findByText(/Bạn đã xác nhận nhận đủ lúc/)).toBeInTheDocument();
});
