import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { AxiosError, AxiosHeaders } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { ExecutorOverviewPage } from "@/pages/executor/ExecutorOverviewPage";
import { ExecutorPermissionsSection } from "@/pages/executor/ExecutorPermissionsPage";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";
import { ExecutorReportPage } from "@/pages/executor/ExecutorReportPage";
import { ExecutorProgressPage } from "@/pages/executor/ExecutorProgressPage";
import { ExecutorAssetsPage } from "@/pages/executor/ExecutorAssetsPage";

const RECORD_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_VAULT_ID = "44444444-4444-4444-8444-444444444444";

const vault = (overrides: Record<string, unknown> = {}) => ({
  vaultId: VAULT_ID,
  ownerFullName: "Anh Nam",
  planStatus: "ACTIVE",
  handoverRecordId: null,
  handoverRecordStatus: "",
  ...overrides,
});

/** Biên bản bàn giao Backend trả cho Người thực thi. */
function record(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: RECORD_ID,
    vaultId: VAULT_ID,
    vaultName: "Tài sản gia đình",
    ownerName: "Anh Nam",
    status,
    revisionNo: 1,
    requestedAt: CREATED_AT,
    finalizedAt: status === "DRAFTING" ? null : CREATED_AT,
    completedAt: status === "COMPLETED" ? CREATED_AT : null,
    verifierName: "Luật sư Dũng",
    executorName: "Chú Hải",
    verifierSignedAt: null,
    executorSignedAt: null,
    recipients: [
      {
        beneficiaryId: "66666666-6666-4666-8666-666666666666",
        fullName: "Trần Minh Anh",
        citizenId: "0791",
        assets: [
          { assetId: "77777777-7777-4777-8777-777777777777", name: "Email gia đình", kind: "TEXT" },
        ],
        turnId: null,
        turnStatus: "",
        claimed: false,
        submissionId: null,
        submissionStatus: "",
        identityConfirmedAt: null,
        signedAt: null,
      },
    ],
    canSign: false,
    availableAssets: [],
    availableRecipients: [],
    ownerSplit: [],
    ...extra,
  };
}

/** GET giả: danh sách kho, biên bản của kho (chưa có yêu cầu nhận thì Backend trả 204, body rỗng). */
function mockGets(vaults: unknown[], recordBody: unknown = "") {
  return vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url === "/executor/vaults") return vaults;
    if (url === `/executor/vaults/${VAULT_ID}/handover-record`) return recordBody;
    return [];
  });
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
            <Route path="/dashboard" element={<p>Không gian Chủ tài sản (fixture)</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("Executor workspace shell", () => {
  it("shows the five main menu items, the account links, the role switch and the account", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor");
    await screen.findByRole("link", { name: "Đổi tài sản →" });
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người thực thi" });
    expect(Array.from(nav.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Đổi tài sản →",
      "Tổng quan",
      "Biên bản bàn giao",
      "Bàn giao",
      "Tài sản và hướng dẫn",
      "Cài đặt",
      // Mục chỉ hiện dưới 768px, thay cho chân thanh bên bị ẩn trên điện thoại.
      "Lời mời và tài sản",
    ]);
    const account = screen.getByRole("navigation", { name: "Tài khoản" });
    expect(Array.from(account.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Lời mời và tài sản",
    ]);
    expect(screen.queryByRole("link", { name: "Xác minh" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
    // Người thực thi là nhân sự của hệ thống: không chuyển sang vai khác.
    expect(screen.queryByRole("link", { name: /Sang vai/ })).not.toBeInTheDocument();
    expect(screen.getByText("Người thực thi")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Tài sản của Anh Nam" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Bạn là Người thực thi của tài sản này. Bạn không đọc được nội dung tài sản.",
      ),
    ).toBeInTheDocument();
  });

  it("menu trái chỉ có một thẻ tài sản đang làm việc, không bấm được, và Đổi tài sản → dẫn tới trang lời mời", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({
        planStatus: "HANDOVER_IN_PROGRESS",
        handoverRecordId: RECORD_ID,
        handoverRecordStatus: "IDENTITY_CHECK",
      }),
      vault({ vaultId: OTHER_VAULT_ID, ownerFullName: "Bà Hạnh", planStatus: "CLOSED" }),
    ]);
    setup("/executor");
    const group = await screen.findByRole("region", { name: "Đang làm việc với tài sản" });
    const card = await within(group).findByRole("group", {
      name: "Tài sản đang làm việc: Anh Nam",
    });
    expect(card).toHaveTextContent("Đang ký biên bản");
    // Không còn danh sách kho để bấm chuyển trong menu.
    expect(screen.queryByRole("button", { name: "Tài sản của Bà Hạnh" })).not.toBeInTheDocument();
    expect(within(group).queryByRole("button")).not.toBeInTheDocument();
    expect(within(group).getByRole("link", { name: "Đổi tài sản →" })).toHaveAttribute(
      "href",
      "/executor/invitations",
    );
    // Tiêu đề nhóm menu bên dưới.
    expect(screen.getByText("Tài sản này")).toBeInTheDocument();
    expect(screen.queryByText("Mở khi bạn nhận một tài sản")).not.toBeInTheDocument();
  });

  it("chưa chọn tài sản nào thì tự chọn tài sản đầu tiên; tài sản đã nhớ trong phiên thì dùng tài sản đó", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault(),
      vault({ vaultId: OTHER_VAULT_ID, ownerFullName: "Bà Hạnh" }),
    ]);
    setup("/executor");
    expect(
      await screen.findByRole("group", { name: "Tài sản đang làm việc: Anh Nam" }),
    ).toBeInTheDocument();
    cleanup();
    window.sessionStorage.setItem("lv-executor-vault", OTHER_VAULT_ID);
    setup("/executor");
    expect(
      await screen.findByRole("group", { name: "Tài sản đang làm việc: Bà Hạnh" }),
    ).toBeInTheDocument();
  });

  it("không có tài sản nào: không hiện thẻ tài sản, ba mục cần tài sản vẫn hiện nhưng khóa", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup("/executor");
    expect(await screen.findByRole("heading", { name: "Chưa có tài sản nào" })).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Đang làm việc với tài sản" }),
    ).not.toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người thực thi" });
    expect(Array.from(nav.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Tổng quan",
      "Cài đặt",
      "Lời mời và tài sản",
    ]);
    expect(within(nav).getByText("Tài sản này")).toBeInTheDocument();
    for (const name of ["Biên bản bàn giao", "Bàn giao", "Tài sản và hướng dẫn"]) {
      const locked = within(nav).getByRole("link", { name });
      expect(locked).toHaveAttribute("aria-disabled", "true");
      expect(locked).not.toHaveAttribute("href");
      expect(locked).toHaveAccessibleDescription("Mở khi bạn nhận một tài sản");
    }
  });

  it("shows the pending invitation count on Lời mời và tài sản and hides it at zero", async () => {
    const mine = (pending: unknown[]) => ({
      scopeVersion: "v1",
      scopeText: "scope",
      pending,
      ended: [],
    });
    const invitation = {
      id: "99999999-9999-4999-8999-999999999999",
      ownerName: "Cô Lan",
      inviteeEmail: "hai@example.test",
      status: "INVITED",
      invitedAt: "2026-11-01T03:00:00Z",
      expiresAt: "2026-11-20T03:00:00Z",
      endedAt: null,
    };
    let pending: unknown[] = [invitation];
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault()];
      if (url.includes("executor-invitations")) return mine(pending);
      return [];
    });
    setup("/executor");
    const account = await screen.findByRole("navigation", { name: "Tài khoản" });
    const link = within(account).getByRole("link", { name: /Lời mời và tài sản/ });
    expect(await within(link).findByLabelText("1 lời mời đang chờ")).toBeInTheDocument();
    cleanup();
    client.clear();
    pending = [];
    setup("/executor");
    const emptyAccount = await screen.findByRole("navigation", { name: "Tài khoản" });
    const emptyLink = within(emptyAccount).getByRole("link", { name: /Lời mời và tài sản/ });
    await screen.findByRole("heading", { level: 1, name: "Tài sản của Anh Nam" });
    expect(within(emptyLink).queryByLabelText(/lời mời đang chờ/)).not.toBeInTheDocument();
  });
});

describe("Executor assets", () => {
  it("lists the recipients with their assets, without any view or download button", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault({ planStatus: "HANDOVER_IN_PROGRESS" })];
      if (url === `/executor/vaults/${VAULT_ID}/assets`) {
        return [
          {
            beneficiaryId: "66666666-6666-4666-8666-666666666666",
            fullName: "Trần Minh Anh",
            citizenId: "0791",
            assets: [
              {
                id: "77777777-7777-4777-8777-777777777777",
                name: "Email gia đình",
                kind: "TEXT",
                sizeBytes: 640,
                sharedWithCount: 1,
              },
              {
                id: "88888888-8888-4888-8888-888888888888",
                name: "Sổ tiết kiệm",
                kind: "FILE",
                sizeBytes: 2457600,
                sharedWithCount: 2,
              },
            ],
          },
        ];
      }
      return [];
    });
    setup("/executor/assets");

    expect(await screen.findByRole("heading", { name: "Trần Minh Anh" })).toBeInTheDocument();
    expect(screen.getByText("Email gia đình")).toBeInTheDocument();
    expect(screen.getByText("Sổ tiết kiệm")).toBeInTheDocument();
    expect(screen.getByText("2 tài sản cho 1 người nhận")).toBeInTheDocument();
    expect(screen.getByText(/Nhận chung với 1 người/)).toBeInTheDocument();
    // Chưa có lượt bàn giao: người nhận "Chưa bàn giao", từng tài sản "Chưa tải".
    expect(screen.getByText("Chưa bàn giao")).toBeInTheDocument();
    expect(screen.getAllByText("Chưa tải")).toHaveLength(2);
    expect(screen.getByText("Chủ tài sản chưa để lại hướng dẫn.")).toBeInTheDocument();
    expect(screen.getByText(/Nội dung chỉ người nhận mở được/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xem|Tải/ })).not.toBeInTheDocument();
  });

  it("says so when no asset is assigned yet", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault()];
      return [];
    });
    setup("/executor/assets");

    expect(await screen.findByText("Chưa có tài sản nào được gán")).toBeInTheDocument();
  });

  it("chưa bàn giao: hiện tên, loại tài sản và hướng dẫn, không báo lỗi, không có người nhận", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault()];
      if (url === `/executor/vaults/${VAULT_ID}/assets`) {
        throw new AxiosError("not started", AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
          status: 409,
          statusText: "Conflict",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { code: "HANDOVER_NOT_ALLOWED", reason: "HANDOVER_NOT_STARTED" },
        });
      }
      if (url === `/executor/vaults/${VAULT_ID}/asset-names`) {
        return [
          { name: "Email gia đình", kind: "TEXT" },
          { name: "Sổ tiết kiệm", kind: "FILE" },
        ];
      }
      return [];
    });
    setup("/executor/assets");

    expect(await screen.findByText("Email gia đình")).toBeInTheDocument();
    expect(screen.getByText("Sổ tiết kiệm")).toBeInTheDocument();
    expect(screen.getByText("Ghi chú bí mật")).toBeInTheDocument();
    expect(screen.getByText("Tệp tải lên")).toBeInTheDocument();
    expect(screen.getByText("Chủ tài sản chưa để lại hướng dẫn.")).toBeInTheDocument();
    expect(
      screen.getByText(/Danh sách bàn giao chính thức hiện sau khi luật sư/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thử lại|Xem|Tải/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/CCCD/)).not.toBeInTheDocument();
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

describe("Executor overview", () => {
  it("chưa có yêu cầu nhận: chưa có việc, không có chuông", async () => {
    mockGets([vault()]);
    setup("/executor");
    expect(
      await screen.findByRole("heading", { name: "Chưa có yêu cầu nhận tài sản" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở Biên bản bàn giao" })).toHaveAttribute(
      "href",
      "/executor/report",
    );
    expect(screen.queryByRole("button", { name: /^Thông báo/ })).not.toBeInTheDocument();
  });

  it("biên bản đang chờ bạn ký: việc là ký và chuông báo một tin mới", async () => {
    mockGets(
      [vault({ handoverRecordId: RECORD_ID, handoverRecordStatus: "SIGNING" })],
      record("SIGNING", { canSign: true }),
    );
    setup("/executor");
    expect(
      await screen.findByRole("heading", { name: "Ký biên bản bàn giao" }),
    ).toBeInTheDocument();
    const bell = await screen.findByRole("button", { name: /Thông báo, \d+ mới/ });
    await userEvent.click(bell);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Đến lượt bạn ký biên bản")).toBeInTheDocument();
  });

  it("says there is no vault when the account is not an Executor of any vault", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup("/executor");
    expect(await screen.findByText("Lời mời mới sẽ hiện ở trang Tổng quan.")).toBeInTheDocument();
  });

  it("chưa giữ tài sản mà có lời mời chờ: hiện khung mời, không hiện thẻ Chưa có tài sản nào", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url.includes("executor-invitations")) {
        return {
          scopeVersion: "v1",
          scopeText: "scope",
          pending: [
            {
              id: "99999999-9999-4999-8999-999999999999",
              ownerName: "Cô Lan",
              inviteeEmail: "hai@example.test",
              status: "INVITED",
              invitedAt: "2026-11-01T03:00:00Z",
              expiresAt: "2026-11-20T03:00:00Z",
              endedAt: null,
            },
          ],
          ended: [],
        };
      }
      return [];
    });
    setup("/executor");
    const banner = await screen.findByRole("region", { name: "Lời mời làm Người thực thi" });
    expect(banner).toHaveTextContent("Cô Lan mời bạn làm Người thực thi");
    expect(within(banner).getByRole("link", { name: "Xem lời mời" })).toHaveAttribute(
      "href",
      "/executor/invitations",
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Chưa có tài sản nào" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("reports a failed vault list with a retry instead of an empty page", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("down"));
    setup("/executor");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được các tài sản");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("Executor permissions", () => {
  it("lists what the Executor can and cannot do", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor/permissions");
    expect(await screen.findByText("Xem ghi chú của Chủ tài sản")).toBeInTheDocument();
    expect(
      screen.getByText("Nhận thông báo khi người nhận gửi yêu cầu nhận tài sản"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tự chia, bán, cho tài sản hoặc đổi người nhận")).toBeInTheDocument();
    expect(screen.getByText("Đọc nội dung tài sản")).toBeInTheDocument();
  });
});

describe("Executor handover record", () => {
  it("chưa có yêu cầu nhận: không có nút mở bàn giao, chỉ giải thích người nhận sẽ gửi yêu cầu", async () => {
    mockGets([vault()]);
    setup("/executor/report");
    expect(await screen.findByText("Chưa có yêu cầu nhận tài sản")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mở bàn giao" })).not.toBeInTheDocument();
  });

  it("có yêu cầu nhận thì thấy biên bản luật sư đang lập", async () => {
    mockGets(
      [vault({ handoverRecordId: RECORD_ID, handoverRecordStatus: "DRAFTING" })],
      record("DRAFTING"),
    );
    setup("/executor/report");
    expect(await screen.findByText(/Luật sư đang xét giấy tờ và lập biên bản/)).toBeInTheDocument();
    expect(screen.getByText("Trần Minh Anh")).toBeInTheDocument();
  });

  const BENEFICIARY = "66666666-6666-4666-8666-666666666666";
  /** Người nhận duy nhất của biên bản mẫu, với phần chữ ký riêng của họ. */
  const one = (extra: Record<string, unknown>) => ({
    ...record("SIGNING").recipients[0],
    identityConfirmedAt: CREATED_AT,
    ...extra,
  });

  it("Người thực thi ký riêng cho người nhận đã xác nhận danh tính", async () => {
    mockGets(
      [vault({ handoverRecordId: RECORD_ID, handoverRecordStatus: "SIGNING" })],
      record("SIGNING", { canSign: true, recipients: [one({ canSign: true })] }),
    );
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(
      record("SIGNING", {
        canSign: false,
        recipients: [one({ executorSignedAt: CREATED_AT })],
      }),
    );
    setup("/executor/report");
    expect(screen.queryByRole("button", { name: "Ký biên bản" })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Xem và ký" }));
    const signButton = await screen.findByRole("button", { name: "Ký biên bản" });
    expect(signButton.closest("div.break-inside-avoid")).toHaveTextContent("Bên giao");
    await userEvent.click(signButton);
    expect(post).toHaveBeenCalledWith(
      `/executor/vaults/${VAULT_ID}/handover-record/recipients/${BENEFICIARY}/sign`,
    );
    expect(await screen.findByText(/^Bạn đã ký \d/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ký biên bản" })).not.toBeInTheDocument();
  });

  it("người nhận chưa được xác nhận danh tính thì Người thực thi chưa ký được", async () => {
    mockGets(
      [vault({ handoverRecordId: RECORD_ID, handoverRecordStatus: "SIGNING" })],
      record("SIGNING", { canSign: false }),
    );
    setup("/executor/report");

    expect(
      await screen.findByText("Chờ luật sư xác nhận danh tính người này."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xem và ký" })).not.toBeInTheDocument();
  });
});

describe("Executor progress", () => {
  const TURN_A = "55555555-5555-4555-8555-555555555551";
  const TURN_B = "55555555-5555-4555-8555-555555555552";

  /** Biên bản còn SIGNING: A đã đủ chữ ký (HANDOVER_COMMITTED), B mới có danh tính, chưa ký. */
  function partiallyDelivered() {
    const baseTurn = {
      containerName: "Gói",
      beneficiaryCitizenId: "0791",
      claimedByYou: false,
      identityConfirmedByExecutor: false,
      invitedAt: CREATED_AT,
      responseDeadline: CREATED_AT,
      invitationSentAt: CREATED_AT,
      identityConfirmedAt: CREATED_AT,
      claimedAt: null,
      decisionDeadline: null,
      decidedAt: null,
      grantStatus: null,
      grantExpiresAt: null,
      totalItems: 1,
      downloadedItems: 0,
      items: [],
    };
    const progress = {
      caseId: RECORD_ID,
      handoverStarted: true,
      serverTime: CREATED_AT,
      summary: {
        totalTurns: 2,
        waitingResponse: 0,
        inVerification: 0,
        accepted: 1,
        declined: 0,
        ended: 0,
      },
      turns: [
        {
          ...baseTurn,
          turnId: TURN_A,
          beneficiaryFullName: "Người A",
          status: "HANDOVER_COMMITTED",
          recipientSignedAt: CREATED_AT,
          documentApprovedAt: CREATED_AT,
        },
        {
          ...baseTurn,
          turnId: TURN_B,
          beneficiaryFullName: "Người B",
          status: "READY_TO_ACCEPT",
          recipientSignedAt: null,
          documentApprovedAt: null,
        },
      ],
    };
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") {
        return [vault({ handoverRecordId: RECORD_ID, handoverRecordStatus: "SIGNING" })];
      }
      if (url === `/executor/vaults/${VAULT_ID}/handover-record`) {
        return record("SIGNING", { canSign: false, executorSignedAt: CREATED_AT });
      }
      if (url === `/executor/handover-records/${RECORD_ID}/handover-progress`) return progress;
      return [];
    });
  }

  it("biên bản còn SIGNING: gửi được mã cho người A đã đủ chữ ký, người B chưa ký thì chưa có nút", async () => {
    partiallyDelivered();
    setup("/executor/progress");
    const rowA = await screen.findByRole("listitem", { name: /Người A/ });
    const rowB = await screen.findByRole("listitem", { name: /Người B/ });
    expect(within(rowA).getByRole("button", { name: "Gửi mã qua email" })).toBeInTheDocument();
    expect(
      within(rowB).queryByRole("button", { name: "Gửi mã qua email" }),
    ).not.toBeInTheDocument();
    expect(rowB).toHaveTextContent("Chờ người nhận ký biên bản");
  });

  it("tổng quan: biên bản còn SIGNING mà A đã được mở thì việc là gửi mã nhận", async () => {
    partiallyDelivered();
    setup("/executor");
    expect(
      await screen.findByRole("heading", { name: "Gửi mã nhận cho 1 người nhận" }),
    ).toBeInTheDocument();
  });

  it("chưa có yêu cầu nhận thì dẫn về mục Biên bản bàn giao", async () => {
    mockGets([vault()]);
    setup("/executor/progress");
    expect(await screen.findByRole("link", { name: "Đi tới Biên bản bàn giao" })).toHaveAttribute(
      "href",
      "/executor/report",
    );
  });
});
