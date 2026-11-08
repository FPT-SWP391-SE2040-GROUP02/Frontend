import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { HandoverProgressPanel } from "@/features/death-case/ui/HandoverProgressPanel";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const WAITING_TURN = "55555555-5555-4555-8555-555555555555";
const DONE_TURN = "77777777-7777-4777-8777-777777777777";

const turn = (turnId: string, status: string, containerName: string) => ({
  turnId,
  containerName,
  beneficiaryCitizenIdLast4: "8901",
  claimedByYou: false,
  identityConfirmedByExecutor: false,
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
  serverTime: "2026-10-20T08:00:00+00:00",
  summary: {
    totalTurns: 2,
    waitingResponse: 1,
    inVerification: 0,
    accepted: 1,
    declined: 0,
    ended: 0,
  },
  turns: [
    turn(WAITING_TURN, "INVITED", "Gói đang chờ"),
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
  accessTokenMemory.set("send-key-fixture");
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

it("chỉ hiện nút gửi khóa ở lượt chưa kết thúc", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  renderPanel();
  await screen.findAllByText(/Gói đang chờ/);
  expect(screen.getAllByRole("button", { name: "Gửi khóa cho người nhận" })).toHaveLength(1);
  await user.click(screen.getAllByRole("button", { name: "Xem chi tiết" })[1]);
  expect(screen.queryByRole("button", { name: "Gửi khóa cho người nhận" })).not.toBeInTheDocument();
});

it("nhập khóa rồi mới gọi BE, báo đã gửi và xóa ô nhập", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({
    turnId: WAITING_TURN,
    sentAt: "2026-10-20T08:01:00+00:00",
  });
  renderPanel();
  await screen.findAllByText(/Gói đang chờ/);
  await user.click(screen.getByRole("button", { name: "Gửi khóa cho người nhận" }));
  const send = screen.getByRole("button", { name: "Gửi khóa" });
  expect(send).toBeDisabled();
  await user.type(screen.getByLabelText("Khóa mở gói bạn đang giữ"), "ABCD-1234");
  await user.click(send);
  await screen.findByText(/Đã gửi khóa cho người nhận lúc/);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(
    `/executor/death-cases/${CASE_ID}/handover-turns/${WAITING_TURN}/send-key`,
    { key: "ABCD-1234" },
  );
  expect(screen.queryByLabelText("Khóa mở gói bạn đang giữ")).not.toBeInTheDocument();
});

it("khóa sai thì hiện lỗi và không báo thành công", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  vi.spyOn(apiClient, "post").mockRejectedValue(problem(403, { code: "HANDOVER_KEY_INVALID" }));
  renderPanel();
  await screen.findAllByText(/Gói đang chờ/);
  await user.click(screen.getByRole("button", { name: "Gửi khóa cho người nhận" }));
  await user.type(screen.getByLabelText("Khóa mở gói bạn đang giữ"), "SAI");
  await user.click(screen.getByRole("button", { name: "Gửi khóa" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Khóa mở gói chưa đúng/);
  expect(screen.queryByText(/Đã gửi khóa cho người nhận lúc/)).not.toBeInTheDocument();
});
