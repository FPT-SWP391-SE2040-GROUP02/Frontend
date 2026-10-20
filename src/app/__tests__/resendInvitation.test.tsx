import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { HandoverProgressPanel } from "@/features/death-case/ui/HandoverProgressPanel";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const WAITING_TURN = "55555555-5555-4555-8555-555555555555";
const EXPIRED_TURN = "66666666-6666-4666-8666-666666666666";
const DONE_TURN = "77777777-7777-4777-8777-777777777777";
const SERVER_TIME = "2026-10-20T08:00:00+00:00";

const turn = (turnId: string, status: string, containerName: string) => ({
  turnId,
  containerName,
  beneficiaryCitizenIdLast4: "8901",
  status,
  invitedAt: "2026-10-19T08:00:00+00:00",
  responseDeadline: "2026-10-22T10:00:00+00:00",
  claimedAt: null,
  decisionDeadline: null,
  decidedAt: null,
  grantStatus: null,
  grantExpiresAt: null,
  totalItems: 0,
  downloadedItems: 0,
  items: [],
});

const progress = {
  caseId: CASE_ID,
  handoverStarted: true,
  serverTime: SERVER_TIME,
  summary: {
    totalTurns: 3,
    waitingResponse: 2,
    inVerification: 0,
    accepted: 1,
    declined: 0,
    ended: 0,
  },
  turns: [
    turn(WAITING_TURN, "INVITED", "Gói đang chờ"),
    turn(EXPIRED_TURN, "INITIAL_RESPONSE_EXPIRED", "Gói quá hạn"),
    turn(DONE_TURN, "HANDOVER_COMMITTED", "Gói đã nhận"),
  ],
};

const problem = (status: number, data: unknown) => {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("x", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
};

let client: QueryClient;
const originalAdapter = apiClient.defaults.adapter;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("resend-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

function renderPanel() {
  return render(
    <QueryClientProvider client={client}>
      <HandoverProgressPanel caseId={CASE_ID} />
    </QueryClientProvider>,
  );
}

it("chỉ hiện nút gửi lại ở lượt chưa ai nhận", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  renderPanel();
  await screen.findByText(/Gói đã nhận/);
  expect(screen.getAllByRole("button", { name: "Gửi lại lời mời" })).toHaveLength(2);
});

it("cần xác nhận rồi mới gọi BE, gọi một lần và đọc lại tiến độ sau khi thành công", async () => {
  const user = userEvent.setup();
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({
    turnId: WAITING_TURN,
    invitationSentAt: "2026-10-20T08:01:00+00:00",
    responseDeadline: "2026-10-22T10:00:00+00:00",
  });
  renderPanel();
  await screen.findByText(/Gói đang chờ/);
  await user.click(screen.getAllByRole("button", { name: "Gửi lại lời mời" })[0]);
  expect(post).not.toHaveBeenCalled();
  await user.dblClick(screen.getByRole("button", { name: "Xác nhận gửi lại" }));
  await screen.findByText(/Đã gửi lại lời mời lúc/);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(
    `/executor/death-cases/${CASE_ID}/handover-turns/${WAITING_TURN}/resend-invitation`,
  );
  await waitFor(() => expect(get.mock.calls.length).toBeGreaterThanOrEqual(2));
});

it("hiện lý do cụ thể khi gửi lại quá sớm và không báo thành công", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  vi.spyOn(apiClient, "post").mockRejectedValue(
    problem(409, { code: "HANDOVER_NOT_ALLOWED", reason: "RESEND_TOO_SOON" }),
  );
  renderPanel();
  await screen.findByText(/Gói đang chờ/);
  await user.click(screen.getAllByRole("button", { name: "Gửi lại lời mời" })[0]);
  await user.click(screen.getByRole("button", { name: "Xác nhận gửi lại" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/15 phút/);
  expect(screen.queryByText(/Đã gửi lại lời mời lúc/)).not.toBeInTheDocument();
});

it("báo gửi thư lỗi (503) là chưa thay đổi gì thay vì lỗi máy chủ chung", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  vi.spyOn(apiClient, "post").mockRejectedValue(
    problem(503, { code: "HANDOVER_NOT_ALLOWED", reason: "INVITATION_SEND_FAILED" }),
  );
  renderPanel();
  await screen.findByText(/Gói đang chờ/);
  await user.click(screen.getAllByRole("button", { name: "Gửi lại lời mời" })[0]);
  await user.click(screen.getByRole("button", { name: "Xác nhận gửi lại" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Chưa gửi được thư mời/);
});
