import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import authReducer from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { deathCaseService } from "@/features/death-case/api/deathCaseService";
import { ExecutorPortal } from "@/features/death-case/ui/ExecutorPortal";
import { HandoverProgressPanel } from "@/features/death-case/ui/HandoverProgressPanel";
import { remainingText } from "@/features/death-case/model/remainingText";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_CASE_ID = "44444444-4444-4444-8444-444444444444";
const TURN_ID = "55555555-5555-4555-8555-555555555555";
const ITEM_ID = "66666666-6666-4666-8666-666666666666";
const ITEM_2_ID = "77777777-7777-4777-8777-777777777777";
const SERVER_TIME = "2026-10-20T08:00:00+00:00";

const notStarted = {
  caseId: CASE_ID,
  handoverStarted: false,
  serverTime: SERVER_TIME,
  summary: {
    totalTurns: 0,
    waitingResponse: 0,
    inVerification: 0,
    accepted: 0,
    declined: 0,
    ended: 0,
  },
  turns: [],
};

const started = {
  caseId: CASE_ID,
  handoverStarted: true,
  serverTime: SERVER_TIME,
  summary: {
    totalTurns: 2,
    waitingResponse: 1,
    inVerification: 0,
    accepted: 1,
    declined: 0,
    ended: 0,
  },
  turns: [
    {
      turnId: TURN_ID,
      containerName: "Tài liệu gia đình",
      beneficiaryCitizenIdLast4: "8901",
      status: "INVITED",
      invitedAt: "2026-10-19T08:00:00+00:00",
      responseDeadline: "2026-10-22T10:00:00+00:00",
      claimedAt: null,
      decisionDeadline: null,
      decidedAt: null,
      grantStatus: null,
      grantExpiresAt: null,
      totalItems: 1,
      downloadedItems: 0,
      items: [
        {
          itemId: ITEM_ID,
          name: "Giấy tờ nhà",
          kind: "FILE",
          downloaded: false,
          firstDownloadedAt: null,
        },
      ],
    },
    {
      turnId: OTHER_CASE_ID,
      containerName: "Tài khoản ngân hàng",
      beneficiaryCitizenIdLast4: "1234",
      status: "HANDOVER_COMMITTED",
      invitedAt: "2026-10-19T08:00:00+00:00",
      responseDeadline: "2026-10-24T08:00:00+00:00",
      claimedAt: "2026-10-19T09:00:00+00:00",
      decisionDeadline: "2026-10-26T09:00:00+00:00",
      decidedAt: "2026-10-19T10:00:00+00:00",
      grantStatus: "ACTIVE",
      grantExpiresAt: "2026-11-18T10:00:00+00:00",
      totalItems: 1,
      downloadedItems: 1,
      items: [
        {
          itemId: ITEM_2_ID,
          name: "Mật khẩu ví",
          kind: "TEXT",
          downloaded: true,
          firstDownloadedAt: "2026-10-19T11:00:00+00:00",
        },
      ],
    },
  ],
};

function deathCase(status: string) {
  return {
    id: CASE_ID,
    vaultId: VAULT_ID,
    status,
    currentVersion: {
      versionNo: 1,
      isDraft: status === "DRAFT",
      ownerFullName: "Fixture",
      ownerCitizenIdLast4: "0001",
      dateOfDeath: "2026-10-10",
      certificateNumber: "fixture",
      issuedOn: "2026-10-11",
      issuedBy: "fixture",
      files: [],
      submittedAt: status === "DRAFT" ? null : CREATED_AT,
    },
    reviewVersionNo: status === "DRAFT" ? null : 1,
    missingRequirements: [],
    ownerNotice: status === "DRAFT" ? null : { status: "CANCELLED", deliveredAt: null },
    objectionEndsAt: null,
    createdAt: CREATED_AT,
    updatedAt: null,
    etag: "case-v1",
  };
}

function notFound(url: string) {
  return new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
    data: { code: "DEATH_CASE_NOT_FOUND" },
    status: 404,
    statusText: "Not Found",
    headers: new AxiosHeaders(),
    config: { url, headers: new AxiosHeaders() },
  });
}

let client: QueryClient;
const originalAdapter = apiClient.defaults.adapter;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("executor-progress-fixture");
});

afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

function setup(children: ReactNode, path = "/") {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

it("calls the real progress route with an abort signal and drops fields outside the contract", async () => {
  const leaked = {
    ...started,
    turns: [
      { ...started.turns[0], beneficiaryFullName: "Nguyen Van A", citizenId: "012345678901" },
    ],
  };
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(leaked);
  const controller = new AbortController();
  const result = await deathCaseService.handoverProgress(CASE_ID, controller.signal);
  expect(get).toHaveBeenCalledWith(`/executor/death-cases/${CASE_ID}/handover-progress`, {
    signal: controller.signal,
  });
  expect(JSON.stringify(result)).not.toContain("012345678901");
  expect(JSON.stringify(result)).not.toContain("Nguyen Van A");
});

it("rejects a non-UUID case id before sending any request", async () => {
  const get = vi.spyOn(apiClient, "get");
  await expect(deathCaseService.handoverProgress("not-a-uuid")).rejects.toThrow();
  expect(get).not.toHaveBeenCalled();
});

it("explains that handover has not started instead of showing an empty list", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(notStarted);
  setup(<HandoverProgressPanel caseId={CASE_ID} />);
  expect(await screen.findByText(/Bàn giao chưa bắt đầu/)).toBeInTheDocument();
  expect(screen.queryByText("Tổng số lượt")).not.toBeInTheDocument();
});

it("shows summary, per-turn deadlines counted from serverTime and download state", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(started);
  setup(<HandoverProgressPanel caseId={CASE_ID} />);
  expect(await screen.findByText("Tổng số lượt")).toBeInTheDocument();
  expect(
    screen.getByText(/Gói “Tài liệu gia đình” · người nhận CCCD \*\*\*8901/),
  ).toBeInTheDocument();
  expect(screen.getByText("Đã mời, chờ người nhận phản hồi")).toBeInTheDocument();
  expect(screen.getByText(/còn 2 ngày 2 giờ/)).toBeInTheDocument();
  expect(screen.getByText("Đã tải 0/1 tài sản")).toBeInTheDocument();
  expect(screen.getByText(/Giấy tờ nhà \(tệp\): chưa tải/)).toBeInTheDocument();
  expect(screen.getByText("Người nhận đã đồng ý nhận")).toBeInTheDocument();
  expect(screen.getByText(/đang trong thời hạn tải, hết hạn/)).toBeInTheDocument();
  expect(screen.getByText("Đã tải 1/1 tài sản")).toBeInTheDocument();
  expect(screen.getByText(/Mật khẩu ví \(văn bản\): đã tải lần đầu/)).toBeInTheDocument();
});

it("turns a 404 into a permission message with retry, never into an empty progress", async () => {
  const url = `/executor/death-cases/${CASE_ID}/handover-progress`;
  const get = vi.spyOn(apiClient, "get").mockRejectedValue(notFound(url));
  setup(<HandoverProgressPanel caseId={CASE_ID} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("không còn là Executor đang hiệu lực");
  expect(screen.queryByText(/Bàn giao chưa bắt đầu/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  expect(get).toHaveBeenCalledTimes(1);
});

it("reports a response that breaks the contract instead of rendering partial data", async () => {
  const broken = { ...started, summary: undefined };
  vi.spyOn(apiClient, "get").mockResolvedValue(broken);
  setup(<HandoverProgressPanel caseId={CASE_ID} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("không đúng định dạng");
});

it("keeps the newly selected case when the previous case answers late", async () => {
  let releaseOld: (value: unknown) => void = () => undefined;
  const otherProgress = { ...notStarted, caseId: OTHER_CASE_ID };
  vi.spyOn(apiClient, "get").mockImplementation((url) => {
    if (url === `/executor/death-cases/${CASE_ID}/handover-progress`) {
      return new Promise((resolve) => {
        releaseOld = resolve;
      });
    }
    return Promise.resolve(otherProgress);
  });
  const view = setup(<HandoverProgressPanel key={CASE_ID} caseId={CASE_ID} />);
  expect(screen.getByText("Đang tải tiến độ bàn giao…")).toBeInTheDocument();
  view.rerender(
    <Provider store={configureStore({ reducer: { auth: authReducer } })}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HandoverProgressPanel key={OTHER_CASE_ID} caseId={OTHER_CASE_ID} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  expect(await screen.findByText(/Bàn giao chưa bắt đầu/)).toBeInTheDocument();
  releaseOld(started);
  await Promise.resolve();
  expect(screen.queryByText("Tổng số lượt")).not.toBeInTheDocument();
});

it("loads progress inside the Executor portal for a submitted case but not for a draft", async () => {
  const get = vi.spyOn(apiClient, "get").mockImplementation((url) => {
    if (url === "/executor/vaults") return Promise.resolve([]);
    if (url === `/executor/death-cases/${CASE_ID}`)
      return Promise.resolve(deathCase("APPROVED_FOR_HANDOVER"));
    if (url === `/executor/death-cases/${CASE_ID}/handover-progress`)
      return Promise.resolve(started);
    return Promise.reject(new Error(`unexpected ${String(url)}`));
  });
  setup(<ExecutorPortal />, `/executor/claim?caseId=${CASE_ID}`);
  expect(await screen.findByRole("heading", { name: "Tiến độ bàn giao" })).toBeInTheDocument();
  expect(await screen.findByText("Tổng số lượt")).toBeInTheDocument();
  expect(get).toHaveBeenCalledWith(
    `/executor/death-cases/${CASE_ID}/handover-progress`,
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});

it("does not request progress for a draft case", async () => {
  const get = vi.spyOn(apiClient, "get").mockImplementation((url) => {
    if (url === "/executor/vaults") return Promise.resolve([]);
    if (url === `/executor/death-cases/${CASE_ID}`) return Promise.resolve(deathCase("DRAFT"));
    return Promise.reject(new Error(`unexpected ${String(url)}`));
  });
  setup(<ExecutorPortal />, `/executor/claim?caseId=${CASE_ID}`);
  expect(await screen.findByRole("button", { name: "Lưu bản nháp" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Tiến độ bàn giao" })).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalledWith(
    `/executor/death-cases/${CASE_ID}/handover-progress`,
    expect.anything(),
  );
});

it("counts remaining time from serverTime and marks past deadlines as overdue", () => {
  expect(remainingText("2026-10-20T07:00:00+00:00", SERVER_TIME)).toBe("đã quá hạn");
  expect(remainingText("2026-10-20T08:30:00+00:00", SERVER_TIME)).toBe("còn dưới 1 giờ");
  expect(remainingText("2026-10-20T13:00:00+00:00", SERVER_TIME)).toBe("còn 5 giờ");
  expect(remainingText("2026-10-23T08:00:00+00:00", SERVER_TIME)).toBe("còn 3 ngày");
});

function portalWith(record: unknown) {
  return vi.spyOn(apiClient, "get").mockImplementation((url) => {
    if (url === "/executor/vaults") return Promise.resolve([]);
    if (url === `/executor/death-cases/${CASE_ID}`) return Promise.resolve(record);
    if (url === `/executor/death-cases/${CASE_ID}/handover-progress`)
      return Promise.resolve(notStarted);
    return Promise.reject(new Error(`unexpected ${String(url)}`));
  });
}

it("shows the Verifier supplement request with readable parts and its deadline", async () => {
  portalWith({
    ...deathCase("SUPPLEMENT_REQUIRED"),
    supplementRequest: {
      versionNo: 1,
      reason: "Ảnh trang 2 bị mờ",
      requestedParts: ["FILES", "ISSUED_ON", "UNKNOWN_PART"],
      requestedAt: "2026-10-19T08:00:00+00:00",
      dueAt: "2026-10-26T08:00:00+00:00",
      overdue: true,
    },
    rejectReason: null,
  });
  setup(<ExecutorPortal />, `/executor/claim?caseId=${CASE_ID}`);
  expect(
    await screen.findByRole("heading", { name: "Verifier yêu cầu bổ sung (bản 1)" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Lý do: Ảnh trang 2 bị mờ")).toBeInTheDocument();
  expect(
    screen.getByText("Phần cần bổ sung: Trang giấy chứng tử, Ngày cấp, UNKNOWN_PART"),
  ).toBeInTheDocument();
  expect(screen.getByText(/\(đã quá hạn\)/)).toBeInTheDocument();
});

it("shows the reject reason of a rejected case and no supplement block", async () => {
  portalWith({
    ...deathCase("REJECTED"),
    supplementRequest: null,
    rejectReason: "Giấy chứng tử không khớp CCCD Chủ kho",
  });
  setup(<ExecutorPortal />, `/executor/claim?caseId=${CASE_ID}`);
  expect(await screen.findByRole("heading", { name: "Hồ sơ đã bị từ chối" })).toBeInTheDocument();
  expect(screen.getByText("Lý do: Giấy chứng tử không khớp CCCD Chủ kho")).toBeInTheDocument();
  expect(screen.queryByText(/Verifier yêu cầu bổ sung/)).not.toBeInTheDocument();
});

it("accepts an owner notice cancelled by a rejection instead of failing to read the case", async () => {
  const get = vi
    .spyOn(apiClient, "get")
    .mockResolvedValue({ ...deathCase("REJECTED"), rejectReason: "fixture" });
  const record = await deathCaseService.get(CASE_ID);
  expect(record.ownerNotice?.status).toBe("CANCELLED");
  expect(get).toHaveBeenCalledTimes(1);
});

const vaultRow = {
  vaultId: VAULT_ID,
  ownerFullName: "Fixture",
  role: "PRIMARY",
  planStatus: "ACTIVE",
  checkInOverdue: false,
  openDeathCaseId: null,
};

it("opens the last rejected case from the vault list and shows its reason", async () => {
  vi.spyOn(apiClient, "get").mockImplementation((url) => {
    if (url === "/executor/vaults")
      return Promise.resolve([{ ...vaultRow, lastRejectedDeathCaseId: CASE_ID }]);
    if (url === `/executor/death-cases/${CASE_ID}`)
      return Promise.resolve({ ...deathCase("REJECTED"), rejectReason: "Giấy không hợp lệ" });
    if (url === `/executor/death-cases/${CASE_ID}/handover-progress`)
      return Promise.resolve(notStarted);
    return Promise.reject(new Error(`unexpected ${String(url)}`));
  });
  setup(<ExecutorPortal />, "/executor/claim");
  expect(await screen.findByRole("button", { name: "Mở hồ sơ chứng tử" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Xem hồ sơ bị từ chối gần nhất" }));
  expect(await screen.findByRole("heading", { name: "Hồ sơ đã bị từ chối" })).toBeInTheDocument();
  expect(screen.getByText("Lý do: Giấy không hợp lệ")).toBeInTheDocument();
});

it("hides the rejected case button when the vault has none or the Backend predates the field", async () => {
  vi.spyOn(apiClient, "get").mockImplementation((url) => {
    if (url === "/executor/vaults")
      return Promise.resolve([
        vaultRow,
        { ...vaultRow, vaultId: OTHER_CASE_ID, lastRejectedDeathCaseId: null },
      ]);
    return Promise.reject(new Error(`unexpected ${String(url)}`));
  });
  setup(<ExecutorPortal />, "/executor/claim");
  expect(await screen.findAllByRole("button", { name: "Mở hồ sơ chứng tử" })).toHaveLength(2);
  expect(
    screen.queryByRole("button", { name: "Xem hồ sơ bị từ chối gần nhất" }),
  ).not.toBeInTheDocument();
});
