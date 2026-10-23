import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { HandoverPortal } from "@/features/handover/ui/HandoverPortal";
import { InvitationPanel } from "@/features/handover/ui/InvitationPanel";
import { remainingText } from "@/features/handover/model/handover.format";
import { handoverService } from "@/features/handover/api/handoverService";

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
function turnWithStatus(status: string, extra: object = {}) {
  return { ...committedTurn("ACTIVE"), status, items: [], grant: null, ...extra };
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
function setup(children: ReactNode = <HandoverPortal />, path = "/") {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(setCredentials({ user }));
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  return store;
}
function ok(config: InternalAxiosRequestConfig, data: unknown): AxiosResponse {
  return { config, data, status: 200, statusText: "OK", headers: new AxiosHeaders() };
}
function problem(config: never, status: number, body: object) {
  return new AxiosError("private", "ERR_BAD_REQUEST", config, undefined, {
    config,
    data: body,
    status,
    statusText: "Error",
    headers: new AxiosHeaders(),
  });
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
    return ok(config, [committedTurn(grantStatus)]);
  };
}
/** Tải nội dung treo cho tới khi test gọi release, để đổi phiên/tài khoản giữa chừng. */
function backendDownloadHangs() {
  const control = { release: (_blob: Blob) => {} };
  apiClient.defaults.adapter = async (config) => {
    if (config.url?.endsWith("/content")) {
      const data = await new Promise<Blob>((resolve) => {
        control.release = resolve;
      });
      return ok(config, data);
    }
    return ok(config, [committedTurn("ACTIVE")]);
  };
  return control;
}

it("shows a Vietnamese grant status and offers download only for an ACTIVE grant", async () => {
  backendDownloadFails(500, {}, "EXPIRED");
  setup();
  expect(await screen.findByText(/Đã hết hạn, không còn tải được/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Tải xuống/ })).not.toBeInTheDocument();
});

it("keeps the 500 CONTENT_INTEGRITY_FAILED code from a Blob body and never reports success", async () => {
  backendDownloadFails(500, { code: "CONTENT_INTEGRITY_FAILED" });
  const createUrl = vi.spyOn(URL, "createObjectURL");
  setup();
  fireEvent.click(await screen.findByRole("button", { name: /^Tải xuống/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("tính toàn vẹn");
  expect(createUrl).not.toHaveBeenCalled();
});

it("explains why GRANT_NOT_ACTIVE rejected the download using the BE reason", async () => {
  backendDownloadFails(403, { code: "GRANT_NOT_ACTIVE", reason: "BLOCKED" });
  const createUrl = vi.spyOn(URL, "createObjectURL");
  setup();
  fireEvent.click(await screen.findByRole("button", { name: /^Tải xuống/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("đang được xác minh lại");
  expect(createUrl).not.toHaveBeenCalled();
});

it.each([
  ["HOLD_ACTIVE", "Kho đang bị tạm giữ"],
  ["CONTENT_DELETED", "chính sách lưu dữ liệu"],
])("explains a download denied with GRANT_NOT_ACTIVE reason %s", async (reason, text) => {
  backendDownloadFails(403, { code: "GRANT_NOT_ACTIVE", reason });
  const createUrl = vi.spyOn(URL, "createObjectURL");
  setup();
  fireEvent.click(await screen.findByRole("button", { name: /^Tải xuống/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(text);
  expect(createUrl).not.toHaveBeenCalled();
});

it("saves the file only after the Backend returns the content and then releases the object URL", async () => {
  apiClient.defaults.adapter = async (config) =>
    ok(
      config,
      config.url?.endsWith("/content") ? new Blob(["noi dung"]) : [committedTurn("ACTIVE")],
    );
  const createUrl = vi.fn(() => "blob:fixture");
  const revokeUrl = vi.fn();
  Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  setup();
  fireEvent.click(await screen.findByRole("button", { name: /^Tải xuống/ }));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(createUrl).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(revokeUrl).toHaveBeenCalledWith("blob:fixture"), { timeout: 3000 });
});

it("ignores a download that finishes after the account changed", async () => {
  const control = backendDownloadHangs();
  const createUrl = vi.spyOn(URL, "createObjectURL");
  const store = setup();
  fireEvent.click(await screen.findByRole("button", { name: /^Tải xuống/ }));
  await waitFor(() => expect(screen.getByRole("button", { name: /^Tải xuống/ })).toBeDisabled());
  store.dispatch(setCredentials({ user: { ...user, id: CONTAINER_ID } }));
  control.release(new Blob(["noi dung"]));
  await waitFor(() => expect(screen.getByRole("button", { name: /^Tải xuống/ })).toBeEnabled());
  expect(createUrl).not.toHaveBeenCalled();
});

it("still saves the file when only the access token was refreshed for the same user", async () => {
  const control = backendDownloadHangs();
  Object.assign(URL, { createObjectURL: vi.fn(() => "blob:fixture"), revokeObjectURL: vi.fn() });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  setup();
  fireEvent.click(await screen.findByRole("button", { name: /^Tải xuống/ }));
  await waitFor(() => expect(screen.getByRole("button", { name: /^Tải xuống/ })).toBeDisabled());
  accessTokenMemory.set("refreshed-token");
  control.release(new Blob(["noi dung"]));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
});

it("shows a network failure of the download instead of staying silent", async () => {
  apiClient.defaults.adapter = async (config) => {
    if (config.url?.endsWith("/content")) {
      throw new AxiosError("Network Error", "ERR_NETWORK", config);
    }
    return ok(config, [committedTurn("ACTIVE")]);
  };
  setup();
  fireEvent.click(await screen.findByRole("button", { name: /^Tải xuống/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Không kết nối được máy chủ");
});

it("shows the Backend reason when claiming an invitation is rejected", async () => {
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "get") return ok(config, { valid: true, responseExpired: false });
    throw problem(config as never, 409, {
      code: "HANDOVER_NOT_ALLOWED",
      reason: "OWNER_CANNOT_CLAIM",
    });
  };
  setup(<InvitationPanel />, "/receive?token=invitation-fixture");
  fireEvent.click(await screen.findByRole("button", { name: "Nhận lời mời" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Chủ kho không thể tự nhận");
  expect(screen.queryByRole("link", { name: "Xem lượt bàn giao của tôi" })).not.toBeInTheDocument();
});

it("declines only after an explicit confirmation and then shows the server state", async () => {
  let declined = false;
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "post") {
      declined = true;
      return ok(config, turnWithStatus("DECLINED"));
    }
    return ok(config, [turnWithStatus(declined ? "DECLINED" : "READY_TO_ACCEPT")]);
  };
  const post = vi.spyOn(apiClient, "post");
  setup();
  const decline = await screen.findByRole("button", { name: "Từ chối" });
  fireEvent.click(decline);
  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("Từ chối nhận?");
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Giữ lại" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Từ chối" }));
  fireEvent.click(
    within(await screen.findByRole("dialog")).getByRole("button", { name: "Từ chối nhận" }),
  );
  expect(await screen.findByText("Bạn đã từ chối lượt bàn giao này.")).toBeInTheDocument();
  expect(post).toHaveBeenCalledWith(`/handover/turns/${CONTAINER_ID}/decline`);
  expect(screen.queryByRole("button", { name: "Đồng ý nhận" })).not.toBeInTheDocument();
});

it("explains a rejected decision with the Backend reason and keeps the turn undecided", async () => {
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "post") {
      throw problem(config as never, 409, { code: "HANDOVER_NOT_ALLOWED", reason: "WRONG_STATE" });
    }
    return ok(config, [turnWithStatus("READY_TO_ACCEPT")]);
  };
  setup();
  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Đồng ý nhận" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("không cho phép thao tác này");
  expect(screen.queryByText(/Quyền xem/)).not.toBeInTheDocument();
});

it("describes terminal states and counts down from the server time, not the local clock", async () => {
  apiClient.defaults.adapter = async (config) =>
    ok(config, [
      turnWithStatus("READY_TO_ACCEPT", {
        serverTime: "2026-10-18T00:00:00Z",
        decisionDeadline: "2026-10-20T03:00:00Z",
      }),
      turnWithStatus("DECISION_EXPIRED"),
    ]);
  setup();
  expect(await screen.findByText("Còn 2 ngày 3 giờ để quyết định")).toBeInTheDocument();
  expect(screen.getByText(/Hạn quyết định đã kết thúc nên lượt này/)).toBeInTheDocument();
});

it("formats the remaining time from server time", () => {
  expect(remainingText("2026-10-20T03:00:00Z", "2026-10-18T00:00:00Z")).toBe("Còn 2 ngày 3 giờ");
  expect(remainingText("2026-10-18T02:30:00Z", "2026-10-18T00:00:00Z")).toBe("Còn 2 giờ 30 phút");
  expect(remainingText("2026-10-18T00:20:00Z", "2026-10-18T00:00:00Z")).toBe("Còn 20 phút");
  expect(remainingText("2026-10-17T00:00:00Z", "2026-10-18T00:00:00Z")).toBe("Đã quá hạn");
});

it("tells the recipient the invitation was already claimed by another account", async () => {
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "get") return ok(config, { valid: true, responseExpired: false });
    throw problem(config as never, 409, { code: "HANDOVER_ALREADY_CLAIMED" });
  };
  setup(<InvitationPanel />, "/receive?token=invitation-fixture");
  fireEvent.click(await screen.findByRole("button", { name: "Nhận lời mời" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Lời mời đã được nhận");
  expect(screen.queryByRole("link", { name: "Xem lượt bàn giao của tôi" })).not.toBeInTheDocument();
});

it("does not leak or invent turns when the Backend hides a turn that is not the user's", async () => {
  apiClient.defaults.adapter = async (config) => {
    throw problem(config as never, 404, { code: "HANDOVER_NOT_FOUND" });
  };
  setup();
  expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được các lượt của bạn");
  expect(screen.queryByRole("button", { name: "Đồng ý nhận" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Tải xuống/ })).not.toBeInTheDocument();
  await expect(handoverService.get(CONTAINER_ID)).rejects.toMatchObject({
    response: { status: 404 },
  });
});

it.each([
  ["BLOCKED", "Đang tạm dừng trong lúc hồ sơ được xác minh lại, chưa thể tải"],
  ["REVOKED", "Đã bị thu hồi, không còn tải được"],
])("shows a %s grant without any download button", async (grantStatus, label) => {
  apiClient.defaults.adapter = async (config) => ok(config, [committedTurn(grantStatus)]);
  setup();
  expect(await screen.findByText(new RegExp(label))).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Tải xuống/ })).not.toBeInTheDocument();
});

it("explains a cancelled turn as a stopped handover, not a system error", async () => {
  apiClient.defaults.adapter = async (config) => ok(config, [turnWithStatus("CANCELLED")]);
  setup();
  expect(await screen.findByText(/chủ kho đã được xác nhận còn sống/)).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("explains a claim blocked by an active hold", async () => {
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "get") return ok(config, { valid: true, responseExpired: false });
    throw problem(config as never, 409, { code: "HANDOVER_NOT_ALLOWED", reason: "HOLD_ACTIVE" });
  };
  setup(<InvitationPanel />, "/receive?token=invitation-fixture");
  fireEvent.click(await screen.findByRole("button", { name: "Nhận lời mời" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Các hạn đang được giữ nguyên");
  expect(screen.queryByRole("link", { name: "Xem lượt bàn giao của tôi" })).not.toBeInTheDocument();
});

it("explains a decision blocked by an active hold and keeps the turn undecided", async () => {
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "post") {
      throw problem(config as never, 409, { code: "HANDOVER_NOT_ALLOWED", reason: "HOLD_ACTIVE" });
    }
    return ok(config, [turnWithStatus("READY_TO_ACCEPT")]);
  };
  setup();
  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Đồng ý nhận" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Kho đang bị tạm giữ");
  expect(screen.getByRole("button", { name: "Đồng ý nhận" })).toBeInTheDocument();
});

it("still lets the recipient claim after the initial response deadline (BR-58)", async () => {
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "get") return ok(config, { valid: true, responseExpired: true });
    return ok(config, turnWithStatus("IDENTITY_IN_PROGRESS"));
  };
  const post = vi.spyOn(apiClient, "post");
  setup(<InvitationPanel />, "/receive?token=invitation-fixture");
  expect(await screen.findByText(/Đã qua hạn phản hồi ban đầu/)).toBeInTheDocument();
  const claim = screen.getByRole("button", { name: "Nhận lời mời" });
  expect(claim).toBeEnabled();
  fireEvent.click(claim);
  expect(
    await screen.findByRole("link", { name: "Xem lượt bàn giao của tôi" }),
  ).toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(1);
});
