import { cleanup, render, screen, within } from "@testing-library/react";
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
  it("shows the five menu items, the account and no role switch", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(list([]));
    setup("/notary/workspace");
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người xét duyệt" });
    expect(Array.from(nav.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Tổng quan",
      "Hàng chờ",
      "Tiêu chí",
      "Lịch sử",
      "Cài đặt",
    ]);
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
});

describe("Verifier overview", () => {
  it("counts the cases waiting for the Verifier and links to the first one", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      list([
        summary(OPEN_ID, "UNDER_REVIEW"),
        summary(DONE_ID, "APPROVED_FOR_HANDOVER", { closedAt: CREATED_AT }),
      ]),
    );
    setup("/notary/workspace");
    expect(await screen.findByText("1 hồ sơ đang chờ bạn")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Xem hồ sơ" })[0]).toHaveAttribute(
      "href",
      `/notary/queue?caseId=${OPEN_ID}`,
    );
    // Hồ sơ đã có kết quả không nằm trong hàng chờ.
    expect(screen.getAllByText(/Hồ sơ #/)).toHaveLength(1);
    expect(screen.getByText("Hồ sơ báo tin, giấy tờ")).toBeInTheDocument();
    expect(screen.getByText("Nội dung kho")).toBeInTheDocument();
  });

  it("says nothing is waiting when no case needs review", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(list([]));
    setup("/notary/workspace");
    expect(await screen.findByText("Không có hồ sơ nào cần bạn xem lúc này")).toBeInTheDocument();
  });

  it("reports a failed list with a retry instead of an empty queue", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("down"));
    setup("/notary/workspace");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được danh sách hồ sơ");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("Verifier queue and history", () => {
  it("lists only open cases in the queue", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      list([
        summary(OPEN_ID, "UNDER_REVIEW", { unreviewedFlagCount: 2 }),
        summary(DONE_ID, "APPROVED_FOR_HANDOVER", { closedAt: CREATED_AT }),
      ]),
    );
    setup("/notary/queue");
    expect(await screen.findByRole("button", { name: /Xem hồ sơ #33333333/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xem hồ sơ #66666666/ })).not.toBeInTheDocument();
    expect(screen.getByText("2 cờ chưa xét")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Hàng chờ" })).toBeInTheDocument();
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
