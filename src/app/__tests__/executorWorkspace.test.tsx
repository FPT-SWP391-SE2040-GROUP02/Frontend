import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { deriveLog, deriveSteps } from "@/features/death-case/model/progressSteps";
import type { DeathCase } from "@/features/death-case/model/deathCase.schema";
import type { HandoverProgressTurn } from "@/features/death-case/model/handoverProgress.schema";
import { ExecutorOverviewPage } from "@/pages/executor/ExecutorOverviewPage";
import { ExecutorPermissionsSection } from "@/pages/executor/ExecutorPermissionsPage";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";
import { ExecutorReportPage } from "@/pages/executor/ExecutorReportPage";
import { ExecutorProgressPage } from "@/pages/executor/ExecutorProgressPage";
import { ExecutorAssetsPage } from "@/pages/executor/ExecutorAssetsPage";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_VAULT_ID = "44444444-4444-4444-8444-444444444444";
const OVERDUE_REJECTED_CASE_ID = "55555555-5555-4555-8555-555555555555";

const vault = (overrides: Record<string, unknown> = {}) => ({
  vaultId: VAULT_ID,
  ownerFullName: "Anh Nam",
  planStatus: "ACTIVE",
  checkInOverdue: false,
  openDeathCaseId: null,
  lastRejectedDeathCaseId: null,
  ...overrides,
});

function deathCase(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: CASE_ID,
    vaultId: VAULT_ID,
    status,
    currentVersion: {
      versionNo: 1,
      isDraft: status === "DRAFT",
      ownerFullName: "Anh Nam",
      ownerCitizenIdLast4: "0001",
      dateOfDeath: null,
      certificateNumber: null,
      issuedOn: null,
      issuedBy: null,
      files: [],
      submittedAt: status === "DRAFT" ? null : CREATED_AT,
    },
    reviewVersionNo: null,
    missingRequirements: ["DATE_OF_DEATH", "FILES"],
    ownerNotice: null,
    objectionEndsAt: null,
    createdAt: CREATED_AT,
    updatedAt: null,
    etag: "case-v1",
    ...extra,
  };
}

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("executor-workspace-fixture");
  window.sessionStorage.clear();
  window.localStorage.clear();
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
        id: "11111111-1111-4111-8111-111111111111",
        fullName: "Chú Hải",
        email: "hai@example.test",
        role: "USER",
        status: "ACTIVE",
        createdAt: "2026-10-15T00:00:00Z",
        emailVerified: true,
        hasPassword: true,
      },
    }),
  );
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/executor" element={<ExecutorOverviewPage />} />
            <Route path="/executor/report" element={<ExecutorReportPage />} />
            <Route path="/executor/progress" element={<ExecutorProgressPage />} />
            <Route path="/executor/assets" element={<ExecutorAssetsPage />} />
            <Route
              path="/executor/permissions"
              element={
                <ExecutorWorkspace title="Quyền hạn của bạn">
                  <ExecutorPermissionsSection />
                </ExecutorWorkspace>
              }
            />
            <Route path="/dashboard" element={<p>Không gian Chủ kho (fixture)</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("Executor workspace shell", () => {
  it("shows the four main menu items, the account links, the role switch and the account", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor");
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người thực thi" });
    expect(Array.from(nav.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Tổng quan",
      "Báo tin",
      "Bàn giao",
      "Tài sản",
    ]);
    const account = screen.getByRole("navigation", { name: "Tài khoản" });
    expect(Array.from(account.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Cài đặt",
    ]);
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Sang vai Chủ kho" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByText("Người thực thi")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Chào Chú Hải" }),
    ).toBeInTheDocument();
  });
});

describe("Executor overview after the Owner checks in", () => {
  it("shows a green success notice once the Owner has checked in on his own", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ lastOwnerCheckInAt: "2026-11-07T08:30:00Z" }),
    ]);
    setup("/executor");

    expect(await screen.findByText("Anh Nam đã điểm danh thành công")).toBeInTheDocument();
    expect(screen.getByText(/Lần gần nhất/)).toBeInTheDocument();
    expect(screen.queryByText("Kho của Anh Nam đang an toàn")).not.toBeInTheDocument();
  });

  it("keeps the plain safe notice when the Owner has never checked in", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault({ lastOwnerCheckInAt: null })]);
    setup("/executor");

    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    expect(screen.queryByText(/đã điểm danh thành công/)).not.toBeInTheDocument();
  });

  it("does not claim a check-in while the Owner is overdue", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({
        planStatus: "AWAITING_CHECK",
        checkInOverdue: true,
        lastOwnerCheckInAt: "2026-09-01T08:30:00Z",
      }),
    ]);
    setup("/executor");

    expect(await screen.findByText("Anh Nam đã quá hạn điểm danh")).toBeInTheDocument();
    expect(screen.queryByText(/đã điểm danh thành công/)).not.toBeInTheDocument();
  });
});

describe("Executor assets", () => {
  it("lists the packages with recipients and assets, without any view or download button", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault()];
      if (url === `/executor/vaults/${VAULT_ID}/assets`) {
        return [
          {
            containerId: "66666666-6666-4666-8666-666666666666",
            containerName: "Gói gia đình",
            recipients: [{ fullName: "Trần Minh Anh", citizenIdLast4: "0791" }],
            assets: [
              {
                id: "77777777-7777-4777-8777-777777777777",
                name: "Email gia đình",
                kind: "TEXT",
                sizeBytes: 640,
              },
              {
                id: "88888888-8888-4888-8888-888888888888",
                name: "Sổ tiết kiệm",
                kind: "FILE",
                sizeBytes: 2457600,
              },
            ],
          },
        ];
      }
      return [];
    });
    setup("/executor/assets");

    expect(await screen.findByText("Gói gia đình")).toBeInTheDocument();
    expect(screen.getByText(/Giao cho Trần Minh Anh/)).toBeInTheDocument();
    expect(screen.getByText("Email gia đình")).toBeInTheDocument();
    expect(screen.getByText(/Tệp · 2.3 MB/)).toBeInTheDocument();
    expect(screen.getByText("Bạn chỉ thấy danh sách")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xem|Tải/ })).not.toBeInTheDocument();
  });

  it("says so when the vault has no package ready", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault()];
      return [];
    });
    setup("/executor/assets");

    expect(await screen.findByText("Chưa có gói bàn giao")).toBeInTheDocument();
  });

  it("offers a retry when the list cannot be loaded", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault()];
      throw new Error("boom");
    });
    setup("/executor/assets");

    expect(await screen.findByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("Executor notification bell", () => {
  it("shows no bell while the vault is safe and has no case", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor");
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Thông báo/ })).not.toBeInTheDocument();
  });

  it("counts unread items for an overdue Owner and clears the count once opened", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true }),
    ]);
    setup("/executor");
    const bell = await screen.findByRole("button", { name: "Thông báo, 1 mới" });
    await userEvent.click(bell);
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Anh Nam đã quá hạn điểm danh. Tới lượt bạn."),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Đóng" }));
    expect(await screen.findByRole("button", { name: "Thông báo" })).toBeInTheDocument();
  });
});

describe("Executor overview", () => {
  it("explains the vault is safe and links to Báo tin when the Owner is not overdue", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor");
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    const reportLinks = screen.getAllByRole("link", { name: "Báo tin" });
    expect(reportLinks).toHaveLength(2); // mục menu và nút trong banner
    reportLinks.forEach((link) => expect(link).toHaveAttribute("href", "/executor/report"));
    expect(screen.getByText("Bạn không đọc được")).toBeInTheDocument();
    expect(screen.getByText("Đọc nội dung kho")).toBeInTheDocument();
    expect(screen.getAllByText("Người thực thi").length).toBeGreaterThan(0);
  });

  it("warns when the Owner is overdue and points to the open case", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ checkInOverdue: true, openDeathCaseId: CASE_ID }),
    ]);
    setup("/executor");
    expect(await screen.findByText("Anh Nam đã quá hạn điểm danh")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem hồ sơ báo tin" })).toBeInTheDocument();
    // Đã có hồ sơ chứng tử thì không điểm danh thay nữa.
    expect(
      screen.queryByRole("button", { name: "Điểm danh thay chủ kho" }),
    ).not.toBeInTheDocument();
  });

  it("does not call the vault safe once a death case is open", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ planStatus: "DEATH_CASE_OPEN", openDeathCaseId: CASE_ID }),
    ]);
    setup("/executor");
    expect(await screen.findByText("Hồ sơ báo tin về Anh Nam đang được xử lý")).toBeInTheDocument();
    expect(screen.queryByText("Kho của Anh Nam đang an toàn")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem hồ sơ báo tin" })).toBeInTheDocument();
  });

  it("says the case was rejected instead of calling the vault safe or still processing", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault({ lastRejectedDeathCaseId: CASE_ID })]);
    setup("/executor");
    expect(await screen.findByText("Hồ sơ báo tin về Anh Nam đã bị từ chối")).toBeInTheDocument();
    expect(screen.queryByText("Kho của Anh Nam đang an toàn")).not.toBeInTheDocument();
    expect(screen.queryByText("Hồ sơ báo tin về Anh Nam đang được xử lý")).not.toBeInTheDocument();
    // Không còn nút "Xem lý do": banner đỏ chỉ có "Tiếp tục".
    expect(screen.queryByRole("link", { name: "Xem lý do" })).not.toBeInTheDocument();
    // Hồ sơ bị từ chối là đã xử lý xong: bấm Tiếp tục thì banner trở lại màu xanh "an toàn".
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    expect(screen.queryByText("Hồ sơ báo tin về Anh Nam đã bị từ chối")).not.toBeInTheDocument();
  });

  it("shows the rejected banner before the overdue banner, then the overdue one after Tiếp tục", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({
        planStatus: "AWAITING_CHECK",
        checkInOverdue: true,
        lastRejectedDeathCaseId: OVERDUE_REJECTED_CASE_ID,
      }),
    ]);
    setup("/executor");
    expect(await screen.findByText("Hồ sơ báo tin về Anh Nam đã bị từ chối")).toBeInTheDocument();
    expect(screen.queryByText("Anh Nam đã quá hạn điểm danh")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findByText("Anh Nam đã quá hạn điểm danh")).toBeInTheDocument();
    expect(screen.queryByText("Hồ sơ báo tin về Anh Nam đã bị từ chối")).not.toBeInTheDocument();
  });

  it("hides the proxy check-in while the Owner is not overdue", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor");
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Điểm danh thay chủ kho" }),
    ).not.toBeInTheDocument();
  });

  it("checks in for the overdue Owner and hides the button once the vault is safe again", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce([vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true })])
      .mockResolvedValue([vault()]);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      vaultId: VAULT_ID,
      planStatus: "ACTIVE",
      checkedInAt: "2026-10-31T01:00:00Z",
      nextCheckInDueAt: "2026-11-30T01:00:00Z",
      graceEndsAt: "2026-12-07T01:00:00Z",
    });
    setup("/executor");
    const button = await screen.findByRole("button", { name: "Điểm danh thay chủ kho" });
    expect(
      screen.getByText("Điểm danh hộ Chủ kho cho đến khi có giấy chứng tử."),
    ).toBeInTheDocument();

    await userEvent.click(button);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("không hoàn tác được");
    expect(post).not.toHaveBeenCalled();
    await userEvent.type(within(dialog).getByLabelText("Đã liên lạc với ai"), "Chị Lan (vợ)");
    await userEvent.click(within(dialog).getByRole("button", { name: "Xác nhận điểm danh thay" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/executor/vaults/${VAULT_ID}/check-in`, {
        contactedWho: "Chị Lan (vợ)",
        contactedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        contactMethod: "PHONE",
      }),
    );
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Điểm danh thay chủ kho" }),
    ).not.toBeInTheDocument();
    // Khung còn gọi GET lời mời cho mục Lời mời; chỉ đếm các lần tải danh sách kho.
    const vaultLoads = get.mock.calls.filter(([url]) => url === "/executor/vaults");
    expect(vaultLoads).toHaveLength(2);
  });

  it("does not check in when the Executor cancels the confirmation", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true }),
    ]);
    const post = vi.spyOn(apiClient, "post");
    setup("/executor");

    await userEvent.click(await screen.findByRole("button", { name: "Điểm danh thay chủ kho" }));
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Hủy" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Điểm danh thay chủ kho" })).toBeInTheDocument();
  });

  it("explains why the proxy check-in was refused", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true }),
    ]);
    const headers = new AxiosHeaders();
    vi.spyOn(apiClient, "post").mockRejectedValue(
      new AxiosError("fail", "ERR", { headers }, undefined, {
        status: 409,
        statusText: "",
        headers: {},
        config: { headers },
        data: { code: "CHECKIN_NOT_ALLOWED", reason: "DEATH_CASE_OPEN" },
      }),
    );
    setup("/executor");

    await userEvent.click(await screen.findByRole("button", { name: "Điểm danh thay chủ kho" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Đã liên lạc với ai"), "Chính Chủ kho");
    await userEvent.click(within(dialog).getByRole("button", { name: "Xác nhận điểm danh thay" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kho đã có hồ sơ chứng tử đang mở nên không điểm danh thay được nữa.",
    );
  });

  it("explains that the consecutive proxy limit was reached", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true }),
    ]);
    const headers = new AxiosHeaders();
    vi.spyOn(apiClient, "post").mockRejectedValue(
      new AxiosError("fail", "ERR", { headers }, undefined, {
        status: 409,
        statusText: "",
        headers: {},
        config: { headers },
        data: { code: "CHECKIN_NOT_ALLOWED", reason: "PROXY_LIMIT_REACHED" },
      }),
    );
    setup("/executor");

    await userEvent.click(await screen.findByRole("button", { name: "Điểm danh thay chủ kho" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Đã liên lạc với ai"), "Chính Chủ kho");
    await userEvent.click(within(dialog).getByRole("button", { name: "Xác nhận điểm danh thay" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("đủ số lần liên tiếp cho phép");
  });

  it("asks who was contacted before checking in for the Owner", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true }),
    ]);
    const post = vi.spyOn(apiClient, "post");
    setup("/executor");

    await userEvent.click(await screen.findByRole("button", { name: "Điểm danh thay chủ kho" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Xác nhận điểm danh thay" }));

    expect(await within(dialog).findByText(/Ghi rõ đã liên lạc với ai/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("shows how many proxy turns are left and locks the button when none remain", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({
        planStatus: "AWAITING_CHECK",
        checkInOverdue: true,
        proxyCheckInLimit: 3,
        proxyCheckInsUsed: 3,
        proxyCheckInsLeft: 0,
      }),
    ]);
    setup("/executor");

    expect(await screen.findByText("Còn 0/3 lượt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh thay chủ kho" })).toBeDisabled();
    expect(screen.getByText(/Hết lượt điểm danh thay liên tiếp/)).toBeInTheDocument();
  });

  it("shows the turns that remain for the proxy check-in", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({
        planStatus: "AWAITING_CHECK",
        checkInOverdue: true,
        proxyCheckInLimit: 3,
        proxyCheckInsUsed: 1,
        proxyCheckInsLeft: 2,
      }),
    ]);
    setup("/executor");

    expect(await screen.findByText("Còn 2/3 lượt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh thay chủ kho" })).toBeEnabled();
  });

  it("says there is no duty when the account is not an Executor of any vault", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup("/executor");
    expect(
      await screen.findByText("Tài khoản chưa có nhiệm vụ Executor đang hiệu lực."),
    ).toBeInTheDocument();
  });

  it("lists several vaults with their task, overdue first, and remembers the opened one", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault(),
      vault({ vaultId: OTHER_VAULT_ID, ownerFullName: "Bà Hạnh", checkInOverdue: true }),
    ]);
    setup("/executor");
    expect(await screen.findByText("Bạn là Người thực thi cho 2 kho.")).toBeInTheDocument();
    expect(screen.getByText("1 kho đang cần bạn")).toBeInTheDocument();
    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(names.indexOf("Bà Hạnh")).toBeLessThan(names.indexOf("Anh Nam"));
    expect(screen.getByRole("button", { name: "Liên hệ kiểm tra" })).toBeInTheDocument();
    expect(screen.getByText("Chưa có việc gì")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mở kho của Anh Nam" }));
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("lv-executor-vault")).toBe(VAULT_ID);
  });

  it("reports a failed vault list with a retry instead of an empty page", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("down"));
    setup("/executor");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được các kho");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("Executor permissions", () => {
  it("lists what the Executor can and cannot do and the accepted invitations", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor/permissions");
    expect(await screen.findByText("Anh Nam mời bạn làm Executor")).toBeInTheDocument();
    expect(screen.getByText("Xem ghi chú của Chủ kho")).toBeInTheDocument();
    expect(screen.getByText("Điểm danh thay khi Chủ kho trễ điểm danh")).toBeInTheDocument();
    expect(screen.getByText("Làm người nhận trong kho này")).toBeInTheDocument();
    expect(screen.getByText("Đọc nội dung kho")).toBeInTheDocument();
    expect(screen.getByText("Đã chấp nhận")).toBeInTheDocument();
    expect(screen.getByText(/hãy báo cho Anh Nam/)).toBeInTheDocument();
  });
});

describe("Executor report", () => {
  it("opens a case only after the Executor presses the button", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(deathCase("DRAFT"));
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault()]);
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    expect(await screen.findByText("Hãy chắc chắn trước khi báo tin")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Mở hồ sơ chứng tử" }));
    expect(post).toHaveBeenCalledWith(`/executor/vaults/${VAULT_ID}/death-case`);
  });

  it("cancels a draft only after confirming, then goes back to the overview", async () => {
    let open = true;
    const remove = vi.spyOn(apiClient, "delete").mockImplementation(() => {
      open = false;
      return Promise.resolve(undefined);
    });
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") {
        return Promise.resolve([vault({ openDeathCaseId: open ? CASE_ID : null })]);
      }
      if (url === `/executor/death-cases/${CASE_ID}`) return Promise.resolve(deathCase("DRAFT"));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    await userEvent.click(await screen.findByRole("button", { name: "Hủy hồ sơ nháp" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("không khôi phục được");
    expect(remove).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Hủy hồ sơ nháp" }));
    await waitFor(() =>
      expect(remove).toHaveBeenCalledWith(`/executor/death-cases/${CASE_ID}/draft`),
    );
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the draft when the Executor backs out, and shows no cancel button once submitted", async () => {
    const remove = vi.spyOn(apiClient, "delete");
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`) return Promise.resolve(deathCase("DRAFT"));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    await userEvent.click(await screen.findByRole("button", { name: "Hủy hồ sơ nháp" }));
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Giữ hồ sơ" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(remove).not.toHaveBeenCalled();
    cleanup();
    client.clear();

    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`)
        return Promise.resolve(deathCase("UNDER_REVIEW"));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hủy hồ sơ nháp" })).not.toBeInTheDocument();
  });

  it("explains the supplement while under review and confirms the new draft version", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(
      deathCase("UNDER_REVIEW", {
        currentVersion: { ...deathCase("DRAFT").currentVersion, versionNo: 2 },
        reviewVersionNo: 1,
        etag: "case-v2",
      }),
    );
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`) {
        return Promise.resolve(deathCase("UNDER_REVIEW", { reviewVersionNo: 1 }));
      }
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    expect(
      await screen.findByText(/Người xét duyệt vẫn xét bản đã nộp cho tới khi bạn nộp bản mới/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Máy chủ đã lưu yêu cầu/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tạo bản bổ sung" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Người xét duyệt chưa duyệt được hồ sơ");
    expect(post).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Hủy" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(post).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Tạo bản bổ sung" }));
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Tạo bản bổ sung" }),
    );

    expect(post).toHaveBeenCalledWith(`/executor/death-cases/${CASE_ID}/versions`, {
      etag: "case-v1",
    });
    expect(await screen.findByText(/Đã tạo bản bổ sung số 2/)).toBeInTheDocument();
  });

  it("hides the supplement button once the case is closed", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`)
        return Promise.resolve(deathCase("SUSPENDED"));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    expect(
      await screen.findByText("Hồ sơ đã đóng nên không sửa hay bổ sung được nữa."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tạo bản bổ sung" })).not.toBeInTheDocument();
  });

  const certificateFile = {
    id: "55555555-5555-4555-8555-555555555555",
    position: 1,
    kind: "DEATH_CERTIFICATE" as const,
    fileName: "giay-chung-tu.pdf",
    contentType: "application/pdf",
    sizeBytes: 1200000,
    uploadedAt: CREATED_AT,
  };

  it("shows the one-page report with two document rows and keeps submit disabled", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`)
        return Promise.resolve(deathCase("DRAFT", { missingRequirements: ["FILES"] }));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Soạn hồ sơ báo tin" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Giấy chứng tử / Trích lục khai tử")).toBeInTheDocument();
    expect(screen.getByText("Giấy báo tử hoặc giấy tờ thay thế")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ngày mất")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nộp hồ sơ" })).toBeDisabled();
  });

  it("rejects a file of an unsupported type before sending anything", async () => {
    const post = vi.spyOn(apiClient, "post");
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`) return Promise.resolve(deathCase("DRAFT"));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    const input = await screen.findByLabelText("Chọn tệp: Giấy chứng tử / Trích lục khai tử");
    fireEvent.change(input, {
      target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Chọn tệp PDF, JPG, PNG hoặc WEBP");
    expect(post).not.toHaveBeenCalled();
  });

  it("uploads a certificate with its kind and shows it in the row", async () => {
    const withFile = deathCase("DRAFT", {
      missingRequirements: [],
      currentVersion: { ...deathCase("DRAFT").currentVersion, files: [certificateFile] },
    });
    let uploaded = false;
    const post = vi.spyOn(apiClient, "post").mockImplementation(() => {
      uploaded = true;
      return Promise.resolve(withFile);
    });
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`)
        return Promise.resolve(uploaded ? withFile : deathCase("DRAFT"));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    const input = await screen.findByLabelText("Chọn tệp: Giấy chứng tử / Trích lục khai tử");
    fireEvent.change(input, {
      target: { files: [new File(["%PDF"], "giay-chung-tu.pdf", { type: "application/pdf" })] },
    });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe(`/executor/death-cases/${CASE_ID}/files`);
    const body = post.mock.calls[0][1] as FormData;
    expect(body.get("kind")).toBe("DEATH_CERTIFICATE");
    expect(await screen.findByText("giay-chung-tu.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thay tệp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xóa tệp giay-chung-tu.pdf" })).toBeInTheDocument();
  });

  it("asks for confirmation before submitting and then shows the receipt", async () => {
    const draft = deathCase("DRAFT", {
      missingRequirements: [],
      currentVersion: { ...deathCase("DRAFT").currentVersion, files: [certificateFile] },
    });
    const submitted = deathCase("UNDER_REVIEW", {
      currentVersion: {
        ...draft.currentVersion,
        isDraft: false,
        submittedAt: CREATED_AT,
      },
    });
    let sent = false;
    const post = vi.spyOn(apiClient, "post").mockImplementation(() => {
      sent = true;
      return Promise.resolve(submitted);
    });
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`)
        return Promise.resolve(sent ? submitted : draft);
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    const submitButton = await screen.findByRole("button", { name: "Nộp hồ sơ" });
    expect(submitButton).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox"));
    expect(submitButton).toBeEnabled();
    await userEvent.click(submitButton);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Không hoàn tác được");
    expect(post).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Xác nhận nộp" }));
    expect(await screen.findByText("Giấy tiếp nhận hồ sơ")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith(`/executor/death-cases/${CASE_ID}/submit`, {
      etag: "case-v1",
      confirm: true,
    });
  });

  it("titles a supplement request and lists the versions already submitted", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`)
        return Promise.resolve(
          deathCase("SUPPLEMENT_REQUIRED", {
            currentVersion: {
              ...deathCase("UNDER_REVIEW").currentVersion,
              versionNo: 2,
              isDraft: true,
            },
            missingRequirements: ["FILES"],
            supplementRequest: {
              versionNo: 1,
              reason: "Ảnh bị mờ",
              requestedParts: ["FILES"],
              requestedAt: CREATED_AT,
              dueAt: null,
            },
          }),
        );
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Nộp bản bổ sung" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cần bổ sung")).toBeInTheDocument();
    expect(screen.getByText("Bản 1 · gửi lần đầu")).toBeInTheDocument();
    expect(screen.getByText("Bản 2 · bổ sung")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nộp bản bổ sung" })).toBeInTheDocument();
  });
});

describe("Executor progress", () => {
  it("guides the Executor to Báo tin when no case exists yet", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor/progress");
    expect(await screen.findByText("Bước hiện tại")).toBeInTheDocument();
    expect(
      screen.getByText("Chưa có hồ sơ báo tin. Tiến trình bắt đầu sau khi bạn gửi hồ sơ."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đi tới Báo tin" })).toHaveAttribute(
      "href",
      "/executor/report",
    );
  });
});

describe("progress steps", () => {
  const record = (status: string, extra: Record<string, unknown> = {}) =>
    deathCase(status, extra) as unknown as DeathCase;
  const states = (steps: ReturnType<typeof deriveSteps>) => steps.map((step) => step.state);

  it("starts at the first step while the case is a draft", () => {
    expect(states(deriveSteps(record("DRAFT"), null))).toEqual([
      "current",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("có 5 bước, không còn bước phản đối; hồ sơ đã nộp nằm ở bước xét duyệt", () => {
    const steps = deriveSteps(record("UNDER_REVIEW"), null);
    expect(steps.map((step) => step.label)).toEqual([
      "Báo tin",
      "Xét duyệt",
      "Xác minh eKYC",
      "Đồng ý hoặc từ chối",
      "Tải nội dung 30 ngày",
    ]);
    expect(states(steps)).toEqual(["done", "current", "pending", "pending", "pending"]);
  });

  it("marks the review step as an error when the case is rejected", () => {
    expect(states(deriveSteps(record("REJECTED"), null))).toEqual([
      "done",
      "error",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("hồ sơ đã duyệt: 3 bước cuối theo đúng người nhận đang xem", () => {
    const approved = record("APPROVED_FOR_HANDOVER");
    const turnOf = (status: string, downloaded = 0) =>
      ({
        turnId: "55555555-5555-4555-8555-555555555555",
        status,
        totalItems: 1,
        downloadedItems: downloaded,
      }) as unknown as HandoverProgressTurn;
    // Người nhận A đã đồng ý và tải xong; người nhận B còn chờ phản hồi lời mời.
    expect(states(deriveSteps(approved, null, 30, turnOf("HANDOVER_COMMITTED", 1)))).toEqual([
      "done",
      "done",
      "done",
      "done",
      "done",
    ]);
    expect(states(deriveSteps(approved, null, 30, turnOf("INVITED")))).toEqual([
      "done",
      "done",
      "current",
      "pending",
      "pending",
    ]);
    expect(states(deriveSteps(approved, null, 30, turnOf("READY_TO_ACCEPT")))[3]).toBe("current");
    const declined = deriveSteps(approved, null, 30, turnOf("DECLINED"));
    expect(declined[3]).toMatchObject({ state: "error", caption: "Đã từ chối" });
    expect(declined[4].state).toBe("pending");
  });

  it("derives the log newest first from the timestamps Backend returns", () => {
    const log = deriveLog(
      record("UNDER_REVIEW", {
        createdAt: "2026-10-18T08:00:00Z",
        ownerNotice: { status: "DELIVERED", deliveredAt: "2026-10-20T07:00:00Z" },
        currentVersion: {
          ...deathCase("UNDER_REVIEW").currentVersion,
          submittedAt: "2026-10-19T08:00:00Z",
        },
      }),
    );
    expect(log.map((entry) => entry.text)).toEqual([
      "Hệ thống đã nhắn cho Chủ kho",
      "Bạn gửi hồ sơ (bản 1)",
      "Bạn mở hồ sơ báo tin",
    ]);
  });
});
