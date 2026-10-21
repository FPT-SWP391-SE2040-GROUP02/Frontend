import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { AxiosError, AxiosHeaders } from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { verifierReviewService } from "@/features/verifier-review/api/verifierReviewService";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const FLAG_ID = "44444444-4444-4444-8444-444444444444";
const FILE_ID = "55555555-5555-4555-8555-555555555555";
const CASE_B_ID = "66666666-6666-4666-8666-666666666666";
// Đầu id khác cuối: bắt lỗi dùng 8 ký tự đầu thay vì mã hồ sơ của BE (8 ký tự cuối, in hoa).
const MIXED_CASE_ID = "0199e7a4-3c1b-7f2d-9a41-5e6b8c0d1a2f";
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

function LocationProbe() {
  return <span data-testid="search">{useLocation().search}</span>;
}

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

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
            <Route
              path="/notary/workspace"
              element={
                <>
                  {children}
                  <LocationProbe />
                </>
              }
            />
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
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  expect(get).toHaveBeenCalledWith(
    expect.stringContaining(`/verifier/death-cases/${CASE_ID}`),
    expect.anything(),
  );
});

it("Tải lại cập nhật quyền duyệt của hồ sơ đang chọn kể cả khi cache còn fresh", async () => {
  const user = userEvent.setup();
  client.setDefaultOptions({ queries: { retry: false, staleTime: 300_000 } });
  let eligible = false;
  const get = vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? {
          ...detailFixture,
          canApprove: eligible,
          approveBlockers: eligible ? [] : ["OBJECTION_PERIOD_NOT_OVER"],
        }
      : listFixture,
  );
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  expect(screen.getByRole("button", { name: "Duyệt mở bàn giao" })).toBeDisabled();
  get.mockClear();
  eligible = true;
  await user.click(screen.getByRole("button", { name: "Tải lại" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Duyệt mở bàn giao" })).toBeEnabled(),
  );
  expect(get).toHaveBeenCalledWith(`/verifier/death-cases/${CASE_ID}`, expect.anything());
});

it("Tải lại thất bại ở chi tiết hiện lỗi và cho phép phục hồi", async () => {
  const user = userEvent.setup();
  let failDetail = false;
  vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
    if (!String(url).endsWith(CASE_ID)) return listFixture;
    if (failDetail) throw new Error("unavailable");
    return detailFixture;
  });
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  failDetail = true;
  await user.click(screen.getByRole("button", { name: "Tải lại" }));
  expect(await screen.findByText(/Không đọc được hồ sơ/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Duyệt mở bàn giao" })).not.toBeInTheDocument();
  failDetail = false;
  await user.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByText("012345678901")).toBeInTheDocument();
});

it("chi tiết lỗi có thông báo và thử lại thay vì giả chưa chọn hồ sơ", async () => {
  const user = userEvent.setup();
  const get = vi.spyOn(apiClient, "get").mockRejectedValue(new Error("unavailable"));
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  expect(await screen.findByText(/Không đọc được hồ sơ/)).toBeInTheDocument();
  get.mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  await user.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByText("012345678901")).toBeInTheDocument();
});

it("danh sách rỗng không tạo hồ sơ giả", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({ ...listFixture, items: [], totalCount: 0 });
  setup(<VerifierQueue />);
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
  setup(<VerifierQueue />);
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
  setup(<VerifierQueue />);
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
  setup(<VerifierQueue />);
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
  setup(<VerifierQueue />);
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
  setup(<VerifierQueue />);
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
  setup(<VerifierQueue />);
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
  setup(<VerifierQueue />);
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

it("modal duyệt hiện nhãn tiếng Việt của blocker, không hiện mã thô", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=approve`);
  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("Còn cờ chưa được xem xét.");
  expect(dialog).not.toHaveTextContent("FLAGS_NOT_REVIEWED");
});

it("kết quả mở bàn giao vẫn hiện sau khi duyệt, không bị GET chi tiết ghi đè", async () => {
  const user = userEvent.setup();
  let detailReads = 0;
  vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
    if (!String(url).endsWith(CASE_ID)) return listFixture;
    detailReads += 1;
    return { ...detailFixture, canApprove: true, approveBlockers: [] };
  });
  vi.spyOn(apiClient, "post").mockResolvedValue({
    ...detailFixture,
    status: "APPROVED_FOR_HANDOVER",
    etag: "v-2",
    closedAt: CREATED_AT,
    canApprove: false,
    approveBlockers: ["NOT_UNDER_REVIEW"],
    handover: { turnCount: 2, invitationsSent: 2, invitationsFailed: 0 },
  });
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  await user.click(screen.getByRole("button", { name: "Duyệt mở bàn giao" }));
  await user.type(screen.getByLabelText("Lý do duyệt"), "Đủ căn cứ");
  await user.click(screen.getByRole("checkbox", { name: /Tôi xác nhận các thông tin/ }));
  await user.click(screen.getByRole("checkbox", { name: /Tôi đã kiểm tra phạm vi/ }));
  await user.click(screen.getByRole("button", { name: /^Duyệt$/ }));
  expect(await screen.findByText(/Đã mở 2 lượt bàn giao/)).toBeInTheDocument();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.getByText(/Đã mở 2 lượt bàn giao/)).toBeInTheDocument();
  expect(detailReads).toBe(1);
  expect(screen.queryByRole("button", { name: /^Từ chối$/ })).not.toBeInTheDocument();
});

it("hồ sơ chờ bổ sung chỉ còn nút từ chối, không xem xét cờ hay duyệt", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? { ...detailFixture, status: "SUPPLEMENT_REQUIRED", approveBlockers: ["NOT_UNDER_REVIEW"] }
      : listFixture,
  );
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(detailFixture);
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  expect(screen.queryByRole("button", { name: "Xem xét" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Yêu cầu bổ sung/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Duyệt mở bàn giao" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /^Từ chối$/ }));
  await user.type(screen.getByLabelText("Lý do từ chối"), "Executor không bổ sung đúng hạn");
  await user.click(screen.getByRole("checkbox", { name: /Tôi xác nhận từ chối/ }));
  await user.click(screen.getByRole("button", { name: /^Từ chối$/ }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(`/verifier/death-cases/${CASE_ID}/reject`, {
      etag: "v-1",
      reason: "Executor không bổ sung đúng hạn",
    }),
  );
});

it("VERIFIER_CONFLICT chỉ cho xem: ẩn mọi thao tác ghi, kể cả modal mở qua URL", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? { ...detailFixture, approveBlockers: ["FLAGS_NOT_REVIEWED", "VERIFIER_CONFLICT"] }
      : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=reject`);
  expect(await screen.findByText(/chỉ được xem, không được ra quyết định/)).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Xem xét" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Yêu cầu bổ sung/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Duyệt mở bàn giao" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Từ chối$/ })).not.toBeInTheDocument();
});

it("hiện mốc thời gian phản đối, báo Owner và hồ sơ trước bị từ chối", async () => {
  const objectionEndsAt = "2026-10-05T03:00:00+00:00";
  const deliveredAt = "2026-10-02T08:30:00+00:00";
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? {
          ...detailFixture,
          objectionEndsAt,
          ownerNotice: { status: "DELIVERED", deliveredAt },
          previousCase: {
            id: "77777777-7777-4777-8777-777777777777",
            closedAt: CREATED_AT,
            rejectReason: "Giấy chứng tử không rõ nét",
          },
        }
      : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  const timeline = await screen.findByRole("region", { name: "Mốc thời gian" });
  expect(timeline).toHaveTextContent(`Hết hạn phản đối${formatTimestamp(objectionEndsAt)}`);
  expect(timeline).toHaveTextContent(`Báo OwnerĐã gửi ${formatTimestamp(deliveredAt)}`);
  const previous = screen.getByRole("region", { name: "Hồ sơ trước bị từ chối" });
  expect(previous).toHaveTextContent("Hồ sơ trước của kho này đã bị từ chối");
  expect(previous).toHaveTextContent(formatTimestamp(CREATED_AT));
  expect(previous).toHaveTextContent("Giấy chứng tử không rõ nét");
});

it("mốc thời gian chưa có hiện Chưa bắt đầu và Chưa có, không có hồ sơ trước", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? { ...detailFixture, ownerNotice: null } : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  const timeline = await screen.findByRole("region", { name: "Mốc thời gian" });
  expect(timeline).toHaveTextContent("Chưa bắt đầu");
  expect(timeline).toHaveTextContent("Chưa có");
  expect(screen.queryByText(/đã bị từ chối/)).not.toBeInTheDocument();
});

it("hồ sơ chờ bổ sung ghi đang chờ Executor, không hiện Hạn xét ở danh sách lẫn chi tiết", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? { ...detailFixture, status: "SUPPLEMENT_REQUIRED", approveBlockers: ["NOT_UNDER_REVIEW"] }
      : { ...listFixture, items: [{ ...summaryFixture, status: "SUPPLEMENT_REQUIRED" }] },
  );
  setup(<VerifierQueue />);
  await screen.findByRole("button", { name: /Hồ sơ #33333333/ });
  expect(screen.getAllByText("Đang chờ Executor bổ sung")).toHaveLength(1);
  expect(screen.queryByText(/Hạn xét/)).not.toBeInTheDocument();
  await selectFirstCase(user);
  expect(screen.getAllByText(/Đang chờ Executor bổ sung/).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Hạn xét/)).not.toBeInTheDocument();
});

it("hồ sơ đang xét vẫn hiện Hạn xét ở danh sách", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />);
  await screen.findByRole("button", { name: /Hồ sơ #33333333/ });
  expect(screen.getAllByText(/Hạn xét/)).toHaveLength(1);
  expect(screen.queryByText(/Đang chờ Executor bổ sung/)).not.toBeInTheDocument();
});

it("hồ sơ đang xét vẫn hiện Hạn xét ở chi tiết", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  await screen.findByText("012345678901");
  expect(screen.getAllByText(/Hạn xét/)).toHaveLength(1);
  expect(screen.queryByText(/Đang chờ Executor bổ sung/)).not.toBeInTheDocument();
});

it("GET chi tiết 404 báo hồ sơ không còn được giao và nút Về danh sách xóa caseId", async () => {
  const user = userEvent.setup();
  const get = vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
    if (String(url).endsWith(CASE_ID))
      throw new AxiosError("not found", undefined, undefined, undefined, {
        status: 404,
        statusText: "Not Found",
        config: { headers: new AxiosHeaders() },
        headers: {},
        data: { code: "DEATH_CASE_NOT_FOUND" },
      });
    return listFixture;
  });
  const listCalls = () => get.mock.calls.filter(([url]) => !String(url).endsWith(CASE_ID)).length;
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=approve&flagId=${FLAG_ID}`);
  expect(await screen.findByText("Hồ sơ không còn được giao cho bạn.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
  const before = listCalls();
  await user.click(screen.getByRole("button", { name: "Về danh sách" }));
  await waitFor(() => expect(screen.getByTestId("search").textContent).toBe(""));
  expect(await screen.findByRole("region", { name: "Hồ sơ chứng tử" })).toBeInTheDocument();
  await waitFor(() => expect(listCalls()).toBeGreaterThan(before));
});

it("lỗi khác 404 của GET chi tiết vẫn giữ Thử lại, không báo mất phân công", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
    if (String(url).endsWith(CASE_ID))
      throw new AxiosError("boom", undefined, undefined, undefined, {
        status: 500,
        statusText: "Server Error",
        config: { headers: new AxiosHeaders() },
        headers: {},
        data: { code: "INTERNAL" },
      });
    return listFixture;
  });
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  expect(await screen.findByText(/Không đọc được hồ sơ/)).toBeInTheDocument();
  expect(screen.queryByText("Hồ sơ không còn được giao cho bạn.")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Về danh sách" })).not.toBeInTheDocument();
});

it("đổi sang hồ sơ khác không giữ modal và lỗi của hồ sơ cũ", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
    if (String(url).endsWith(CASE_ID)) return detailFixture;
    if (String(url).endsWith(CASE_B_ID)) return { ...detailFixture, id: CASE_B_ID, etag: "v-b" };
    return {
      ...listFixture,
      items: [summaryFixture, { ...summaryFixture, id: CASE_B_ID }],
      totalCount: 2,
    };
  });
  vi.spyOn(apiClient, "post").mockRejectedValue(
    new AxiosError("conflict", undefined, undefined, undefined, {
      status: 409,
      statusText: "Conflict",
      config: { headers: new AxiosHeaders() },
      headers: {},
      data: { code: "EDIT_CONFLICT" },
    }),
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=reject`);
  await user.type(await screen.findByLabelText("Lý do từ chối"), "Không đủ căn cứ");
  await user.click(screen.getByRole("checkbox", { name: /Tôi xác nhận từ chối/ }));
  await user.click(screen.getByRole("button", { name: /^Từ chối$/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/đã thay đổi/);
  // Dialog đang mở nên phần còn lại bị ẩn khỏi cây truy cập; click trực tiếp như khi người dùng quay về hàng chờ.
  fireEvent.click(await screen.findByRole("button", { name: "Về hàng chờ", hidden: true }));
  fireEvent.click(await screen.findByRole("button", { name: /Hồ sơ #66666666/ }));
  expect(
    await screen.findByRole("heading", { name: /Hồ sơ #66666666/, level: 2 }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByTestId("search").textContent).toBe(`?caseId=${CASE_B_ID}`);
});

it("tải trang lỗi 500 hiện lỗi và không tạo object URL", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
    if (String(url).includes("/files/"))
      throw new AxiosError("integrity", undefined, undefined, undefined, {
        status: 500,
        statusText: "Server Error",
        config: { headers: new AxiosHeaders() },
        headers: {},
        data: { code: "CONTENT_INTEGRITY_FAILED" },
      });
    return String(url).endsWith(`/verifier/death-cases/${CASE_ID}`) ? detailFixture : listFixture;
  });
  const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fixture");
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  await user.click(await screen.findByRole("button", { name: "Tải nội dung" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Máy chủ đang gặp sự cố/);
  expect(create).not.toHaveBeenCalled();
});

it("yêu cầu bổ sung thành công gửi đúng etag, lý do và các phần cần bổ sung", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({
    ...detailFixture,
    status: "SUPPLEMENT_REQUIRED",
    etag: "v-2",
    approveBlockers: ["NOT_UNDER_REVIEW"],
  });
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  await user.click(screen.getByRole("button", { name: /Yêu cầu bổ sung/ }));
  await user.type(screen.getByLabelText("Lý do"), "Thiếu trang giấy tờ");
  await user.click(screen.getByRole("checkbox", { name: "Trang giấy tờ" }));
  await user.click(screen.getByRole("checkbox", { name: "Số CCCD" }));
  await user.click(screen.getByRole("checkbox", { name: /Tôi xác nhận yêu cầu này/ }));
  await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(`/verifier/death-cases/${CASE_ID}/request-supplement`, {
      etag: "v-1",
      reason: "Thiếu trang giấy tờ",
      requestedParts: ["FILES", "OWNER_CITIZEN_ID"],
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByTestId("search").textContent).not.toMatch(/modal/);
});

it("409 EDIT_CONFLICT: Tải lại hồ sơ đọc lại chi tiết từ server và đóng dialog", async () => {
  const user = userEvent.setup();
  let detailReads = 0;
  vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
    if (!String(url).endsWith(CASE_ID)) return listFixture;
    detailReads += 1;
    return detailFixture;
  });
  vi.spyOn(apiClient, "post").mockRejectedValue(
    new AxiosError("conflict", undefined, undefined, undefined, {
      status: 409,
      statusText: "Conflict",
      config: { headers: new AxiosHeaders() },
      headers: {},
      data: { code: "EDIT_CONFLICT" },
    }),
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=reject`);
  await user.type(await screen.findByLabelText("Lý do từ chối"), "Không đủ căn cứ");
  await user.click(screen.getByRole("checkbox", { name: /Tôi xác nhận từ chối/ }));
  await user.click(screen.getByRole("button", { name: /^Từ chối$/ }));
  await user.click(await screen.findByRole("button", { name: "Tải lại hồ sơ" }));
  await waitFor(() => expect(detailReads).toBe(2));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByTestId("search").textContent).toBe(`?caseId=${CASE_ID}`);
});

it("Escape đóng dialog và xóa modal khỏi URL", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=reject`);
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  expect(screen.getByTestId("search").textContent).toContain("modal=reject");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByTestId("search").textContent).toBe(`?caseId=${CASE_ID}`);
});

it("ô lý do là textarea giới hạn 1000 ký tự và checkbox có vùng bấm tối thiểu 44px", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=supplement`);
  const reason = await screen.findByLabelText("Lý do");
  expect(reason.tagName).toBe("TEXTAREA");
  expect(reason).toHaveAttribute("maxlength", "1000");
  for (const name of ["Trang giấy tờ", /Tôi xác nhận yêu cầu này/]) {
    expect(screen.getByRole("checkbox", { name }).closest("label")).toHaveClass("min-h-11");
  }
});

it("mã hồ sơ ở danh sách là 8 ký tự cuối của id, in hoa như email BE", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(MIXED_CASE_ID)
      ? { ...detailFixture, id: MIXED_CASE_ID }
      : { ...listFixture, items: [{ ...summaryFixture, id: MIXED_CASE_ID }] },
  );
  setup(<VerifierQueue />);
  expect(await screen.findByRole("button", { name: /Hồ sơ #8C0D1A2F/ })).toBeInTheDocument();
  expect(screen.queryByText(/Hồ sơ #0199E7A4/i)).not.toBeInTheDocument();
});

it("mã hồ sơ ở tiêu đề chi tiết là 8 ký tự cuối của id, in hoa như email BE", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(MIXED_CASE_ID)
      ? { ...detailFixture, id: MIXED_CASE_ID }
      : { ...listFixture, items: [{ ...summaryFixture, id: MIXED_CASE_ID }] },
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${MIXED_CASE_ID}`);
  expect(await screen.findByRole("heading", { name: "Hồ sơ #8C0D1A2F", level: 2 })).toBeVisible();
  expect(screen.queryByText(/Hồ sơ #0199E7A4/i)).not.toBeInTheDocument();
});

it("supplementOverdueAt có giá trị hiện nhãn Bổ sung quá hạn ở danh sách và chi tiết theo giờ Việt Nam", async () => {
  const overdueAt = "2026-10-10T17:30:00Z";
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? { ...detailFixture, status: "SUPPLEMENT_REQUIRED", supplementOverdueAt: overdueAt }
      : {
          ...listFixture,
          items: [
            { ...summaryFixture, status: "SUPPLEMENT_REQUIRED", supplementOverdueAt: overdueAt },
          ],
        },
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  await screen.findByText("012345678901");
  expect(screen.getAllByText("Bổ sung quá hạn")).toHaveLength(1);
  // 17:30 UTC = 00:30 ngày hôm sau theo giờ Việt Nam.
  expect(
    screen.getByText(/Executor bổ sung quá hạn từ .*00:30.*giờ Việt\s+Nam/),
  ).toBeInTheDocument();
});

it("supplementOverdueAt có giá trị hiện nhãn Bổ sung quá hạn ở danh sách", async () => {
  const overdueAt = "2026-10-10T17:30:00Z";
  vi.spyOn(apiClient, "get").mockResolvedValue({
    ...listFixture,
    items: [{ ...summaryFixture, status: "SUPPLEMENT_REQUIRED", supplementOverdueAt: overdueAt }],
  });
  setup(<VerifierQueue />);
  await screen.findByRole("button", { name: /Hồ sơ #33333333/ });
  expect(screen.getAllByText("Bổ sung quá hạn")).toHaveLength(1);
});

it.each([
  ["null", { supplementOverdueAt: null }],
  ["thiếu trường (BE cũ)", {}],
])(
  "supplementOverdueAt %s không hiện nhãn Bổ sung quá hạn và vẫn parse được",
  async (_name, extra) => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
      String(url).endsWith(CASE_ID)
        ? { ...detailFixture, ...extra }
        : { ...listFixture, items: [{ ...summaryFixture, ...extra }] },
    );
    setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
    await screen.findByText("012345678901");
    expect(screen.getByRole("heading", { name: /Hồ sơ #33333333/, level: 2 })).toBeInTheDocument();
    expect(screen.queryByText(/Bổ sung quá hạn/)).not.toBeInTheDocument();
    expect(screen.queryByText(/bổ sung quá hạn từ/)).not.toBeInTheDocument();
  },
);
