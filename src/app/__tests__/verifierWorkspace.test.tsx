import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { CREATED_AT, VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { formatTimeThenDate } from "@/shared/lib/dateFormat";
import { NotaryWorkspacePage } from "@/pages/notary/NotaryWorkspacePage";
import { VerifierCriteriaPage } from "@/pages/notary/VerifierCriteriaPage";
import { VerifierHistoryPage } from "@/pages/notary/VerifierHistoryPage";
import { VerifierQueuePage } from "@/pages/notary/VerifierQueuePage";

const OPEN_ID = "33333333-3333-4333-8333-333333333333";
const DONE_ID = "66666666-6666-4666-8666-666666666666";
const REJECTED_ID = "77777777-7777-4777-8777-777777777777";

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

/**
 * Giả lập Backend: danh sách hồ sơ báo tin theo `cases`, hồ sơ người nhận chờ duyệt theo `submissions`,
 * biên bản của Người xét duyệt rỗng. Mọi đường dẫn đều trả đúng dạng của nó để huy hiệu menu không lỗi.
 */
function mockBackend(cases: unknown[], submissions: unknown[] = []) {
  return vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url === "/verifier/handover-submissions") return submissions;
    if (url === "/verifier/handover-documents") return [];
    return list(cases);
  });
}

const submissionSummary = (id: string, submittedAt: string) => ({
  id,
  turnId: id,
  containerName: "Gói gia đình",
  kind: "ACCEPT",
  allMatch: true,
  submittedAt,
});

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
  it("shows three titled groups with the new menu names, the account and no role switch", async () => {
    mockBackend([]);
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
    const work = within(nav).getByRole("group", { name: "Việc cần làm" });
    expect(
      within(work)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Hồ sơ báo tin", "Hồ sơ người nhận"]);
    const done = within(nav).getByRole("group", { name: "Đã xử lý" });
    expect(
      within(done)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Biên bản đã ký", "Lịch sử xét duyệt"]);
    const other = within(nav).getByRole("group", { name: "Khác" });
    expect(
      within(other)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Hướng dẫn xét duyệt", "Tài khoản"]);
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Hồ sơ báo tin" })).toHaveAttribute(
      "href",
      "/notary/queue",
    );
    expect(screen.getByRole("link", { name: "Hồ sơ người nhận" })).toHaveAttribute(
      "href",
      "/notary/recipients",
    );
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

  it("hides the waiting badges when nothing is waiting", async () => {
    mockBackend([]);
    setup("/notary/workspace");
    await screen.findByRole("heading", { level: 1, name: "Chào Cô Lan" });
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người xét duyệt" });
    expect(within(nav).queryByLabelText(/việc đang chờ bạn duyệt/)).not.toBeInTheDocument();
  });

  it("shows how many jobs wait for the Verifier on the two job menu items", async () => {
    mockBackend(
      [summary(OPEN_ID, "UNDER_REVIEW"), summary(DONE_ID, "SUPPLEMENT_REQUIRED")],
      [
        submissionSummary("0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10", CREATED_AT),
        submissionSummary("0199e7a4-2222-7c3e-9a51-3f0f5d2b8a10", CREATED_AT),
      ],
    );
    setup("/notary/workspace");
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người xét duyệt" });
    const cases = within(nav).getByRole("link", { name: /Hồ sơ báo tin/ });
    await waitFor(() =>
      expect(within(cases).getByLabelText("1 việc đang chờ bạn duyệt")).toBeInTheDocument(),
    );
    const recipients = within(nav).getByRole("link", { name: /Hồ sơ người nhận/ });
    await waitFor(() =>
      expect(within(recipients).getByLabelText("2 việc đang chờ bạn duyệt")).toBeInTheDocument(),
    );
  });
});

describe("Verifier overview", () => {
  it("shows two clickable cards with the count and the oldest submission time", async () => {
    mockBackend(
      [
        summary(OPEN_ID, "UNDER_REVIEW"),
        summary(DONE_ID, "APPROVED_FOR_HANDOVER", { closedAt: CREATED_AT }),
      ],
      [submissionSummary("0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10", CREATED_AT)],
    );
    setup("/notary/workspace");
    const cases = await screen.findByRole("link", { name: /Hồ sơ báo tin chờ duyệt/ });
    expect(cases).toHaveAttribute("href", "/notary/queue");
    await waitFor(() =>
      expect(cases).toHaveTextContent("Cũ nhất: nộp " + formatTimeThenDate(CREATED_AT)),
    );
    expect(cases).toHaveTextContent("1");
    const recipients = screen.getByRole("link", { name: /Hồ sơ người nhận chờ duyệt/ });
    expect(recipients).toHaveAttribute("href", "/notary/recipients");
    await waitFor(() =>
      expect(recipients).toHaveTextContent("Cũ nhất: nộp " + formatTimeThenDate(CREATED_AT)),
    );
    // Hồ sơ đã có kết quả không nằm trong danh sách đang mở.
    expect(screen.getAllByText(/Hồ sơ #/)).toHaveLength(1);
    expect(screen.getByText("Hồ sơ báo tin, giấy tờ")).toBeInTheDocument();
    expect(screen.getByText("Nội dung kho")).toBeInTheDocument();
    expect(screen.queryByText(/Quá hạn|Còn \d+ ngày|Hạn/)).not.toBeInTheDocument();
  });

  it("says there is no job when nothing is waiting", async () => {
    mockBackend([]);
    setup("/notary/workspace");
    const cases = await screen.findByRole("link", { name: /Hồ sơ báo tin chờ duyệt/ });
    await waitFor(() => expect(cases).toHaveTextContent("Không còn việc"));
    expect(screen.getByRole("link", { name: /Hồ sơ người nhận chờ duyệt/ })).toHaveTextContent(
      "Không còn việc",
    );
  });

  it("reports a failed list with a retry instead of an empty queue", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("down"));
    setup("/notary/workspace");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được một phần số liệu");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("Verifier queue and history", () => {
  it("lists only open cases in the queue", async () => {
    mockBackend([
      summary(OPEN_ID, "UNDER_REVIEW", { unreviewedFlagCount: 2 }),
      summary(DONE_ID, "APPROVED_FOR_HANDOVER", { closedAt: CREATED_AT }),
    ]);
    setup("/notary/queue");
    expect(
      await screen.findByRole("button", { name: /Duyệt hồ sơ #33333333/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /hồ sơ #66666666/ })).not.toBeInTheDocument();
    expect(screen.getByText("2 cảnh báo chưa kiểm tra")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Hồ sơ báo tin" })).toBeInTheDocument();
  });

  it("lists decided cases with the decision in the history table", async () => {
    mockBackend([
      summary(OPEN_ID, "UNDER_REVIEW"),
      summary(DONE_ID, "APPROVED_FOR_HANDOVER", { closedAt: CREATED_AT }),
      summary(REJECTED_ID, "REJECTED", { closedAt: CREATED_AT }),
    ]);
    setup("/notary/history");
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("Chấp thuận")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Từ chối")).toBeInTheDocument();
    expect(screen.queryByText(/#33333333/)).not.toBeInTheDocument();
  });

  it("shows the empty history instead of the open cases", async () => {
    mockBackend([summary(OPEN_ID, "UNDER_REVIEW")]);
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
