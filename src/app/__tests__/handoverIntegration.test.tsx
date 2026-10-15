import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { EkycUploads } from "@/features/ekyc/ui/EkycUploads";
import { HandoverPortal } from "@/features/handover/ui/HandoverPortal";
import { InvitationPanel } from "@/features/handover/ui/InvitationPanel";
import { deathCaseService } from "@/features/death-case/api/deathCaseService";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { ExecutorPortal } from "@/features/death-case/ui/ExecutorPortal";

const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;
const user = {
  id: VAULT_ID,
  email: "fixture@example.test",
  fullName: "Fixture",
  role: "USER" as const,
  status: "ACTIVE" as const,
  emailVerified: true,
  hasPassword: false,
  createdAt: CREATED_AT,
};
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("workflow-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});
function setup(children: ReactNode, path = "/", authenticated = true) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (authenticated) store.dispatch(setCredentials({ user }));
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  return store;
}
it("does not submit selfie before the OCR confirmation and keeps OCR out of the cache", async () => {
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({
    verificationId: VAULT_ID,
    idNumber: "012345678901",
    fullName: "Fixture",
    dateOfBirth: "2000-01-01",
    residenceAddress: "fixture",
    canMatchFace: true,
    expiresAt: CREATED_AT,
    warnings: [],
  });
  setup(<EkycUploads />);
  fireEvent.change(screen.getByLabelText("Ảnh mặt trước giấy tờ"), {
    target: { files: [new File(["fixture"], "id.png", { type: "image/png" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Gửi ảnh giấy tờ" }));
  expect(await screen.findByRole("button", { name: "Gửi ảnh selfie để so khớp" })).toBeDisabled();
  expect(post).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("012345678901")).not.toBeInTheDocument();
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.state.data),
    ),
  ).not.toContain("012345678901");
  expect(client.getMutationCache().getAll()).toHaveLength(0);
});
it("opens the actual /receive?token email URL without auto-claim and keeps redirect local", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue({ valid: true, responseExpired: false });
  const post = vi.spyOn(apiClient, "post");
  setup(<InvitationPanel />, "/receive?token=invitation-fixture", false);
  const login = await screen.findByRole("link", { name: "Đăng nhập để tiếp tục" });
  expect(login).toHaveAttribute("href", "/login?redirect=%2Freceive%3Ftoken%3Dinvitation-fixture");
  expect(get).toHaveBeenCalledWith(
    "/handover/invitations/invitation-fixture",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(post).not.toHaveBeenCalled();
});
const turn = {
  id: CONTAINER_ID,
  status: "READY_TO_ACCEPT",
  serverTime: CREATED_AT,
  invitedAt: CREATED_AT,
  responseDeadline: "2026-12-01T00:00:00Z",
  decisionDeadline: "2026-12-02T00:00:00Z",
  identityBypassed: false,
  container: { name: "Gói thử" },
  items: [],
  grant: null,
};
it("requires an explicit receiving decision and preserves absence of grant after server rejection", async () => {
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "get")
      return { config, data: [turn], status: 200, statusText: "OK", headers: new AxiosHeaders() };
    throw new AxiosError("private", "ERR_BAD_REQUEST", config, undefined, {
      config,
      data: { code: "HANDOVER_DECISION_EXPIRED" },
      status: 409,
      statusText: "Conflict",
      headers: new AxiosHeaders(),
    });
  };
  const post = vi.spyOn(apiClient, "post");
  setup(<HandoverPortal />);
  const accept = await screen.findByRole("button", { name: "Đồng ý tiếp nhận" });
  expect(accept).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(accept);
  expect(await screen.findByRole("alert")).toHaveTextContent("Thời hạn quyết định đã kết thúc");
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(`/handover/turns/${CONTAINER_ID}/accept`);
  expect(screen.queryByRole("button", { name: "Tải nội dung" })).not.toBeInTheDocument();
});
it("lets a system USER reach Executor data and leaves resource permissions to Backend", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue([]);
  setup(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/executor/claim" element={<ExecutorPortal />} />
      </Route>
    </Routes>,
    "/executor/claim",
  );
  expect(
    await screen.findByText("Tài khoản chưa có nhiệm vụ Executor đang hiệu lực."),
  ).toBeInTheDocument();
  expect(get).toHaveBeenCalledWith(
    "/executor/vaults",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});
it("drops local private form state when the logged-in account changes on the same route", async () => {
  function PrivateForm() {
    return <input aria-label="Private form" defaultValue="" />;
  }
  const store = setup(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<PrivateForm />} />
      </Route>
    </Routes>,
  );
  fireEvent.change(screen.getByLabelText("Private form"), {
    target: { value: "old-account-secret" },
  });
  const { act } = await import("@testing-library/react");
  act(() => {
    store.dispatch(setCredentials({ user: { ...user, id: CONTAINER_ID } }));
  });
  expect(screen.getByLabelText("Private form")).toHaveValue("");
});
it("uses the real death-case routes and parses away any full ID accidentally added to a response", async () => {
  const fixture = {
    id: CONTAINER_ID,
    vaultId: VAULT_ID,
    status: "DRAFT",
    currentVersion: {
      versionNo: 1,
      isDraft: true,
      ownerFullName: null,
      ownerCitizenIdLast4: null,
      ownerCitizenId: "012345678901",
      dateOfDeath: null,
      certificateNumber: null,
      issuedOn: null,
      issuedBy: null,
      files: [],
      submittedAt: null,
    },
    reviewVersionNo: null,
    missingRequirements: ["FILES"],
    ownerNotice: null,
    objectionEndsAt: null,
    createdAt: CREATED_AT,
    updatedAt: null,
    etag: "case-v1",
  };
  const put = vi.spyOn(apiClient, "put").mockResolvedValue(fixture);
  const result = await deathCaseService.update(CONTAINER_ID, {
    etag: "case-v1",
    ownerFullName: "Fixture",
    ownerCitizenId: "012345678901",
    certificateNumber: "fixture",
    issuedBy: "fixture",
  });
  expect(put).toHaveBeenCalledWith(
    `/executor/death-cases/${CONTAINER_ID}/draft`,
    expect.objectContaining({ etag: "case-v1" }),
  );
  expect(JSON.stringify(result)).not.toContain("012345678901");
});
