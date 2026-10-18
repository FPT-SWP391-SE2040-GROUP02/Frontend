import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
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
const GRANT_ID = "0198a000-0000-7000-8000-000000000001";
const ITEM_ID = "0198a000-0000-7000-8000-000000000002";
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
function committedTurn(grantStatus: string) {
  return {
    id: CONTAINER_ID,
    status: "HANDOVER_COMMITTED",
    serverTime: CREATED_AT,
    invitedAt: CREATED_AT,
    responseDeadline: "2026-12-01T00:00:00Z",
    decisionDeadline: "2026-12-02T00:00:00Z",
    identityBypassed: false,
    container: { name: "Gói thử" },
    items: [
      {
        id: ITEM_ID,
        name: "Giấy tờ thử",
        kind: "FILE",
        fileName: "giay-to.pdf",
        contentType: "application/pdf",
        sizeBytes: 12,
      },
    ],
    grant: { id: GRANT_ID, status: grantStatus, expiresAt: "2026-12-30T00:00:00Z" },
  };
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
/** Giả lập Backend: GET danh sách trả lượt; GET nội dung trả lỗi dạng Blob như responseType blob. */
function backendDownloadFails(status: number, body: object, grantStatus = "ACTIVE") {
  apiClient.defaults.adapter = async (config) => {
    if (config.url?.endsWith("/content")) {
      throw new AxiosError("private", "ERR_BAD_RESPONSE", config, undefined, {
        config,
        data: new Blob([JSON.stringify(body)], { type: "application/problem+json" }),
        status,
        statusText: "Error",
        headers: new AxiosHeaders(),
      });
    }
    return {
      config,
      data: [committedTurn(grantStatus)],
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    };
  };
}

it("shows a Vietnamese grant status and offers download only for an ACTIVE grant", async () => {
  backendDownloadFails(500, {}, "EXPIRED");
  setup();
  expect(await screen.findByText(/Đã hết hạn, không còn tải được/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Tải nội dung" })).not.toBeInTheDocument();
});

it("keeps the 500 CONTENT_INTEGRITY_FAILED code from a Blob body and never reports success", async () => {
  backendDownloadFails(500, { code: "CONTENT_INTEGRITY_FAILED" });
  const createUrl = vi.spyOn(URL, "createObjectURL");
  setup();
  fireEvent.click(await screen.findByRole("button", { name: "Tải nội dung" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("tính toàn vẹn");
  expect(createUrl).not.toHaveBeenCalled();
});

it("explains why GRANT_NOT_ACTIVE rejected the download using the BE reason", async () => {
  backendDownloadFails(403, { code: "GRANT_NOT_ACTIVE", reason: "BLOCKED" });
  const createUrl = vi.spyOn(URL, "createObjectURL");
  setup();
  fireEvent.click(await screen.findByRole("button", { name: "Tải nội dung" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("tạm giữ");
  expect(createUrl).not.toHaveBeenCalled();
});

it("saves the file only after the Backend returns the content and then releases the object URL", async () => {
  apiClient.defaults.adapter = async (config) => ({
    config,
    data: config.url?.endsWith("/content") ? new Blob(["noi dung"]) : [committedTurn("ACTIVE")],
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
  });
  const createUrl = vi.fn(() => "blob:fixture");
  const revokeUrl = vi.fn();
  Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  setup();
  fireEvent.click(await screen.findByRole("button", { name: "Tải nội dung" }));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(createUrl).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(revokeUrl).toHaveBeenCalledWith("blob:fixture"), { timeout: 3000 });
});

it("ignores a download that finishes after the session credential changed", async () => {
  let release: (blob: Blob) => void = () => undefined;
  apiClient.defaults.adapter = async (config) => {
    if (config.url?.endsWith("/content")) {
      const data = await new Promise<Blob>((resolve) => {
        release = resolve;
      });
      return { config, data, status: 200, statusText: "OK", headers: new AxiosHeaders() };
    }
    return {
      config,
      data: [committedTurn("ACTIVE")],
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    };
  };
  const createUrl = vi.spyOn(URL, "createObjectURL");
  setup();
  fireEvent.click(await screen.findByRole("button", { name: "Tải nội dung" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Tải nội dung" })).toBeDisabled());
  accessTokenMemory.set("another-user");
  release(new Blob(["noi dung"]));
  await waitFor(() => expect(screen.getByRole("button", { name: "Tải nội dung" })).toBeEnabled());
  expect(createUrl).not.toHaveBeenCalled();
});
