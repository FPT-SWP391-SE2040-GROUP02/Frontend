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
import { TurnDetail } from "@/features/handover/ui/TurnDetail";
import { InvitationPanel } from "@/features/handover/ui/InvitationPanel";
import { deathCaseService } from "@/features/death-case/api/deathCaseService";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { ExecutorOverviewPage } from "@/pages/executor/ExecutorOverviewPage";

const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;
const user = {
  id: VAULT_ID,
  email: "fixture@example.test",
  fullName: "Fixture",
  phone: "0912345678",
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
  const post = vi.spyOn(apiClient, "post").mockImplementation(async (url) => {
    if (url === "/ekyc/consent")
      return {
        purpose: "OWNER_ENROLLMENT",
        noticeVersion: "2026-10-v1",
        consentedAt: CREATED_AT,
        expiresAt: CREATED_AT,
      };
    if (url === "/ekyc/document")
      return {
        verificationId: VAULT_ID,
        idNumber: "012345678901",
        fullName: "Fixture",
        dateOfBirth: "2000-01-01",
        residenceAddress: "fixture",
        canMatchFace: true,
        expiresAt: CREATED_AT,
        warnings: [],
      };
    if (url === "/ekyc/document-back" || url === "/ekyc/document/confirm")
      return {
        status: "PENDING",
        verificationId: VAULT_ID,
        citizenId: "8901",
        faceMatchScore: null,
        matchThreshold: 0.363,
        spoofCheckPassed: null,
        createdAt: null,
        completedAt: null,
        backSideChecked: true,
      };
    return {};
  });
  setup(<EkycUploads />);
  // Bước consent
  for (const box of screen.getAllByRole("checkbox")) fireEvent.click(box);
  fireEvent.click(screen.getByRole("button", { name: "Đồng ý và bắt đầu" }));
  expect(await screen.findByLabelText("Ảnh mặt trước giấy tờ")).toBeInTheDocument();
  // Bước front
  fireEvent.change(screen.getByLabelText("Ảnh mặt trước giấy tờ"), {
    target: { files: [new File(["fixture"], "id.png", { type: "image/png" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Đọc thông tin" }));
  expect(await screen.findByLabelText("Ảnh mặt sau giấy tờ")).toBeInTheDocument();
  // Mặt sau là tùy chọn: gửi trước để điền địa chỉ, rồi mới xác nhận OCR.
  fireEvent.change(screen.getByLabelText("Ảnh mặt sau giấy tờ"), {
    target: { files: [new File(["fixture"], "id-back.png", { type: "image/png" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Đọc mặt sau" }));
  await screen.findByText(/Đã nhận ảnh mặt sau/);
  // Chỉ mở camera sau khi xác nhận bản thông tin.
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục so khớp mặt" }));
  expect(
    await screen.findByRole("button", { name: "Bắt đầu thử thách camera" }),
  ).toBeInTheDocument();
  expect(post.mock.calls.map((c) => c[0])).toEqual([
    "/ekyc/consent",
    "/ekyc/document",
    "/ekyc/document-back",
    "/ekyc/document/confirm",
  ]);
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
it("does not call face-match before liveness is configured", async () => {
  const post = vi.spyOn(apiClient, "post").mockImplementation(async (url) => {
    if (typeof url === "string" && url.startsWith("/ekyc/face-match")) {
      throw new Error("face-match should not be called in new flow");
    }
    return {};
  });
  setup(<EkycUploads />);
  // consent bị pending vì post trả rỗng; đây chỉ là regression: face-match không bao giờ gọi.
  for (const box of screen.getAllByRole("checkbox")) fireEvent.click(box);
  fireEvent.click(screen.getByRole("button", { name: "Đồng ý và bắt đầu" }));
  await new Promise((r) => setTimeout(r, 10));
  expect(post.mock.calls.map((c) => c[0])).not.toContain("/ekyc/face-match");
});
it("opens the actual /receive?token email URL without auto-claim and keeps redirect local", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue({
    valid: true,
    responseExpired: false,
    accountExists: true,
  });
  const post = vi.spyOn(apiClient, "post");
  setup(<InvitationPanel />, "/receive?token=invitation-fixture", false);
  // Cửa vào: đăng nhập xong về thẳng cổng người nhận (không về lại trang cửa vào), không có nút nhận.
  const login = await screen.findByRole("link", { name: "Đăng nhập để mở thư mời" });
  expect(login).toHaveAttribute("href", "/login?redirect=%2Fclaim%2Fbeneficiary");
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
  identityConfirmedByExecutor: false,
  container: { name: "Gói thử" },
  items: [],
  grant: null,
};
it("ký biên bản bị Backend từ chối thì báo lỗi và không có quyền tải", async () => {
  const record = {
    id: "0198a000-0000-7000-8000-000000000003",
    vaultId: VAULT_ID,
    vaultName: "Kho thử",
    ownerName: "Chủ kho thử",
    status: "SIGNING",
    revisionNo: 1,
    requestedAt: CREATED_AT,
    finalizedAt: CREATED_AT,
    completedAt: null,
    verifierName: "Luật sư thử",
    executorName: "Người thực thi thử",
    verifierSignedAt: null,
    executorSignedAt: null,
    recipients: [
      {
        beneficiaryId: "0198a000-0000-7000-8000-000000000004",
        fullName: "Người nhận thử",
        citizenId: "001090000001",
        assets: [],
        turnId: CONTAINER_ID,
        turnStatus: "READY_TO_ACCEPT",
        claimed: true,
        submissionId: null,
        submissionStatus: "",
        identityConfirmedAt: CREATED_AT,
        signedAt: null,
      },
    ],
    canSign: true,
    availableAssets: [],
    availableRecipients: [],
    ownerSplit: [],
  };
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "get") {
      const url = config.url ?? "";
      const data = url.endsWith("/record") ? record : url.endsWith("/turns/me") ? [turn] : turn;
      return { config, data, status: 200, statusText: "OK", headers: new AxiosHeaders() };
    }
    throw new AxiosError("private", "ERR_BAD_REQUEST", config, undefined, {
      config,
      data: { code: "HANDOVER_NOT_ALLOWED", reason: "WRONG_STATE" },
      status: 409,
      statusText: "Conflict",
      headers: new AxiosHeaders(),
    });
  };
  const post = vi.spyOn(apiClient, "post");
  setup(<TurnDetail turnId={CONTAINER_ID} />);
  fireEvent.click(await screen.findByRole("button", { name: "Xem và ký biên bản" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ký biên bản" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("không còn ở bước phù hợp");
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(`/handover/turns/${CONTAINER_ID}/record/sign`);
  expect(screen.queryByRole("button", { name: /^Tải xuống/ })).not.toBeInTheDocument();
});
it("lets a system USER reach Executor data and leaves resource permissions to Backend", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue([]);
  setup(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/executor" element={<ExecutorOverviewPage />} />
      </Route>
    </Routes>,
    "/executor",
  );
  expect(await screen.findByText("Lời mời mới sẽ hiện ở trang Tổng quan.")).toBeInTheDocument();
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
it("đọc tiến độ bàn giao theo đường dẫn của biên bản bàn giao", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue({
    caseId: CONTAINER_ID,
    handoverStarted: false,
    serverTime: CREATED_AT,
    turns: [],
  });
  await deathCaseService.handoverProgress(CONTAINER_ID).catch(() => undefined);
  expect(get).toHaveBeenCalledWith(
    `/executor/handover-records/${CONTAINER_ID}/handover-progress`,
    expect.anything(),
  );
});
