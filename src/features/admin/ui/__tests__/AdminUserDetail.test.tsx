import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { AdminUserDetail } from "../AdminUserDetail";

const CREATED_AT = "2026-10-01T02:00:00+00:00";
const EXECUTOR_ID = "00000000-0000-4000-8000-000000000050";
const OTHER_EXECUTOR_ID = "00000000-0000-4000-8000-000000000051";
const LAWYER_ID = "00000000-0000-4000-8000-000000000060";
const VAULT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VAULT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const baseUser = {
  email: "user@example.test",
  fullName: "Người dùng thử",
  status: "ACTIVE",
  emailVerified: true,
  createdAt: CREATED_AT,
  lastLoginAt: null,
  etag: "e-1",
  assignedCases: [],
  recentDecisions: [],
  recentActivity: [],
};

const heldVaultA = {
  vaultId: VAULT_A,
  ownerNameMasked: "N. V. A.",
  planStatus: "HANDOVER_IN_PROGRESS",
  handoverRecordStatus: "SIGNING",
  handoverUnderway: true,
  canChangeExecutor: true,
};
const heldVaultB = {
  vaultId: VAULT_B,
  ownerNameMasked: "T. T. B.",
  planStatus: "ACTIVE",
  handoverRecordStatus: null,
  handoverUnderway: false,
  canChangeExecutor: true,
};

function executorDetail(heldVaults: unknown[]) {
  return { ...baseUser, id: EXECUTOR_ID, role: "EXECUTOR", heldVaults };
}

function candidatePage() {
  return {
    items: [
      {
        ...baseUser,
        id: EXECUTOR_ID,
        role: "EXECUTOR",
        fullName: "Chính người đang xem",
        email: "self@example.test",
      },
      {
        ...baseUser,
        id: OTHER_EXECUTOR_ID,
        role: "EXECUTOR",
        fullName: "Người thực thi mới",
        email: "new@example.test",
      },
    ],
    totalCount: 2,
    pageIndex: 1,
    pageSize: 20,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

/** Giả lập GET: chi tiết người dùng và danh sách tìm Người thực thi. */
function mockGet(detail: unknown) {
  return vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
    if (url === `/admin/users/${EXECUTOR_ID}` || url === `/admin/users/${LAWYER_ID}`) {
      return Promise.resolve(detail);
    }
    if (url === "/admin/users") return Promise.resolve(candidatePage());
    return Promise.reject(new Error(`unexpected ${url}`));
  });
}

function renderDetail(userId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { auth: () => ({ user: null }) } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <AdminUserDetail userId={userId} onBack={() => {}} />
      </QueryClientProvider>
    </Provider>,
  );
}

function failure(data: unknown, status: number) {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError("x", "ERR", config, undefined, {
    config,
    data,
    status,
    statusText: "x",
    headers: new AxiosHeaders(),
  });
}

beforeEach(() => {
  accessTokenMemory.set("admin-fixture");
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("AdminUserDetail - Người thực thi", () => {
  it("hiện kho đang giữ với tên che, trạng thái, bước biên bản và nhãn Đang bàn giao", async () => {
    mockGet(executorDetail([heldVaultA, heldVaultB]));
    renderDetail(EXECUTOR_ID);
    expect(await screen.findByText("Kho đang giữ")).toBeInTheDocument();
    expect(screen.getByText("N. V. A.")).toBeInTheDocument();
    expect(screen.getByText("Biên bản: Đang ký")).toBeInTheDocument();
    expect(screen.getAllByText("Đang bàn giao")).toHaveLength(2);
    expect(screen.getByText("Đang hoạt động")).toBeInTheDocument();
    expect(screen.getByText("T. T. B.")).toBeInTheDocument();
  });

  it("không giữ kho nào thì hiện câu rỗng", async () => {
    mockGet(executorDetail([]));
    renderDetail(EXECUTOR_ID);
    expect(await screen.findByText("Hiện không giữ kho nào")).toBeInTheDocument();
  });

  it("ẩn nút Đổi Người thực thi khi canChangeExecutor là false", async () => {
    mockGet(executorDetail([{ ...heldVaultB, canChangeExecutor: false }]));
    renderDetail(EXECUTOR_ID);
    await screen.findByText("T. T. B.");
    expect(screen.queryByRole("button", { name: /Đổi Người thực thi/ })).not.toBeInTheDocument();
  });

  it("hộp thoại bắt buộc lý do, loại người đang xem khỏi danh sách và gửi đúng body", async () => {
    mockGet(executorDetail([heldVaultA]));
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ status: "ACCEPTED" });
    renderDetail(EXECUTOR_ID);
    fireEvent.click(await screen.findByRole("button", { name: /Đổi Người thực thi của kho/ }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        "Người mới nhận việc ngay, người cũ mất quyền với kho này. Chữ ký người cũ đã ký vẫn giữ hiệu lực.",
      ),
    ).toBeInTheDocument();
    await within(dialog).findByText(/new@example.test/);
    expect(within(dialog).queryByText(/self@example.test/)).not.toBeInTheDocument();
    const submit = within(dialog).getByRole("button", { name: "Đổi Người thực thi" });
    expect(submit).toBeDisabled();

    fireEvent.click(within(dialog).getByRole("radio"));
    fireEvent.change(within(dialog).getByLabelText("Lý do"), {
      target: { value: "  Người cũ nghỉ việc  " },
    });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(`/admin/vaults/${VAULT_A}/executor`, {
      userId: OTHER_EXECUTOR_ID,
      reason: "Người cũ nghỉ việc",
    });
    expect(await screen.findByText("Người mới nhận việc ngay.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("tìm kiếm gọi danh sách Người thực thi đang hoạt động kèm từ khóa", async () => {
    const get = mockGet(executorDetail([heldVaultB]));
    renderDetail(EXECUTOR_ID);
    fireEvent.click(await screen.findByRole("button", { name: /Đổi Người thực thi của kho/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Tìm Người thực thi mới"), {
      target: { value: "moi" },
    });
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith(
        "/admin/users",
        expect.objectContaining({
          params: expect.objectContaining({ role: "EXECUTOR", status: "ACTIVE", search: "moi" }),
        }),
      ),
    );
  });

  it("kho chưa bàn giao hiện câu lời mời", async () => {
    mockGet(executorDetail([heldVaultB]));
    renderDetail(EXECUTOR_ID);
    fireEvent.click(await screen.findByRole("button", { name: /Đổi Người thực thi của kho/ }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        "Người mới nhận lời mời và phải chấp nhận; người cũ giữ vai trò tới khi người mới chấp nhận.",
      ),
    ).toBeInTheDocument();
  });

  it("thành công INVITED hiện câu mời đã gửi", async () => {
    mockGet(executorDetail([heldVaultB]));
    vi.spyOn(apiClient, "post").mockResolvedValue({ status: "INVITED" });
    renderDetail(EXECUTOR_ID);
    fireEvent.click(await screen.findByRole("button", { name: /Đổi Người thực thi của kho/ }));
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText(/new@example.test/);
    fireEvent.click(within(dialog).getByRole("radio"));
    fireEvent.change(within(dialog).getByLabelText("Lý do"), { target: { value: "Đổi người" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Đổi Người thực thi" }));
    expect(await screen.findByText(/Đã gửi lời mời cho Người thực thi mới/)).toBeInTheDocument();
  });

  it("lỗi 409 ROLE_CONFLICT hiện câu tiếng Việt và giữ hộp thoại", async () => {
    mockGet(executorDetail([heldVaultB]));
    vi.spyOn(apiClient, "post").mockRejectedValue(
      failure({ code: "EXECUTOR_NOT_ALLOWED", reason: "ROLE_CONFLICT" }, 409),
    );
    renderDetail(EXECUTOR_ID);
    fireEvent.click(await screen.findByRole("button", { name: /Đổi Người thực thi của kho/ }));
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText(/new@example.test/);
    fireEvent.click(within(dialog).getByRole("radio"));
    fireEvent.change(within(dialog).getByLabelText("Lý do"), { target: { value: "Đổi người" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Đổi Người thực thi" }));
    expect(
      await within(dialog).findByText("Tài khoản này không được làm Người thực thi."),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("lỗi không có câu riêng hiện thông báo chung", async () => {
    mockGet(executorDetail([heldVaultB]));
    vi.spyOn(apiClient, "post").mockRejectedValue(failure({}, 500));
    renderDetail(EXECUTOR_ID);
    fireEvent.click(await screen.findByRole("button", { name: /Đổi Người thực thi của kho/ }));
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText(/new@example.test/);
    fireEvent.click(within(dialog).getByRole("radio"));
    fireEvent.change(within(dialog).getByLabelText("Lý do"), { target: { value: "Đổi người" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Đổi Người thực thi" }));
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
  });
});

describe("AdminUserDetail - luật sư", () => {
  it("hiện việc đang giữ và quyết định gần đây với nhãn tiếng Việt", async () => {
    mockGet({
      ...baseUser,
      id: LAWYER_ID,
      role: "VERIFIER",
      assignedCases: [
        {
          kind: "HANDOVER_RECORD",
          caseId: "11111111-1111-4111-8111-111111111111",
          caseCode: "AB12CD34",
          status: "IDENTITY_CHECK",
          receivedAt: "2026-10-17T02:00:00+00:00",
        },
        {
          kind: "HANDOVER_REPORT",
          caseId: "22222222-2222-4222-8222-222222222222",
          caseCode: "EF56GH78",
          status: "SUPPLEMENT_REQUESTED",
          receivedAt: "2026-10-18T02:00:00+00:00",
        },
      ],
      recentDecisions: [
        {
          kind: "HANDOVER_REPORT",
          caseId: "33333333-3333-4333-8333-333333333333",
          caseCode: "JK90LM12",
          decision: "REJECTED",
          decidedAt: "2026-10-19T02:00:00+00:00",
        },
        {
          kind: "HANDOVER_RECORD",
          caseId: "44444444-4444-4444-8444-444444444444",
          caseCode: "NP34QR56",
          decision: "ACCEPTED",
          decidedAt: "2026-10-20T02:00:00+00:00",
        },
      ],
    });
    renderDetail(LAWYER_ID);
    expect(await screen.findByText("Việc đang giữ")).toBeInTheDocument();
    expect(screen.getByText("AB12CD34")).toBeInTheDocument();
    expect(screen.getByText("Kiểm danh tính")).toBeInTheDocument();
    expect(screen.getByText("EF56GH78")).toBeInTheDocument();
    expect(screen.getByText("Chờ bổ sung")).toBeInTheDocument();
    expect(screen.getByText("JK90LM12")).toBeInTheDocument();
    expect(screen.getByText("Từ chối")).toBeInTheDocument();
    expect(screen.getByText("Chấp nhận")).toBeInTheDocument();
    expect(screen.getAllByText("Biên bản")).toHaveLength(2);
    expect(screen.getAllByText("Hồ sơ báo tin")).toHaveLength(2);
    expect(screen.queryByText("Kho đang giữ")).not.toBeInTheDocument();
  });

  it("không có việc nào thì hiện câu rỗng", async () => {
    mockGet({ ...baseUser, id: LAWYER_ID, role: "VERIFIER" });
    renderDetail(LAWYER_ID);
    expect(await screen.findByText("Hiện không giữ việc nào.")).toBeInTheDocument();
    expect(screen.getByText("Chưa có quyết định nào.")).toBeInTheDocument();
  });
});
