import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { documentFixture } from "@/entities/handoverDocument/testing/documentFixture";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { HandoverPortal } from "@/features/handover/ui/HandoverPortal";

const originalAdapter = apiClient.defaults.adapter;
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

function turn(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: CONTAINER_ID,
    status,
    serverTime: "2026-11-10T06:00:00Z",
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
const committed = turn("HANDOVER_COMMITTED", {
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
  grant: { id: GRANT_ID, status: "ACTIVE", expiresAt: "2026-12-10T06:00:00Z" },
});

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
function backend(turns: unknown[], documentBody: unknown) {
  apiClient.defaults.adapter = async (config) => {
    if (config.url?.endsWith("/document")) return ok(config, documentBody);
    return ok(config, turns);
  };
}

it("đã nhận: nút tải tài sản và biên bản đã ký hiện cạnh nhau", async () => {
  backend([committed], documentFixture({ turnId: CONTAINER_ID }));
  setup();

  const assets = await screen.findByRole("heading", { name: "Các mục dành cho bạn" });
  expect(await screen.findByRole("heading", { name: "Biên bản bạn đã ký" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tải xuống Sổ đỏ" })).toBeInTheDocument();
  expect(screen.getByText("Hoàn tất")).toBeInTheDocument();
  const grid = assets.closest("div.grid");
  expect(grid).not.toBeNull();
  expect(
    within(grid as HTMLElement).getByRole("heading", { name: "Biên bản bạn đã ký" }),
  ).toBeInTheDocument();
});

it("đã nhận: xem toàn văn biên bản đã ký ngay trong cổng", async () => {
  const userEvt = userEvent.setup();
  backend([committed], documentFixture({ turnId: CONTAINER_ID }));
  setup();

  await userEvt.click(await screen.findByRole("button", { name: "Xem toàn văn biên bản" }));

  const text = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
  expect(text).toHaveTextContent("Luật sư Dũng");
  expect(text).toHaveTextContent("Trần Minh Anh");
  expect(text).toHaveTextContent("Chủ kho Nguyễn Văn A");
  expect(text).not.toHaveTextContent("Người thực thi xác nhận");
});

it("đã từ chối: có văn bản từ chối đã ký, không có nút tải", async () => {
  backend([turn("DECLINED")], documentFixture({ turnId: CONTAINER_ID, kind: "DECLINE" }));
  setup();

  expect(await screen.findByRole("heading", { name: "Biên bản bạn đã ký" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Tải xuống/ })).not.toBeInTheDocument();
});

it("đã nhận nhưng biên bản chưa có (lượt cũ): cổng vẫn hiện nút tải như trước", async () => {
  backend([committed], "");
  setup();

  expect(await screen.findByRole("button", { name: "Tải xuống Sổ đỏ" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Biên bản bạn đã ký" })).not.toBeInTheDocument();
});

it("đang ở bước biên bản: khung tên Biên bản, chưa chọn thì hiện hai lựa chọn", async () => {
  backend([turn("IDENTITY_IN_PROGRESS")], "");
  setup();

  expect(await screen.findByRole("heading", { name: "Biên bản" })).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "Tôi chấp nhận" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tôi từ chối" })).toBeInTheDocument();
});
