import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { HandoverProgressPanel } from "@/features/death-case/ui/HandoverProgressPanel";
import { ExecutorReceivedKeyCard } from "@/entities/executor";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const WAITING_TURN = "55555555-5555-4555-8555-555555555555";
const DONE_TURN = "77777777-7777-4777-8777-777777777777";
const KEYED_TURN = "88888888-8888-4888-8888-888888888888";

const turn = (
  turnId: string,
  status: string,
  containerName: string,
  keyVerifiedAt: string | null = null,
) => ({
  turnId,
  containerName,
  beneficiaryCitizenId: "8901",
  claimedByYou: false,
  identityConfirmedByExecutor: false,
  status,
  invitedAt: "2026-10-19T08:00:00+00:00",
  responseDeadline: "2026-10-22T10:00:00+00:00",
  keyVerifiedAt,
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
    totalTurns: 3,
    waitingResponse: 1,
    inVerification: 0,
    accepted: 2,
    declined: 0,
    ended: 0,
  },
  turns: [
    turn(WAITING_TURN, "INVITED", "Gói đang chờ"),
    turn(DONE_TURN, "HANDOVER_COMMITTED", "Gói đã nhận"),
    turn(KEYED_TURN, "HANDOVER_COMMITTED", "Gói đã nhập mã", "2026-10-20T07:00:00+00:00"),
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

const VAULT_ID = "22222222-2222-4222-8222-222222222222";
const NOT_STARTED_MESSAGE = "Mã nhận sẽ hiện sau khi luật sư chốt phương án chia.";
const notStartedProblem = () =>
  problem(409, {
    code: "HANDOVER_NOT_ALLOWED",
    reason: "HANDOVER_NOT_STARTED",
    message: "Mã nhận chỉ xem được sau khi hồ sơ được duyệt và bàn giao đã bắt đầu.",
  });

const KEY_PATH = `/executor/vaults/${VAULT_ID}/handover-key`;
const SHARD = "ABCD-EFGH-JKLM-NPQR";
const keyResponse = {
  vaultId: VAULT_ID,
  ownerFullName: "Anh Nam",
  version: 1,
  shard: SHARD,
  issuedAt: "2026-10-20T08:00:00+00:00",
  status: "ISSUED",
};

function renderPanel() {
  return render(
    <QueryClientProvider client={client}>
      <HandoverProgressPanel recordId={CASE_ID} vaultId={VAULT_ID} />
    </QueryClientProvider>,
  );
}

/** GET trả mã nhận ở đường dẫn mã, còn lại trả tiến độ; `keyError` thay mã bằng lỗi. */
function mockGets(keyError?: unknown) {
  return vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url === KEY_PATH) {
      if (keyError) throw keyError;
      return keyResponse;
    }
    return progress;
  });
}

it("chỉ hiện nút gửi mã ở lượt biên bản đã duyệt mà người nhận chưa nhập mã", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  renderPanel();
  await screen.findAllByText(/Gói đang chờ/);
  // Ba dòng nhưng chỉ lượt HANDOVER_COMMITTED chưa nhập mã được gửi mã.
  expect(screen.getAllByRole("button", { name: "Gửi mã qua email" })).toHaveLength(1);
  const waitingRow = screen.getByRole("listitem", { name: /Gói đang chờ/ });
  expect(
    within(waitingRow).queryByRole("button", { name: "Gửi mã qua email" }),
  ).not.toBeInTheDocument();
  const keyedRow = screen.getByRole("listitem", { name: /Gói đã nhập mã/ });
  expect(
    within(keyedRow).queryByRole("button", { name: "Gửi mã qua email" }),
  ).not.toBeInTheDocument();
  const doneRow = screen.getByRole("listitem", { name: /Gói đã nhận/ });
  expect(within(doneRow).getByRole("button", { name: "Gửi mã qua email" })).toBeInTheDocument();
});

it("bấm Gửi mã qua email là gửi luôn: không hiện ô mã, báo đã gửi", async () => {
  const user = userEvent.setup();
  mockGets();
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({
    turnId: DONE_TURN,
    sentAt: "2026-10-20T08:01:00+00:00",
  });
  renderPanel();
  await screen.findAllByText(/Gói đang chờ/);
  await user.click(screen.getByRole("button", { name: "Gửi mã qua email" }));
  await screen.findByText(/Đã gửi mã cho người nhận lúc/);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(
    `/executor/handover-records/${CASE_ID}/handover-turns/${DONE_TURN}/send-key`,
    { key: SHARD },
  );
  // Mã không bao giờ hiện ra màn hình.
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(document.body.textContent).not.toContain(SHARD);
});

it("mã bị Backend từ chối thì hiện lỗi và không báo thành công", async () => {
  const user = userEvent.setup();
  mockGets();
  vi.spyOn(apiClient, "post").mockRejectedValue(problem(403, { code: "HANDOVER_KEY_INVALID" }));
  renderPanel();
  await screen.findAllByText(/Gói đang chờ/);
  await user.click(screen.getByRole("button", { name: "Gửi mã qua email" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Mã nhận chưa đúng/);
  expect(screen.queryByText(/Đã gửi mã cho người nhận lúc/)).not.toBeInTheDocument();
});

it("409 HANDOVER_NOT_STARTED hiện câu chờ, không phải lỗi, và không gửi gì", async () => {
  const user = userEvent.setup();
  const get = mockGets(notStartedProblem());
  const post = vi.spyOn(apiClient, "post");
  renderPanel();
  await screen.findAllByText(/Gói đang chờ/);
  await user.click(screen.getByRole("button", { name: "Gửi mã qua email" }));

  expect(await screen.findByText(NOT_STARTED_MESSAGE)).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  expect(get).toHaveBeenCalledWith(KEY_PATH, expect.anything());
});

it("lỗi khác 409 HANDOVER_NOT_STARTED vẫn hiện như lỗi", async () => {
  const user = userEvent.setup();
  mockGets(problem(404, {}));
  renderPanel();
  await screen.findAllByText(/Gói đang chờ/);
  await user.click(screen.getByRole("button", { name: "Gửi mã qua email" }));

  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText(NOT_STARTED_MESSAGE)).not.toBeInTheDocument();
});

it("thẻ Mã nhận của Người thực thi: nhập đúng mật khẩu rồi 409 HANDOVER_NOT_STARTED hiện câu chờ", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockRejectedValue(notStartedProblem());
  const verifyPassword = vi.fn().mockResolvedValue(undefined);
  render(
    <QueryClientProvider client={client}>
      <ExecutorReceivedKeyCard
        vaultId={VAULT_ID}
        planStatus="HANDOVER_IN_PROGRESS"
        verifyPassword={verifyPassword}
      />
    </QueryClientProvider>,
  );
  expect(screen.queryByText(/phiếu/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Xem mã" }));
  await user.type(screen.getByLabelText("Nhập lại mật khẩu để xem mã"), "MatKhau123");
  await user.click(screen.getByRole("button", { name: "Xác nhận và xem mã" }));

  expect(await screen.findAllByText(NOT_STARTED_MESSAGE)).not.toHaveLength(0);
  expect(verifyPassword).toHaveBeenCalledWith("MatKhau123");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
