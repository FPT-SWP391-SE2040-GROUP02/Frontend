import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
import { deathCaseService } from "@/features/death-case/api/deathCaseService";
import { HandoverProgressPanel } from "@/features/death-case/ui/HandoverProgressPanel";

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
      beneficiaryCitizenId: "8901",
      claimedByYou: false,
      identityConfirmedByExecutor: false,
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
      beneficiaryCitizenId: "1234",
      beneficiaryFullName: "Nguyễn Văn An",
      beneficiaryPhone: "0901234567",
      claimedByYou: false,
      identityConfirmedByExecutor: false,
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
      {
        ...started.turns[0],
        beneficiaryEmail: "a@example.com",
        citizenId: "012345678901",
        dateOfBirth: "1990-01-01",
      },
    ],
  };
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(leaked);
  const controller = new AbortController();
  const result = await deathCaseService.handoverProgress(CASE_ID, controller.signal);
  expect(get).toHaveBeenCalledWith(`/executor/handover-records/${CASE_ID}/handover-progress`, {
    signal: controller.signal,
  });
  expect(JSON.stringify(result)).not.toContain("012345678901");
  expect(JSON.stringify(result)).not.toContain("1990-01-01");
  // Email người nhận nay nằm trong hợp đồng (beneficiaryEmail), giống số điện thoại.
  expect(result.turns[0].beneficiaryEmail).toBe("a@example.com");
});

it("rejects a non-UUID case id before sending any request", async () => {
  const get = vi.spyOn(apiClient, "get");
  await expect(deathCaseService.handoverProgress("not-a-uuid")).rejects.toThrow();
  expect(get).not.toHaveBeenCalled();
});

it("explains that handover has not started instead of showing an empty list", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(notStarted);
  setup(<HandoverProgressPanel recordId={CASE_ID} />);
  expect(await screen.findByText(/Bàn giao chưa bắt đầu/)).toBeInTheDocument();
  expect(screen.queryByRole("list", { name: "Danh sách người nhận" })).not.toBeInTheDocument();
});

it("shows four tiles and one row per turn, with detail only after pressing Chi tiết", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(started);
  setup(<HandoverProgressPanel recordId={CASE_ID} />);
  const list = await screen.findByRole("list", { name: "Danh sách người nhận" });
  // Chưa có họ tên thì hiện CCCD che; mỗi lượt đúng một dòng kèm tên gói.
  const rows = within(list).getAllByRole("listitem", { name: /, gói / });
  expect(rows).toHaveLength(2);
  expect(screen.getByText("Người nhận CCCD 8901")).toBeInTheDocument();
  expect(screen.getByText("Gói “Tài liệu gia đình”")).toBeInTheDocument();
  expect(screen.getByText("Nguyễn Văn An")).toBeInTheDocument();
  expect(screen.getByText("Gói “Tài khoản ngân hàng”")).toBeInTheDocument();
  expect(screen.getByText("trên 2 người nhận")).toBeInTheDocument();
  // Chi tiết chỉ mở khi bấm.
  expect(screen.queryByRole("region", { name: "Thông tin liên hệ" })).not.toBeInTheDocument();
  const second = within(list).getByRole("listitem", { name: /Nguyễn Văn An/ });
  fireEvent.click(within(second).getByRole("button", { name: "Chi tiết" }));
  const contact = within(second).getByRole("region", { name: "Thông tin liên hệ" });
  expect(contact).toHaveTextContent("0901234567");
  expect(within(second).getByRole("region", { name: "Tài sản" })).toHaveTextContent("1/1 đã tải");
  expect(within(second).getByText(/Mật khẩu ví · đã tải/)).toBeInTheDocument();
  expect(within(second).getByRole("button", { name: "Thu gọn" })).toBeInTheDocument();
});

it("keeps two packages of the same recipient as two separate rows", async () => {
  const BENEFICIARY_ID = "88888888-8888-4888-8888-888888888888";
  const [first, second] = started.turns;
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...started,
    turns: [
      { ...first, beneficiaryId: BENEFICIARY_ID, beneficiaryFullName: "Trần Thị Bình" },
      { ...second, beneficiaryId: BENEFICIARY_ID, beneficiaryFullName: "Trần Thị Bình" },
    ],
  });
  setup(<HandoverProgressPanel recordId={CASE_ID} />);
  const list = await screen.findByRole("list", { name: "Danh sách người nhận" });
  expect(within(list).getAllByText("Trần Thị Bình")).toHaveLength(2);
  expect(within(list).getByText("Gói “Tài liệu gia đình”")).toBeInTheDocument();
  expect(within(list).getByText("Gói “Tài khoản ngân hàng”")).toBeInTheDocument();
  expect(within(list).getAllByRole("button", { name: "Chi tiết" })).toHaveLength(2);
});

it("turns a 404 into a permission message with retry, never into an empty progress", async () => {
  const url = `/executor/handover-records/${CASE_ID}/handover-progress`;
  const get = vi.spyOn(apiClient, "get").mockRejectedValue(notFound(url));
  setup(<HandoverProgressPanel recordId={CASE_ID} />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "không còn là Người thực thi đang hiệu lực",
  );
  expect(screen.queryByText(/Bàn giao chưa bắt đầu/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  expect(get).toHaveBeenCalledTimes(1);
});

it("reports a response that breaks the contract instead of rendering partial data", async () => {
  const broken = { ...started, summary: undefined };
  vi.spyOn(apiClient, "get").mockResolvedValue(broken);
  setup(<HandoverProgressPanel recordId={CASE_ID} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("không đúng định dạng");
});

it("keeps the newly selected case when the previous case answers late", async () => {
  let releaseOld: (value: unknown) => void = () => undefined;
  const otherProgress = { ...notStarted, caseId: OTHER_CASE_ID };
  vi.spyOn(apiClient, "get").mockImplementation((url) => {
    if (url === `/executor/handover-records/${CASE_ID}/handover-progress`) {
      return new Promise((resolve) => {
        releaseOld = resolve;
      });
    }
    return Promise.resolve(otherProgress);
  });
  const view = setup(<HandoverProgressPanel key={CASE_ID} recordId={CASE_ID} />);
  expect(screen.getByText("Đang tải tiến độ bàn giao…")).toBeInTheDocument();
  view.rerender(
    <Provider store={configureStore({ reducer: { auth: authReducer } })}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HandoverProgressPanel key={OTHER_CASE_ID} recordId={OTHER_CASE_ID} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  expect(await screen.findByText(/Bàn giao chưa bắt đầu/)).toBeInTheDocument();
  releaseOld(started);
  await Promise.resolve();
  expect(screen.queryByRole("list", { name: "Danh sách người nhận" })).not.toBeInTheDocument();
});
