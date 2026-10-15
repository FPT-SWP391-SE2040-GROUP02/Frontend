import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AxiosError, AxiosHeaders } from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { VerifierWorkspace } from "@/widgets/VerifierWorkspace/VerifierWorkspace";
import { verifierReviewService } from "@/features/verifier-review/api/verifierReviewService";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const FLAG_ID = "44444444-4444-4444-8444-444444444444";
const FILE_ID = "55555555-5555-4555-8555-555555555555";
const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;

const detailFixture = {
  id: CASE_ID,
  vaultId: VAULT_ID,
  status: "UNDER_REVIEW",
  etag: "v-1",
  createdAt: CREATED_AT,
  firstSubmittedAt: CREATED_AT,
  closedAt: null,
  reviewVersion: {
    versionNo: 1,
    ownerFullName: "Nguyễn Văn A",
    ownerCitizenId: "012345678901",
    ownerCitizenIdLast4: "8901",
    dateOfDeath: "2026-10-01",
    certificateNumber: "CT-001",
    issuedOn: "2026-10-02",
    issuedBy: "UBND Q1",
    submittedAt: CREATED_AT,
    files: [
      {
        id: FILE_ID,
        position: 1,
        fileName: "trang-1.pdf",
        contentType: "application/pdf",
        sizeBytes: 1024,
        uploadedAt: CREATED_AT,
      },
    ],
  },
  versions: [],
  flags: [
    {
      id: FLAG_ID,
      kind: "CHECKIN_AFTER_DEATH",
      detail: "Có lượt điểm danh sau ngày mất",
      createdAt: CREATED_AT,
      reviewedAt: null,
      reviewNote: null,
    },
  ],
  decisions: [],
  ownerNotice: { status: "DELIVERED", deliveredAt: CREATED_AT },
  objectionEndsAt: null,
  assignment: { assignedAt: CREATED_AT, dueAt: CREATED_AT },
  canApprove: false,
  approveBlockers: ["FLAGS_NOT_REVIEWED"],
  previousCase: null,
  handover: null,
};
const summaryFixture = {
  id: CASE_ID,
  status: "UNDER_REVIEW",
  reviewVersionNo: 1,
  ownerCitizenIdLast4: "8901",
  dateOfDeath: "2026-10-01",
  submittedAt: CREATED_AT,
  assignedAt: CREATED_AT,
  dueAt: CREATED_AT,
  objectionEndsAt: null,
  unreviewedFlagCount: 1,
  closedAt: null,
};
const listFixture = {
  items: [summaryFixture],
  totalCount: 1,
  pageIndex: 1,
  pageSize: 20,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("verifier-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

function setup(children: ReactNode, initialPath = "/notary/workspace") {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: VAULT_ID,
        email: "verifier@example.test",
        fullName: "Verifier",
        role: "VERIFIER",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: false,
        createdAt: CREATED_AT,
      },
    }),
  );
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/notary/workspace" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
  return store;
}

async function selectFirstCase(user: ReturnType<typeof userEvent.setup>) {
  const listItem = await screen.findByRole("button", { name: /Hồ sơ #33333333/ });
  await user.click(listItem);
  await screen.findByText("012345678901");
}

it("tải danh sách hồ sơ, chọn hồ sơ hiển thị chi tiết với CCCD đầy đủ", async () => {
  const user = userEvent.setup();
  const get = vi
    .spyOn(apiClient, "get")
    .mockImplementation(async (url) =>
      String(url).endsWith(`/verifier/death-cases/${CASE_ID}`) ? detailFixture : listFixture,
    );
  setup(<VerifierWorkspace />);
  await selectFirstCase(user);
  expect(get).toHaveBeenCalledWith(
    expect.stringContaining(`/verifier/death-cases/${CASE_ID}`),
    expect.anything(),
  );
});

it("chi tiết lỗi có thông báo và thử lại thay vì giả chưa chọn hồ sơ", async () => {
  const user = userEvent.setup();
  const get = vi.spyOn(apiClient, "get").mockRejectedValue(new Error("unavailable"));
  setup(<VerifierWorkspace />, `/notary/workspace?caseId=${CASE_ID}`);
  expect(await screen.findByText(/Không đọc được hồ sơ/)).toBeInTheDocument();
  get.mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  await user.click(screen.getAllByRole("button", { name: "Thử lại" })[1]);
  expect(await screen.findByText("012345678901")).toBeInTheDocument();
});

it("danh sách rỗng không tạo hồ sơ giả", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({ ...listFixture, items: [], totalCount: 0 });
  setup(<VerifierWorkspace />);
  expect(await screen.findByText(/Hiện không có hồ sơ/)).toBeInTheDocument();
});

it("đọc blocker xung đột quyền theo BE và từ chối response thiếu dữ liệu", async () => {
  const get = vi
    .spyOn(apiClient, "get")
    .mockResolvedValue({ ...detailFixture, approveBlockers: ["VERIFIER_CONFLICT"] });
  expect((await verifierReviewService.get(CASE_ID)).approveBlockers).toEqual(["VERIFIER_CONFLICT"]);
  get.mockResolvedValue({ id: CASE_ID });
  await expect(verifierReviewService.get(CASE_ID)).rejects.toThrow();
});

it("duyệt chỉ gửi sau hai xác nhận và dùng etag của hồ sơ đang xét", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? { ...detailFixture, canApprove: true, approveBlockers: [] }
      : listFixture,
  );
  const post = vi
    .spyOn(apiClient, "post")
    .mockResolvedValue({ ...detailFixture, status: "APPROVED_FOR_HANDOVER" });
  setup(<VerifierWorkspace />);
  await selectFirstCase(user);
  await user.click(screen.getByRole("button", { name: "Duyệt mở bàn giao" }));
  const submit = screen.getByRole("button", { name: /^Duyệt$/ });
  expect(submit).toBeDisabled();
  await user.type(screen.getByLabelText("Lý do duyệt"), "Đã đối soát đầy đủ");
  await user.click(screen.getByRole("checkbox", { name: /Tôi xác nhận các thông tin/ }));
  expect(submit).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: /Tôi đã kiểm tra phạm vi/ }));
  await user.click(submit);
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(`/verifier/death-cases/${CASE_ID}/approve`, {
      etag: "v-1",
      reason: "Đã đối soát đầy đủ",
    }),
  );
});

it("ghi chú cờ trống được báo inline và không gửi mutation", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  const post = vi.spyOn(apiClient, "post");
  setup(<VerifierWorkspace />);
  await selectFirstCase(user);
  await user.click(screen.getByRole("button", { name: "Xem xét" }));
  await user.click(screen.getByRole("checkbox", { name: /Tôi đã xem xét/ }));
  await user.click(screen.getByRole("button", { name: "Ghi nhận" }));
  expect(await screen.findByText("Cần nhập ghi chú xem xét cờ.")).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});

it("không ghi lại cache riêng tư khi mutation hoàn tất sau đổi phiên", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  let finish!: (value: typeof detailFixture) => void;
  const post = vi.spyOn(apiClient, "post").mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  setup(<VerifierWorkspace />);
  await selectFirstCase(user);
  await user.click(screen.getByRole("button", { name: "Xem xét" }));
  await user.type(screen.getByLabelText("Ghi chú xem xét"), "Đã kiểm tra");
  await user.click(screen.getByRole("checkbox", { name: /Tôi đã xem xét/ }));
  await user.click(screen.getByRole("button", { name: "Ghi nhận" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  accessTokenMemory.set("different-user-session");
  client.clear();
  await act(async () => {
    finish(detailFixture);
  });
  expect(client.getQueryData(["verifier-cases", "detail", CASE_ID])).toBeUndefined();
});

it("nút Duyệt bị disable khi canApprove=false, chỉ bật sau khi duyệt cờ và gọi lại server", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(`/verifier/death-cases/${CASE_ID}`) ? detailFixture : listFixture,
  );
  const post = vi.spyOn(apiClient, "post").mockImplementation(async (url) => {
    if (String(url).endsWith("/review")) {
      return {
        ...detailFixture,
        flags: [{ ...detailFixture.flags[0], reviewedAt: CREATED_AT, reviewNote: "Đã rà soát" }],
        canApprove: true,
        approveBlockers: [],
      };
    }
    return detailFixture;
  });
  setup(<VerifierWorkspace />);
  await selectFirstCase(user);
  const approve = await screen.findByRole("button", { name: /Duyệt mở bàn giao/ });
  expect(approve).toBeDisabled();
  await user.click(await screen.findByRole("button", { name: "Xem xét" }));
  await user.type(await screen.findByLabelText("Ghi chú xem xét"), "Đã rà soát kỹ");
  const confirmCheckbox = await screen.findByRole("checkbox", {
    name: /Tôi đã xem xét cờ này/,
  });
  await user.click(confirmCheckbox);
  await waitFor(() => expect(confirmCheckbox).toBeChecked());
  const submitBtn = await screen.findByRole("button", { name: "Ghi nhận" });
  await waitFor(() => expect(submitBtn).toBeEnabled());
  await user.click(submitBtn);
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
});

it("server 409 EDIT_CONFLICT không bị retry tự động, lỗi hiển thị cho người dùng", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(`/verifier/death-cases/${CASE_ID}`) ? detailFixture : listFixture,
  );
  const post = vi.spyOn(apiClient, "post").mockRejectedValue(
    new AxiosError("conflict", undefined, undefined, undefined, {
      status: 409,
      statusText: "Conflict",
      config: { headers: new AxiosHeaders() },
      headers: {},
      data: { code: "EDIT_CONFLICT" },
    }),
  );
  setup(<VerifierWorkspace />);
  await selectFirstCase(user);
  await user.click(await screen.findByRole("button", { name: /Yêu cầu bổ sung/ }));
  await user.type(await screen.findByLabelText("Lý do"), "Thiếu trang giấy tờ");
  await user.click(await screen.findByRole("checkbox", { name: "Trang giấy tờ" }));
  await user.click(await screen.findByRole("checkbox", { name: /Tôi xác nhận yêu cầu này/ }));
  await user.click(await screen.findByRole("button", { name: "Gửi yêu cầu" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole("alert")).toHaveTextContent(/xung đột|đã thay đổi/i);
});

it("modal từ chối yêu cầu lý do không rỗng và xác nhận theo contract", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(`/verifier/death-cases/${CASE_ID}`) ? detailFixture : listFixture,
  );
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(detailFixture);
  setup(<VerifierWorkspace />);
  await selectFirstCase(user);
  await user.click(await screen.findByRole("button", { name: /^Từ chối$/ }));
  const reasonInput = await screen.findByLabelText("Lý do từ chối");
  await user.type(reasonInput, "   ");
  await user.click(await screen.findByRole("checkbox", { name: /Tôi xác nhận từ chối/ }));
  const submitBtn = await screen.findByRole("button", { name: /^Từ chối$/ });
  expect(submitBtn).toBeDisabled();
  await user.clear(reasonInput);
  await user.type(reasonInput, "Không đủ căn cứ pháp lý để duyệt theo quy định.");
  await user.click(submitBtn);
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
});

it("không có blob được cache sau khi tải nội dung tệp", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(`/verifier/death-cases/${CASE_ID}`) ? detailFixture : listFixture,
  );
  const blob = new Blob(["demo"], { type: "application/pdf" });
  apiClient.defaults.adapter = async (config) => ({
    data: blob,
    config,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
  });
  const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fixture");
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  setup(<VerifierWorkspace />);
  await selectFirstCase(user);
  await user.click(await screen.findByRole("button", { name: "Tải nội dung" }));
  await waitFor(() => expect(create).toHaveBeenCalled());
  await new Promise((resolve) => setTimeout(resolve, 1100));
  expect(revoke).toHaveBeenCalled();
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((q) => ({ key: q.queryKey })),
    ),
  ).not.toContain(blob.toString());
});
