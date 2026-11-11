import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { CREATED_AT, VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { NotaryWorkspacePage } from "@/pages/notary/NotaryWorkspacePage";
import { VerifierCriteriaPage } from "@/pages/notary/VerifierCriteriaPage";
import { VerifierHistoryPage } from "@/pages/notary/VerifierHistoryPage";
import { VerifierQueuePage } from "@/pages/notary/VerifierQueuePage";

const OPEN_ID = "33333333-3333-4333-8333-333333333333";
const DONE_ID = "66666666-6666-4666-8666-666666666666";
const REJECTED_ID = "77777777-7777-4777-8777-777777777777";
const SUPPLEMENT_ID = "88888888-8888-4888-8888-888888888888";

const summary = (id: string, status: string, extra: Record<string, unknown> = {}) => ({
  id,
  status,
  reviewVersionNo: 1,
  ownerCitizenIdLast4: "8901",
  dateOfDeath: "2026-10-01",
  submittedAt: CREATED_AT,
  assignedAt: CREATED_AT,
  dueAt: CREATED_AT,
  objectionEndsAt: null,
  unreviewedFlagCount: 0,
  closedAt: null,
  ...extra,
});

const list = (items: unknown[]) => ({
  items,
  totalCount: items.length,
  pageIndex: 1,
  pageSize: 20,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
});

const submission = (id: string, submittedAt: string = CREATED_AT) => ({
  id,
  turnId: "99999999-9999-4999-8999-999999999999",
  containerName: "Kho Anh Nam",
  kind: "ACCEPT",
  allMatch: true,
  submittedAt,
});

/** Hồ sơ báo tin trả theo trang, hồ sơ người nhận trả mảng: hai đường dẫn khác nhau nên mock theo đường dẫn. */
function mockApi(cases: unknown[], recipients: unknown[] = []) {
  return vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url.includes("handover-submissions")) return recipients;
    return list(cases);
  });
}

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("verifier-workspace-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(path: string) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: VAULT_ID,
        email: "lan@example.test",
        fullName: "Cô Lan",
        role: "VERIFIER",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: true,
        createdAt: CREATED_AT,
      },
    }),
  );
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/notary/workspace" element={<NotaryWorkspacePage />} />
            <Route path="/notary/queue" element={<VerifierQueuePage />} />
            <Route path="/notary/history" element={<VerifierHistoryPage />} />
            <Route path="/notary/criteria" element={<VerifierCriteriaPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("Verifier workspace shell", () => {
  it("menu chia nhóm Việc cần làm, Đã xử lý, Khác; có tài khoản và không có nút đổi vai", async () => {
    mockApi([]);
    setup("/notary/workspace");
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người xét duyệt" });
    expect(Array.from(nav.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Tổng quan",
      "Hồ sơ báo tin",
      "Hồ sơ người nhận",
      "Biên bản đã ký",
      "Lịch sử xét duyệt",
      "Hướng dẫn xét duyệt",
      "Tài khoản",
    ]);
    expect(within(nav).getByRole("group", { name: "Việc cần làm" })).toBeInTheDocument();
    expect(within(nav).getByRole("group", { name: "Đã xử lý" })).toBeInTheDocument();
    expect(within(nav).getByRole("group", { name: "Khác" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Người xét duyệt")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Sang vai/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Đăng xuất" })[0]).toHaveAttribute(
      "href",
      "/logout",
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Chào Cô Lan" }),
    ).toBeInTheDocument();
  });

  it("huy hiệu ở menu là số việc đang chờ, hết việc thì ẩn", async () => {
    mockApi(
      [summary(OPEN_ID, "UNDER_REVIEW")],
      [
        submission("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
        submission("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"),
      ],
    );
    setup("/notary/workspace");
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người xét duyệt" });
    expect(await within(nav).findByLabelText("1 việc đang chờ bạn duyệt")).toBeInTheDocument();
    expect(await within(nav).findByLabelText("2 việc đang chờ bạn duyệt")).toBeInTheDocument();
  });
});

describe("Verifier overview", () => {
  it("hai thẻ việc: số hồ sơ báo tin và hồ sơ người nhận đang chờ, kèm hồ sơ nộp sớm nhất", async () => {
    mockApi(
      [
        summary(OPEN_ID, "UNDER_REVIEW"),
        summary(DONE_ID, "APPROVED_FOR_HANDOVER", { closedAt: CREATED_AT }),
      ],
      [submission("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")],
    );
    setup("/notary/workspace");
    const cases = await screen.findByRole("link", { name: /Hồ sơ báo tin chờ duyệt/ });
    expect(cases).toHaveAttribute("href", "/notary/queue");
    await waitFor(() => expect(cases).toHaveTextContent("1"));
    expect(cases).toHaveTextContent("Cũ nhất: nộp");
    const recipients = screen.getByRole("link", { name: /Hồ sơ người nhận chờ duyệt/ });
    expect(recipients).toHaveAttribute("href", "/notary/recipients");
    await waitFor(() => expect(recipients).toHaveTextContent("Cũ nhất: nộp"));
    // Danh sách bên dưới chỉ có hồ sơ còn mở và dẫn thẳng tới hồ sơ đó.
    expect(screen.getByRole("link", { name: "Xem hồ sơ #33333333" })).toHaveAttribute(
      "href",
      `/notary/queue?caseId=${OPEN_ID}`,
    );
    expect(screen.getAllByText(/Hồ sơ #/)).toHaveLength(1);
    expect(screen.getByText("Hồ sơ báo tin, giấy tờ")).toBeInTheDocument();
    expect(screen.getByText("Nội dung kho")).toBeInTheDocument();
  });

  it("không còn việc thì hai thẻ ghi 0 và Không còn việc", async () => {
    mockApi([]);
    setup("/notary/workspace");
    await screen.findByText("Chưa có hồ sơ nào đang được giao.");
    await waitFor(() => expect(screen.getAllByText("Không còn việc")).toHaveLength(2));
    const cases = screen.getByRole("link", { name: /Hồ sơ báo tin chờ duyệt/ });
    expect(cases).toHaveTextContent("0");
  });

  it("lỗi tải thì báo lỗi kèm Thử lại, thẻ không hiện số giả", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("down"));
    setup("/notary/workspace");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được một phần số liệu");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.getAllByText("Không tải được số liệu")).toHaveLength(2);
  });
});

describe("Verifier queue and history", () => {
  it("tab Chờ bạn duyệt chỉ có hồ sơ còn mở, nộp trước xếp trên; hồ sơ chờ bổ sung nằm ở tab còn lại", async () => {
    mockApi([
      summary(OPEN_ID, "UNDER_REVIEW", { unreviewedFlagCount: 2 }),
      summary(DONE_ID, "APPROVED_FOR_HANDOVER", { closedAt: CREATED_AT }),
      summary(SUPPLEMENT_ID, "SUPPLEMENT_REQUIRED"),
    ]);
    setup("/notary/queue");
    expect(
      await screen.findByRole("button", { name: "Duyệt hồ sơ #33333333" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /hồ sơ #66666666/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /hồ sơ #88888888/ })).not.toBeInTheDocument();
    expect(screen.getByText("2 cảnh báo chưa kiểm tra")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Hồ sơ báo tin" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Chờ Người thực thi bổ sung/ }));
    expect(await screen.findByRole("button", { name: "Xem hồ sơ #88888888" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /hồ sơ #33333333/ })).not.toBeInTheDocument();
  });

  it("lists decided cases with the decision in the history table", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      list([
        summary(OPEN_ID, "UNDER_REVIEW"),
        summary(DONE_ID, "APPROVED_FOR_HANDOVER", { closedAt: CREATED_AT }),
        summary(REJECTED_ID, "REJECTED", { closedAt: CREATED_AT }),
      ]),
    );
    setup("/notary/history");
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("Chấp thuận")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Từ chối")).toBeInTheDocument();
    expect(screen.queryByText(/#33333333/)).not.toBeInTheDocument();
  });

  it("shows the empty history instead of the open cases", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(list([summary(OPEN_ID, "UNDER_REVIEW")]));
    setup("/notary/history");
    expect(await screen.findByText("Chưa có hồ sơ nào đã xử lý.")).toBeInTheDocument();
  });
});

describe("Verifier criteria", () => {
  it("lists when to approve and when to reject", () => {
    setup("/notary/criteria");
    expect(screen.getByText("Chấp thuận khi")).toBeInTheDocument();
    expect(screen.getByText("Giấy tờ rõ ràng")).toBeInTheDocument();
    expect(screen.getByText("Từ chối khi")).toBeInTheDocument();
    expect(screen.getByText("Giấy tờ mờ hoặc nghi giả")).toBeInTheDocument();
  });
});
