import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { AxiosError, AxiosHeaders } from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { APPROVE_REASON } from "@/features/verifier-review/model/decisionReasons";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { verifierReviewService } from "@/features/verifier-review/api/verifierReviewService";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const FLAG_ID = "44444444-4444-4444-8444-444444444444";
const FILE_ID = "55555555-5555-4555-8555-555555555555";
// Đầu id khác cuối: bắt lỗi dùng 8 ký tự đầu thay vì mã hồ sơ của BE (8 ký tự cuối, in hoa).
const MIXED_CASE_ID = "0199e7a4-3c1b-7f2d-9a41-5e6b8c0d1a2f";
// Mật khẩu giả cho test xác nhận Duyệt/Từ chối; không phải mật khẩu thật của tài khoản nào.
const SIGNING_PASSWORD = "mat-khau-thu";
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
  assignment: { assignedAt: CREATED_AT, dueAt: CREATED_AT },
  canApprove: false,
  approveBlockers: ["FLAGS_NOT_REVIEWED"],
  previousCase: null,
  handover: null,
  ownerIdentity: {
    verified: false,
    citizenId: null,
    fullName: null,
    dateOfBirth: null,
    verifiedAt: null,
    citizenIdMatches: null,
    fullNameMatches: null,
    hasDocumentImage: false,
    documentImageCapturedAt: null,
  },
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

const formatTimestamp = (value: string) => formatDateTime(value);

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
  const listItem = await screen.findByRole("button", { name: /Xem hồ sơ #33333333/ });
  await user.click(listItem);
  await screen.findByRole("region", { name: "Bản đang xét" });
}

/** Tích đủ bốn ô đối chiếu; thiếu ô nào thì nút Duyệt mở bàn giao vẫn khóa. */
async function tickAllChecks(user: ReturnType<typeof userEvent.setup>) {
  for (const name of [
    /Họ tên khớp với giấy/,
    /Số CCCD khớp với giấy/,
    /Ngày sinh khớp với giấy/,
    /Giấy hợp lệ: đủ trang/,
  ]) {
    await user.click(screen.getByRole("checkbox", { name }));
  }
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
          approveBlockers: eligible ? [] : ["FLAGS_NOT_REVIEWED"],
        }
      : listFixture,
  );
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  await tickAllChecks(user);
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
  expect(await screen.findByRole("region", { name: "Bản đang xét" })).toBeInTheDocument();
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
  expect(await screen.findByRole("region", { name: "Bản đang xét" })).toBeInTheDocument();
});

it("danh sách rỗng không tạo hồ sơ giả", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({ ...listFixture, items: [], totalCount: 0 });
  setup(<VerifierQueue />);
  expect(await screen.findByText(/Hiện chưa có hồ sơ nào chờ bạn/)).toBeInTheDocument();
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
  await tickAllChecks(user);
  await user.click(screen.getByRole("button", { name: "Duyệt mở bàn giao" }));
  const submit = screen.getByRole("button", { name: /^Duyệt và mở kho$/ });
  expect(submit).toBeDisabled();
  expect(submit).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: /Tôi đã đối chiếu kỹ/ }));
  await user.type(screen.getByLabelText("Mật khẩu xác nhận"), SIGNING_PASSWORD);
  await user.click(submit);
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(`/verifier/death-cases/${CASE_ID}/approve`, {
      etag: "v-1",
      reason: APPROVE_REASON,
      password: SIGNING_PASSWORD,
    }),
  );
});

it("duyệt bị từ chối thì nêu đúng lý do của Backend thay vì câu chung chung", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? { ...detailFixture, canApprove: true, approveBlockers: [] }
      : listFixture,
  );
  vi.spyOn(apiClient, "post").mockRejectedValue(
    new AxiosError("conflict", undefined, undefined, undefined, {
      status: 409,
      statusText: "Conflict",
      config: { headers: new AxiosHeaders() },
      headers: {},
      data: { code: "DEATH_CASE_NOT_ALLOWED", reason: "PLAN_STATE_INVALID" },
    }),
  );
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  await tickAllChecks(user);
  await user.click(screen.getByRole("button", { name: "Duyệt mở bàn giao" }));
  await user.click(screen.getByRole("checkbox", { name: /Tôi đã đối chiếu kỹ/ }));
  await user.type(screen.getByLabelText("Mật khẩu xác nhận"), SIGNING_PASSWORD);
  await user.click(screen.getByRole("button", { name: /^Duyệt và mở kho$/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Kế hoạch của kho không còn ở trạng thái mở hồ sơ",
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
  await user.click(screen.getByRole("button", { name: "Kiểm tra" }));
  await user.click(screen.getByRole("checkbox", { name: /Tôi đã kiểm tra/ }));
  await user.click(screen.getByRole("button", { name: "Ghi nhận" }));
  expect(await screen.findByText("Cần nhập ghi chú kiểm tra cảnh báo.")).toBeInTheDocument();
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
  await user.click(screen.getByRole("button", { name: "Kiểm tra" }));
  await user.type(screen.getByLabelText("Ghi chú kiểm tra"), "Đã kiểm tra");
  await user.click(screen.getByRole("checkbox", { name: /Tôi đã kiểm tra/ }));
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
  const approve = await screen.findByRole("button", { name: /^Duyệt mở bàn giao$/ });
  expect(approve).toBeDisabled();
  await user.click(await screen.findByRole("button", { name: "Kiểm tra" }));
  await user.type(await screen.findByLabelText("Ghi chú kiểm tra"), "Đã rà soát kỹ");
  const confirmCheckbox = await screen.findByRole("checkbox", {
    name: /Tôi đã kiểm tra cảnh báo này/,
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
  await user.click(await screen.findByRole("radio", { name: /Thiếu trang/ }));
  await user.click(await screen.findByRole("checkbox", { name: /Tôi xác nhận yêu cầu này/ }));
  await user.click(await screen.findByRole("button", { name: "Gửi yêu cầu" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole("alert")).toHaveTextContent(/xung đột|đã thay đổi/i);
});

it("trình xem tạo object URL tạm, thu hồi khi đóng và không đưa blob vào cache truy vấn", async () => {
  const user = userEvent.setup();
  const blob = new Blob(["demo"], { type: "application/pdf" });
  vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
    if (String(url).includes("/files/")) return blob;
    return String(url).endsWith(`/verifier/death-cases/${CASE_ID}`) ? detailFixture : listFixture;
  });
  const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fixture");
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  setup(<VerifierQueue />);
  await selectFirstCase(user);
  await waitFor(() => expect(create).toHaveBeenCalled());
  expect(await screen.findByTitle(/Giấy chứng tử:/)).toHaveAttribute("src", "blob:fixture");
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((q) => ({ key: q.queryKey })),
    ),
  ).not.toContain("file-blob");
  cleanup();
  expect(revoke).toHaveBeenCalledWith("blob:fixture");
});

it("modal duyệt hiện nhãn tiếng Việt của blocker, không hiện mã thô", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=approve`);
  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("Còn cảnh báo chưa được kiểm tra.");
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
  await tickAllChecks(user);
  await user.click(screen.getByRole("button", { name: "Duyệt mở bàn giao" }));
  await user.click(screen.getByRole("checkbox", { name: /Tôi đã đối chiếu kỹ/ }));
  await user.type(screen.getByLabelText("Mật khẩu xác nhận"), SIGNING_PASSWORD);
  await user.click(screen.getByRole("button", { name: /^Duyệt và mở kho$/ }));
  expect(await screen.findByText(/Đã mở 2 lượt bàn giao/)).toBeInTheDocument();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.getByText(/Đã mở 2 lượt bàn giao/)).toBeInTheDocument();
  expect(detailReads).toBe(1);
  expect(screen.queryByRole("button", { name: /^Từ chối hồ sơ$/ })).not.toBeInTheDocument();
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
  expect(screen.queryByRole("button", { name: "Kiểm tra" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Yêu cầu bổ sung/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Duyệt mở bàn giao" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Từ chối$/ })).not.toBeInTheDocument();
});

it("hiện mốc thời gian hồ sơ đã nộp và hồ sơ trước bị từ chối, không còn mốc phản đối", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? {
          ...detailFixture,
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
  expect(timeline).toHaveTextContent("Hồ sơ đã nộp");
  expect(timeline).not.toHaveTextContent("phản đối");
  const previous = screen.getByRole("region", { name: "Hồ sơ trước bị từ chối" });
  expect(previous).toHaveTextContent("Hồ sơ trước của kho này đã bị từ chối");
  expect(previous).toHaveTextContent(formatTimestamp(CREATED_AT));
  expect(previous).toHaveTextContent("Giấy chứng tử không rõ nét");
});

it("hồ sơ không có hồ sơ trước thì không hiện khối từ chối", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  await screen.findByRole("region", { name: "Mốc thời gian" });
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
  await screen.findByRole("button", { name: /Xem hồ sơ #33333333/ });
  expect(screen.getAllByText("Đang chờ Executor bổ sung")).toHaveLength(1);
  expect(screen.queryByText(/Hạn xét/)).not.toBeInTheDocument();
  await selectFirstCase(user);
  expect(screen.getAllByText(/Đang chờ Executor bổ sung/).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Hạn xét/)).not.toBeInTheDocument();
});

it("hồ sơ đã duyệt chỉ báo đã duyệt ở ô điều kiện, không gợi ý bổ sung hay từ chối", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? {
          ...detailFixture,
          status: "APPROVED_FOR_HANDOVER",
          canApprove: false,
          approveBlockers: ["NOT_UNDER_REVIEW"],
        }
      : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  expect(await screen.findByText("Hồ sơ đã được duyệt, không cần xét thêm.")).toBeInTheDocument();
  expect(screen.queryByText(/Chưa thể duyệt vì/)).not.toBeInTheDocument();
});

it("không có khung người gửi; thời điểm nộp nằm ở bản đang xét", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  const version = await screen.findByRole("region", { name: "Bản đang xét" });
  expect(version).toHaveTextContent("Gửi lúc");
  expect(screen.queryByRole("region", { name: "Người gửi hồ sơ" })).not.toBeInTheDocument();
  expect(screen.queryByText("Email liên hệ")).not.toBeInTheDocument();
});

it("hồ sơ đang xét vẫn hiện Hạn xét ở danh sách", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />);
  await screen.findByRole("button", { name: /Xem hồ sơ #33333333/ });
  expect(screen.getAllByText(/Hạn xét/)).toHaveLength(1);
  expect(screen.queryByText(/Đang chờ Executor bổ sung/)).not.toBeInTheDocument();
});

it("hồ sơ đang xét vẫn hiện Hạn xét ở chi tiết", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  await screen.findByRole("region", { name: "Bản đang xét" });
  // Một lần ở dòng phân công dưới tiêu đề, một lần ở mốc "Hạn xét duyệt".
  expect(screen.getAllByText(/Hạn xét/)).toHaveLength(2);
  expect(screen.getByRole("region", { name: "Mốc thời gian" })).toHaveTextContent("Hạn xét duyệt");
  expect(screen.queryByText(/Đang chờ Executor bổ sung/)).not.toBeInTheDocument();
});

it("Executor đang soạn bản bổ sung thì Verifier thấy lý do chưa duyệt được", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID)
      ? { ...detailFixture, canApprove: false, approveBlockers: ["NEWER_VERSION_PENDING"] }
      : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  expect(await screen.findByText("Executor đang soạn bản bổ sung")).toBeInTheDocument();
  expect(screen.getByText(/Bạn đang xem bản đã gửi số 1/)).toBeInTheDocument();
});

it("quay lại tab thấy hồ sơ đã đổi thì báo, không tự thay nội dung; bấm xem bản mới mới tải lại", async () => {
  const user = userEvent.setup();
  let etag = "v-1";
  let detailReads = 0;
  vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
    if (!String(url).endsWith(CASE_ID)) return listFixture;
    detailReads += 1;
    return { ...detailFixture, etag };
  });
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  await screen.findByRole("region", { name: "Bản đang xét" });
  expect(detailReads).toBe(1);
  expect(screen.queryByText("Hồ sơ vừa thay đổi")).not.toBeInTheDocument();

  etag = "v-2";
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });

  expect(await screen.findByText("Hồ sơ vừa thay đổi")).toBeInTheDocument();
  expect(detailReads).toBe(2);
  await user.click(screen.getByRole("button", { name: "Xem bản mới nhất" }));
  await waitFor(() => expect(screen.queryByText("Hồ sơ vừa thay đổi")).not.toBeInTheDocument());
  expect(detailReads).toBe(3);
  focusManager.setFocused(undefined);
});

it("GET chi tiết 404 tự chuyển về trang tổng quan, xóa caseId và tải lại danh sách", async () => {
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
  await waitFor(() => expect(screen.getByTestId("search").textContent).toBe(""));
  expect(await screen.findByRole("region", { name: "Hồ sơ chứng tử" })).toBeInTheDocument();
  expect(screen.queryByText("Hồ sơ không còn được giao cho bạn.")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
  await waitFor(() => expect(listCalls()).toBeGreaterThan(0));
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
  expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được tệp");
  expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
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
  await user.click(await screen.findByRole("radio", { name: /Thiếu trang/ }));
  await user.click(screen.getByRole("checkbox", { name: /Tôi xác nhận yêu cầu này/ }));
  await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(`/verifier/death-cases/${CASE_ID}/request-supplement`, {
      etag: "v-1",
      reason: "Thiếu trang (giấy có 2 trang nhưng chỉ nộp 1)",
      requestedParts: ["FILES"],
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  // URL bỏ `modal` sau khi dialog đóng; chờ thay vì kiểm ngay để không phụ thuộc tốc độ máy.
  await waitFor(() => expect(screen.getByTestId("search").textContent).not.toMatch(/modal/));
});

it("hộp thoại nộp lại: lời nhắn là textarea giới hạn ký tự, lựa chọn và ô xác nhận đủ lớn để bấm", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=supplement`);
  const note = await screen.findByLabelText(/Lời nhắn cho Người thực hiện/);
  expect(note.tagName).toBe("TEXTAREA");
  expect(note).toHaveAttribute("maxlength", "900");
  expect(screen.getByRole("radio", { name: /File mờ/ }).closest("label")).toHaveClass("min-h-11");
  expect(
    screen.getByRole("checkbox", { name: /Tôi xác nhận yêu cầu này/ }).closest("label"),
  ).toHaveClass("min-h-11");
});

it("mã hồ sơ ở danh sách là 8 ký tự cuối của id, in hoa như email BE", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(MIXED_CASE_ID)
      ? { ...detailFixture, id: MIXED_CASE_ID }
      : { ...listFixture, items: [{ ...summaryFixture, id: MIXED_CASE_ID }] },
  );
  setup(<VerifierQueue />);
  expect(await screen.findByRole("button", { name: /Xem hồ sơ #8C0D1A2F/ })).toBeInTheDocument();
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
  await screen.findByRole("region", { name: "Bản đang xét" });
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
  await screen.findByRole("button", { name: /Xem hồ sơ #33333333/ });
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
    await screen.findByRole("region", { name: "Bản đang xét" });
    expect(screen.getByRole("heading", { name: /Hồ sơ #33333333/, level: 2 })).toBeInTheDocument();
    expect(screen.queryByText(/Bổ sung quá hạn/)).not.toBeInTheDocument();
    expect(screen.queryByText(/bổ sung quá hạn từ/)).not.toBeInTheDocument();
  },
);

// ---- Xác nhận bằng mật khẩu của Verifier (DEATH-03, BE mục 6.12) ----

const approvableDetail = { ...detailFixture, canApprove: true, approveBlockers: [] };
const closedDetail = {
  ...detailFixture,
  status: "APPROVED_FOR_HANDOVER",
  closedAt: CREATED_AT,
  canApprove: false,
  approveBlockers: ["NOT_UNDER_REVIEW"],
};

function httpError(status: number, data: unknown) {
  return new AxiosError("failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    config: { headers: new AxiosHeaders() },
    headers: {},
    data,
  });
}

/** Mở modal Duyệt, điền lý do và hai ô xác nhận; `password` = null thì không nhập mật khẩu. */
async function fillApprove(
  user: ReturnType<typeof userEvent.setup>,
  password: string | null = SIGNING_PASSWORD,
) {
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=approve`);
  await user.click(await screen.findByRole("checkbox", { name: /Tôi đã đối chiếu kỹ/ }));
  if (password !== null) await user.type(screen.getByLabelText("Mật khẩu xác nhận"), password);
}

it("ô mật khẩu xác nhận là password với autocomplete current-password và có câu giải thích", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? approvableDetail : listFixture,
  );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}&modal=approve`);
  const input = await screen.findByLabelText("Mật khẩu xác nhận");
  expect(input).toHaveAttribute("type", "password");
  expect(input).toHaveAttribute("autocomplete", "current-password");
  expect(input).toHaveAccessibleDescription(
    "Nhập mật khẩu tài khoản để xác nhận quyết định. Nhập sai 5 lần sẽ tạm khóa chức năng duyệt/từ chối.",
  );
});

it("nút Duyệt bị khóa khi chưa nhập mật khẩu dù đã điền lý do và hai xác nhận", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? approvableDetail : listFixture,
  );
  const post = vi.spyOn(apiClient, "post");
  await fillApprove(user, null);
  const submit = screen.getByRole("button", { name: /^Duyệt và mở kho$/ });
  expect(submit).toBeDisabled();
  await user.type(screen.getByLabelText("Mật khẩu xác nhận"), SIGNING_PASSWORD);
  expect(submit).toBeEnabled();
  expect(post).not.toHaveBeenCalled();
});

it("403 sai mật khẩu báo số lần còn lại, xóa ô mật khẩu, giữ lý do và ô xác nhận", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? approvableDetail : listFixture,
  );
  const post = vi
    .spyOn(apiClient, "post")
    .mockRejectedValue(httpError(403, { code: "SIGNING_PASSWORD_INVALID", attemptsRemaining: 3 }));
  await fillApprove(user);
  await user.click(screen.getByRole("button", { name: /^Duyệt và mở kho$/ }));
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Mật khẩu chưa đúng. Còn 3 lần thử trước khi bị tạm khóa.");
  // Không hiện câu chung "không có quyền" hay nút "Tải lại hồ sơ" cho lỗi xác nhận mật khẩu.
  expect(alert).not.toHaveTextContent(/không có quyền/);
  expect(screen.queryByRole("button", { name: "Tải lại hồ sơ" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Mật khẩu xác nhận")).toHaveValue("");
  expect(screen.getByRole("checkbox", { name: /Tôi đã đối chiếu kỹ/ })).toBeChecked();
  expect(screen.getByRole("button", { name: /^Duyệt và mở kho$/ })).toBeDisabled();
  expect(post).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

it("403 không có attemptsRemaining báo tài khoản chưa có mật khẩu", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? approvableDetail : listFixture,
  );
  vi.spyOn(apiClient, "post").mockRejectedValue(
    httpError(403, { code: "SIGNING_PASSWORD_INVALID" }),
  );
  await fillApprove(user);
  await user.click(screen.getByRole("button", { name: /^Duyệt và mở kho$/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Tài khoản chưa có mật khẩu nên chưa xác nhận được. Vui lòng đặt mật khẩu trong cài đặt tài khoản.",
  );
});

it("hết lockedUntil thì nút gửi được mở lại", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? approvableDetail : listFixture,
  );
  // Tính lockedUntil lúc POST được gọi, không phải lúc test bắt đầu: khi chạy cả bộ test
  // máy chậm, bước điền form có thể vượt quá thời gian khóa và làm test chập chờn.
  vi.spyOn(apiClient, "post").mockImplementation(async () => {
    const lockedUntil = new Date(Date.now() + 3000).toISOString();
    throw httpError(423, { code: "SIGNING_LOCKED", lockedUntil });
  });
  await fillApprove(user);
  await user.click(screen.getByRole("button", { name: /^Duyệt và mở kho$/ }));
  await screen.findByText(/Chức năng duyệt\/từ chối đang tạm khóa/);
  await user.type(screen.getByLabelText("Mật khẩu xác nhận"), SIGNING_PASSWORD);
  expect(screen.getByRole("button", { name: /^Duyệt và mở kho$/ })).toBeDisabled();
  await waitFor(
    () => expect(screen.getByRole("button", { name: /^Duyệt và mở kho$/ })).toBeEnabled(),
    {
      timeout: 6000,
    },
  );
}, 10000);

it("lỗi khác khi duyệt vẫn hiện ReviewError với nút Tải lại hồ sơ", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? approvableDetail : listFixture,
  );
  vi.spyOn(apiClient, "post").mockRejectedValue(httpError(409, { code: "EDIT_CONFLICT" }));
  await fillApprove(user);
  await user.click(screen.getByRole("button", { name: /^Duyệt và mở kho$/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/đã thay đổi/);
  expect(screen.getByRole("button", { name: "Tải lại hồ sơ" })).toBeInTheDocument();
});

it("mật khẩu không nằm trong storage, query cache, mutation cache hay URL sau khi gửi", async () => {
  const user = userEvent.setup();
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? approvableDetail : listFixture,
  );
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(closedDetail);
  await fillApprove(user);
  await user.click(screen.getByRole("button", { name: /^Duyệt và mở kho$/ }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  const storage = JSON.stringify([{ ...localStorage }, { ...sessionStorage }]);
  expect(storage).not.toContain(SIGNING_PASSWORD);
  const cached = JSON.stringify(
    client
      .getQueryCache()
      .getAll()
      .map((query) => query.state.data),
  );
  expect(cached).not.toContain(SIGNING_PASSWORD);
  expect(client.getMutationCache().getAll()).toHaveLength(0);
  expect(screen.getByTestId("search").textContent).not.toContain(SIGNING_PASSWORD);
});

it("duyệt thành công cập nhật trạng thái từ response, không có nhãn hay nút xem chữ ký", async () => {
  const user = userEvent.setup();
  const get = vi
    .spyOn(apiClient, "get")
    .mockImplementation(async (url) =>
      String(url).endsWith(CASE_ID) ? approvableDetail : listFixture,
    );
  vi.spyOn(apiClient, "post").mockResolvedValue(closedDetail);
  await fillApprove(user);
  await user.click(screen.getByRole("button", { name: /^Duyệt và mở kho$/ }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.queryByText(/ký số/)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /chữ ký/i })).not.toBeInTheDocument();
  expect(get.mock.calls.some(([url]) => String(url).includes("decision-signature"))).toBe(false);
});

it("chi tiết hồ sơ đã đóng không gọi API phiếu chữ ký và không hiện nhãn chữ ký", async () => {
  const get = vi
    .spyOn(apiClient, "get")
    .mockImplementation(async (url) =>
      String(url).endsWith(CASE_ID) ? closedDetail : listFixture,
    );
  setup(<VerifierQueue />, `/notary/workspace?caseId=${CASE_ID}`);
  await screen.findByRole("region", { name: "Bản đang xét" });
  expect(screen.queryByText(/ký số|bị sửa sau khi ký/)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /chữ ký/i })).not.toBeInTheDocument();
  expect(get.mock.calls.some(([url]) => String(url).includes("decision-signature"))).toBe(false);
});

it("hàng chờ có thẻ Nên xem tiếp trỏ hồ sơ có hạn gần nhất, bảng theo cột Người nộp và Lần nộp, và các bước thẩm định", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith(CASE_ID) ? detailFixture : listFixture,
  );
  setup(<VerifierQueue />);
  const featured = await screen.findByRole("region", { name: "Nên xem tiếp" });
  expect(featured).toHaveTextContent("Hồ sơ báo tin #33333333");
  expect(screen.getByRole("columnheader", { name: "Người nộp" })).toBeInTheDocument();
  expect(screen.getByRole("columnheader", { name: "Lần nộp" })).toBeInTheDocument();
  expect(screen.getByText("Cách thẩm định một hồ sơ")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Bắt đầu thẩm định hồ sơ #33333333/ }));
  expect(await screen.findByRole("region", { name: "Bản đang xét" })).toBeInTheDocument();
});
