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
const SIGNING_ID = "44444444-4444-4444-8444-444444444444";
const IDENTITY_ID = "55555555-5555-4555-8555-555555555555";
const DONE_ID = "66666666-6666-4666-8666-666666666666";

/** Một dòng danh sách biên bản luật sư nhận từ GET /verifier/handover-records. */
const summary = (id: string, status: string, extra: Record<string, unknown> = {}) => ({
  id,
  vaultId: VAULT_ID,
  vaultName: "Tài sản gia đình",
  ownerName: "Anh Nam",
  status,
  recipientCount: 2,
  requestedAt: CREATED_AT,
  ...extra,
});

const submission = (id: string, submittedAt: string = CREATED_AT) => ({
  id,
  turnId: "99999999-9999-4999-8999-999999999999",
  containerName: "Biên bản bàn giao",
  kind: "ACCEPT",
  allMatch: true,
  submittedAt,
});

/** Biên bản và hồ sơ danh tính người nhận ở hai đường dẫn khác nhau nên mock theo đường dẫn. */
function mockApi(records: unknown[], recipients: unknown[] = []) {
  return vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url.includes("handover-submissions")) return recipients;
    return records;
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
      "Đang lập biên bản",
      "Kiểm tra CCCD",
      "Đã hoàn tất",
      "Hướng dẫn",
      "Tài khoản",
    ]);
    expect(within(nav).getByRole("group", { name: "Việc cần làm" })).toBeInTheDocument();
    expect(within(nav).getByRole("group", { name: "Đã xử lý" })).toBeInTheDocument();
    expect(within(nav).getByRole("group", { name: "Khác" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: /Sang vai/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Đăng xuất" })[0]).toHaveAttribute(
      "href",
      "/logout",
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Chào Cô Lan" }),
    ).toBeInTheDocument();
  });

  it("huy hiệu chỉ đếm biên bản cần luật sư lập hoặc ký, và hồ sơ danh tính đang chờ", async () => {
    mockApi(
      [
        summary(OPEN_ID, "DRAFTING"),
        summary(IDENTITY_ID, "IDENTITY_CHECK"),
        summary(DONE_ID, "COMPLETED"),
      ],
      [
        submission("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
        submission("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbb0000"),
      ],
    );
    setup("/notary/workspace");
    expect(await screen.findByLabelText("1 việc đang chờ bạn duyệt")).toBeInTheDocument();
    expect(await screen.findByLabelText("2 việc đang chờ bạn duyệt")).toBeInTheDocument();
  });
});

describe("Verifier overview", () => {
  it("hai thẻ việc: biên bản cần lập hoặc ký và danh tính người nhận chờ kiểm", async () => {
    mockApi(
      [summary(OPEN_ID, "DRAFTING"), summary(SIGNING_ID, "SIGNING"), summary(DONE_ID, "COMPLETED")],
      [submission("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "2026-10-18T03:00:00Z")],
    );
    setup("/notary/workspace");
    const records = await screen.findByRole("link", { name: /Hồ sơ và biên bản cần xử lý/ });
    await waitFor(() => expect(records).toHaveTextContent("2"));
    expect(records).toHaveAttribute("href", "/notary/queue");
    const recipients = screen.getByRole("link", { name: /Chờ kiểm tra CCCD/ });
    await waitFor(() => expect(recipients).toHaveTextContent("1"));
    expect(recipients).toHaveTextContent(/Cũ nhất: nộp/);
    expect(screen.getByRole("link", { name: "Xem biên bản #33333333" })).toHaveAttribute(
      "href",
      `/notary/queue?recordId=${OPEN_ID}`,
    );
    expect(screen.queryByRole("link", { name: "Xem biên bản #66666666" })).not.toBeInTheDocument();
  });

  it("không còn việc thì hai thẻ ghi 0 và Không còn việc", async () => {
    mockApi([]);
    setup("/notary/workspace");
    expect(await screen.findByText("Chưa có biên bản nào đang được giao.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Không còn việc")).toHaveLength(2));
  });

  it("lỗi tải thì báo lỗi kèm Thử lại, thẻ không hiện số giả", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("down"));
    setup("/notary/workspace");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được một phần số liệu.");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.getAllByText("Không tải được số liệu").length).toBeGreaterThan(0);
  });
});

describe("Verifier queue and history", () => {
  it("trang Biên bản bàn giao chỉ có biên bản chưa đủ chữ ký; bấm mã thì mở biên bản", async () => {
    const get = mockApi([summary(OPEN_ID, "DRAFTING"), summary(DONE_ID, "COMPLETED")]);
    setup("/notary/queue");
    const table = await screen.findByRole("table");
    expect(within(table).getByRole("button", { name: "Biên bản #33333333" })).toBeInTheDocument();
    expect(
      within(table).queryByRole("button", { name: "Biên bản #66666666" }),
    ).not.toBeInTheDocument();
    expect(within(table).getByText("Đang lập biên bản")).toBeInTheDocument();
    fireEvent.click(within(table).getByRole("button", { name: "Biên bản #33333333" }));
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith(`/verifier/handover-records/${OPEN_ID}`, expect.anything()),
    );
  });

  it("lịch sử chỉ có biên bản đã đủ chữ ký", async () => {
    mockApi([summary(OPEN_ID, "SIGNING"), summary(DONE_ID, "COMPLETED")]);
    setup("/notary/history");
    const table = await screen.findByRole("table");
    expect(within(table).getByRole("button", { name: "Biên bản #66666666" })).toBeInTheDocument();
    expect(within(table).getByText("Đã đủ chữ ký")).toBeInTheDocument();
    expect(
      within(table).queryByRole("button", { name: "Biên bản #33333333" }),
    ).not.toBeInTheDocument();
  });

  it("chưa có biên bản hoàn tất thì báo trống, không hiện biên bản đang mở", async () => {
    mockApi([summary(OPEN_ID, "DRAFTING")]);
    setup("/notary/history");
    expect(await screen.findByText("Chưa có biên bản nào hoàn tất.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
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
