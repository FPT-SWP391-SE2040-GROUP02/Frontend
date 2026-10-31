import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { HandoverProgressPanel } from "@/features/death-case/ui/HandoverProgressPanel";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_TURN = "55555555-5555-4555-8555-555555555555";
const OWN_TURN = "66666666-6666-4666-8666-666666666666";
const INVITED_TURN = "77777777-7777-4777-8777-777777777777";
const SERVER_TIME = "2026-10-31T08:00:00+00:00";

const turn = (
  turnId: string,
  status: string,
  containerName: string,
  claimedByYou: boolean,
  identityConfirmedByExecutor = false,
) => ({
  turnId,
  containerName,
  beneficiaryCitizenIdLast4: "8901",
  claimedByYou,
  identityConfirmedByExecutor,
  status,
  invitedAt: "2026-10-30T08:00:00+00:00",
  responseDeadline: "2026-11-04T08:00:00+00:00",
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
    waitingResponse: 1,
    inVerification: 2,
    accepted: 0,
    declined: 0,
    ended: 0,
  },
  turns: [
    turn(OTHER_TURN, "IDENTITY_IN_PROGRESS", "Gói của người khác", false),
    turn(OWN_TURN, "IDENTITY_IN_PROGRESS", "Gói của chính tôi", true),
    turn(INVITED_TURN, "INVITED", "Gói chưa ai nhận", false),
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
  accessTokenMemory.set("confirm-identity-fixture");
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

it("chỉ hiện nút xác nhận ở lượt đang chờ xác minh và không phải lượt của chính mình", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  renderPanel();
  await screen.findAllByText(/Gói của người khác/);
  const details = screen.getAllByRole("button", { name: "Xem chi tiết" });
  // Lượt chọn sẵn là lượt của người khác đang chờ xác minh: có nút.
  expect(screen.getAllByRole("button", { name: "Xác nhận đúng người" })).toHaveLength(1);
  // Lượt do chính tài khoản nhận: không có nút, có giải thích.
  await user.click(details[1]);
  expect(screen.queryByRole("button", { name: "Xác nhận đúng người" })).not.toBeInTheDocument();
  expect(screen.getByText(/không tự xác nhận được/)).toBeInTheDocument();
  // Lượt chưa ai nhận: không có nút.
  await user.click(details[2]);
  expect(screen.queryByRole("button", { name: "Xác nhận đúng người" })).not.toBeInTheDocument();
});

it("hiện hộp xác nhận, chỉ gọi BE khi bấm Xác nhận, gọi một lần và đọc lại tiến độ", async () => {
  const user = userEvent.setup();
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({
    turnId: OTHER_TURN,
    status: "READY_TO_ACCEPT",
    identityConfirmedAt: "2026-10-31T08:01:00+00:00",
    decisionDeadline: "2026-11-07T08:01:00+00:00",
  });
  renderPanel();
  await screen.findAllByText(/Gói của người khác/);
  await user.click(screen.getByRole("button", { name: "Xác nhận đúng người" }));
  expect(screen.getByText("Tôi đã xác nhận đúng người")).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  await user.dblClick(screen.getByRole("button", { name: "Xác nhận" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith(
    `/executor/death-cases/${CASE_ID}/handover-turns/${OTHER_TURN}/confirm-identity`,
  );
  await waitFor(() => expect(get.mock.calls.length).toBeGreaterThanOrEqual(2));
});

it("bấm Hủy thì đóng hộp xác nhận và không gọi BE", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  const post = vi.spyOn(apiClient, "post");
  renderPanel();
  await screen.findAllByText(/Gói của người khác/);
  await user.click(screen.getByRole("button", { name: "Xác nhận đúng người" }));
  await user.click(screen.getByRole("button", { name: "Hủy" }));
  expect(screen.getByRole("button", { name: "Xác nhận đúng người" })).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});

it("hiện lý do cụ thể khi BE từ chối", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  vi.spyOn(apiClient, "post").mockRejectedValue(
    problem(409, { code: "HANDOVER_NOT_ALLOWED", reason: "HOLD_ACTIVE" }),
  );
  renderPanel();
  await screen.findAllByText(/Gói của người khác/);
  await user.click(screen.getByRole("button", { name: "Xác nhận đúng người" }));
  await user.click(screen.getByRole("button", { name: "Xác nhận" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/tạm giữ/);
});

it("báo lượt đã được Executor xác nhận bằng tay", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...progress,
    turns: [turn(OTHER_TURN, "READY_TO_ACCEPT", "Gói đã xác nhận", false, true)],
  });
  renderPanel();
  await screen.findAllByText(/Gói đã xác nhận/);
  expect(screen.getByText(/xác nhận bằng tay/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Xác nhận đúng người" })).not.toBeInTheDocument();
});
