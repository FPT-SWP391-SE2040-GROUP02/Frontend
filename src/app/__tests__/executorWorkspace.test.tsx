import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
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
    vaultName: "Kho gia đình",
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
            <Route path="/dashboard" element={<p>Không gian Chủ kho (fixture)</p>} />
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
    await screen.findByRole("link", { name: "Đổi kho →" });
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người thực thi" });
    expect(Array.from(nav.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Đổi kho →",
      "Tổng quan",
      "Biên bản bàn giao",
      "Bàn giao",
      "Tài sản và hướng dẫn",
      "Cài đặt",
    ]);
    const account = screen.getByRole("navigation", { name: "Tài khoản" });
    expect(Array.from(account.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Lời mời và các kho bạn đang làm việc",
    ]);
    expect(screen.queryByRole("link", { name: "Xác minh" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
    // Người thực thi là nhân sự của hệ thống: không chuyển sang vai khác.
    expect(screen.queryByRole("link", { name: /Sang vai/ })).not.toBeInTheDocument();
    expect(screen.getByText("Người thực thi")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Kho của Anh Nam" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bạn là Người thực thi của kho này. Bạn không đọc được nội dung kho."),
    ).toBeInTheDocument();
  });

  it("menu trái chỉ có một thẻ kho đang làm việc, không bấm được, và Đổi kho → dẫn tới trang lời mời", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({
        planStatus: "HANDOVER_IN_PROGRESS",
        handoverRecordId: RECORD_ID,
        handoverRecordStatus: "IDENTITY_CHECK",
      }),
      vault({ vaultId: OTHER_VAULT_ID, ownerFullName: "Bà Hạnh", planStatus: "CLOSED" }),
    ]);
    setup("/executor");
    const group = await screen.findByRole("region", { name: "Đang làm việc với kho" });
    const card = await within(group).findByRole("group", { name: "Kho đang làm việc: Anh Nam" });
    expect(card).toHaveTextContent("Đang ký biên bản");
    // Không còn danh sách kho để bấm chuyển trong menu.
    expect(screen.queryByRole("button", { name: "Kho của Bà Hạnh" })).not.toBeInTheDocument();
    expect(within(group).queryByRole("button")).not.toBeInTheDocument();
    expect(within(group).getByRole("link", { name: "Đổi kho →" })).toHaveAttribute(
      "href",
      "/executor/invitations",
    );
    // Tiêu đề nhóm menu bên dưới.
    expect(screen.getByText("Kho này")).toBeInTheDocument();
  });

  it("chưa chọn kho nào thì tự chọn kho đầu tiên; kho đã nhớ trong phiên thì dùng kho đó", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault(),
      vault({ vaultId: OTHER_VAULT_ID, ownerFullName: "Bà Hạnh" }),
    ]);
    setup("/executor");
    expect(
      await screen.findByRole("group", { name: "Kho đang làm việc: Anh Nam" }),
    ).toBeInTheDocument();
    cleanup();
    window.sessionStorage.setItem("lv-executor-vault", OTHER_VAULT_ID);
    setup("/executor");
    expect(
      await screen.findByRole("group", { name: "Kho đang làm việc: Bà Hạnh" }),
    ).toBeInTheDocument();
  });

  it("không có kho nào: thẻ ghi Chưa giữ kho nào và liên kết thành Xem lời mời →", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup("/executor");
    const group = await screen.findByRole("region", { name: "Đang làm việc với kho" });
    expect(await within(group).findByText("Chưa giữ kho nào")).toBeInTheDocument();
    expect(within(group).getByRole("link", { name: "Xem lời mời →" })).toHaveAttribute(
      "href",
      "/executor/invitations",
    );
    expect(within(group).queryByRole("link", { name: "Đổi kho →" })).not.toBeInTheDocument();
  });

  it("shows the pending invitation count on Lời mời và các kho bạn đang làm việc and hides it at zero", async () => {
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
    const link = await screen.findByRole("link", { name: /Lời mời và các kho bạn đang làm việc/ });
    expect(await within(link).findByLabelText("1 lời mời đang chờ")).toBeInTheDocument();
    cleanup();
    client.clear();
    pending = [];
    setup("/executor");
    const emptyLink = await screen.findByRole("link", {
      name: /Lời mời và các kho bạn đang làm việc/,
    });
    await screen.findByRole("heading", { level: 1, name: "Kho của Anh Nam" });
    expect(within(emptyLink).queryByLabelText(/lời mời đang chờ/)).not.toBeInTheDocument();
  });
});

describe("Executor assets", () => {
  it("lists the packages with recipients and assets, without any view or download button", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault({ planStatus: "HANDOVER_IN_PROGRESS" })];
      if (url === `/executor/vaults/${VAULT_ID}/assets`) {
        return [
          {
            containerId: "66666666-6666-4666-8666-666666666666",
            containerName: "Gói gia đình",
            recipients: [{ fullName: "Trần Minh Anh", citizenId: "0791" }],
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
    expect(screen.getByText("Người nhận: Trần Minh Anh")).toBeInTheDocument();
    expect(screen.getByText("Email gia đình")).toBeInTheDocument();
    expect(screen.getByText("Sổ tiết kiệm")).toBeInTheDocument();
    expect(screen.getByText("2 tài sản trong 1 gói")).toBeInTheDocument();
    // Chưa có lượt bàn giao: gói "Chưa bàn giao", từng tài sản "Chưa tải".
    expect(screen.getByText("Chưa bàn giao")).toBeInTheDocument();
    expect(screen.getAllByText("Chưa tải")).toHaveLength(2);
    expect(screen.getByText("Chủ kho chưa để lại hướng dẫn.")).toBeInTheDocument();
    expect(screen.getByText(/Nội dung chỉ người nhận mở được/)).toBeInTheDocument();
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

  it("says there is no duty when the account is not an Executor of any vault", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup("/executor");
    expect(
      await screen.findByText("Tài khoản chưa có nhiệm vụ Executor đang hiệu lực."),
    ).toBeInTheDocument();
  });

  it("reports a failed vault list with a retry instead of an empty page", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("down"));
    setup("/executor");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được các kho");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("Executor permissions", () => {
  it("lists what the Executor can and cannot do", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor/permissions");
    expect(await screen.findByText("Xem ghi chú của Chủ kho")).toBeInTheDocument();
    expect(
      screen.getByText("Nhận thông báo khi người nhận gửi yêu cầu nhận tài sản"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tự chia, bán, cho tài sản hoặc đổi người nhận")).toBeInTheDocument();
    expect(screen.getByText("Đọc nội dung kho")).toBeInTheDocument();
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

  it("tới bước ký thì Người thực thi bấm Ký biên bản; không ký khi chưa tới lượt", async () => {
    mockGets(
      [vault({ handoverRecordId: RECORD_ID, handoverRecordStatus: "SIGNING" })],
      record("SIGNING", { canSign: true }),
    );
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(record("SIGNING", { canSign: false, executorSignedAt: CREATED_AT }));
    setup("/executor/report");
    await userEvent.click(await screen.findByRole("button", { name: "Ký biên bản" }));
    expect(post).toHaveBeenCalledWith(`/executor/vaults/${VAULT_ID}/handover-record/sign`);
    expect(
      await screen.findByText(/Bạn đã ký\. Mỗi người nhận được mở phần của mình khi có chữ ký/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ký biên bản" })).not.toBeInTheDocument();
  });

  it("vừa chốt, người nhận chưa nộp căn cước: Người thực thi vẫn ký được ngay", async () => {
    mockGets(
      [vault({ handoverRecordId: RECORD_ID, handoverRecordStatus: "SIGNING" })],
      record("SIGNING", { canSign: true }),
    );
    setup("/executor/report");
    expect(await screen.findByRole("button", { name: "Ký biên bản" })).toBeEnabled();
    expect(screen.getByText(/ký ngay, không cần chờ người nhận/)).toBeInTheDocument();
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
