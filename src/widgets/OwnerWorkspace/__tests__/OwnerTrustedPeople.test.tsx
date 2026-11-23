import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ROUTES } from "@/shared/config/routes.config";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { planSetupService } from "@/features/plan-setup/api/planSetupService";
import { executorKeyService } from "@/features/executor-key/api/executorKeyService";
import { systemExecutorsService } from "@/entities/executor/api/systemExecutorsService";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { OwnerTrustedPeople } from "../OwnerTrustedPeople";

vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({ usePlanSetup: vi.fn() }));
vi.mock("@/features/plan-setup/api/planSetupService", () => ({
  planSetupService: { invite: vi.fn(), resend: vi.fn(), revoke: vi.fn() },
}));
vi.mock("@/entities/executor/api/systemExecutorsService", () => ({
  systemExecutorsService: { list: vi.fn(), getHandoverKey: vi.fn() },
}));
// Trang này không còn thẻ Mã mở gói; giữ hàm giả để kiểm không có yêu cầu tải trạng thái mã nào.
vi.mock("@/features/executor-key/api/executorKeyService", () => ({
  executorKeyService: { getStatus: vi.fn(), reissue: vi.fn() },
}));
vi.mock("@/features/vault-management/api/ownerVaultService", () => ({
  ownerVaultService: { getMine: vi.fn(), createMine: vi.fn(), updateMine: vi.fn() },
}));
vi.mock("@/shared/settings/usePolicyWindows", () => ({
  usePolicyWindows: () => ({ executorInviteMinutes: 10, grantDays: 30 }),
}));

const VAULT_ID = "22222222-2222-4222-8222-222222222222";
const SENT_AT = "2026-11-02T01:00:00Z";
const ACCEPTED_AT = "2026-11-03T01:00:00Z";
const EXPIRES_AT = "2026-11-09T01:00:00Z";

function executor(overrides: Record<string, unknown> = {}) {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    status: "INVITED",
    inviteeEmail: "thuc-thi@example.test",
    expiresAt: EXPIRES_AT,
    acceptedAt: null,
    invitationSentAt: SENT_AT,
    acceptedScopeVersion: "scope-test",
    etag: '"1"',
    ...overrides,
  };
}

function setupData(overrides: Record<string, unknown> = {}) {
  return {
    planStatus: "DRAFT",
    configVersion: 3,
    canActivate: false,
    missingRequirements: [],
    policyVersion: "setup-test",
    policyText: "Chính sách thử.",
    executorScopeVersion: "scope-test",
    executorScopeText: "Phạm vi thử.",
    executors: [],
    assignedAssetCount: 0,
    unassignedAssets: [],
    warnings: [],
    ...overrides,
  };
}

function planSetupResult(data: Record<string, unknown>) {
  return { isPending: false, isError: false, isFetching: false, data, refetch: vi.fn() };
}

function keyStatus(overrides: Record<string, unknown> = {}) {
  return {
    hasKey: false,
    version: 0,
    issuedAt: null,
    reissuedAt: null,
    canIssue: true,
    ...overrides,
  };
}

let client: QueryClient;

function showPlan(overrides: Record<string, unknown>, key: Record<string, unknown> = {}) {
  vi.mocked(usePlanSetup).mockReturnValue(planSetupResult(setupData(overrides)) as never);
  vi.mocked(executorKeyService.getStatus).mockResolvedValue(keyStatus(key) as never);
}

beforeEach(() => {
  vi.resetAllMocks();
  accessTokenMemory.set("test-token");
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(systemExecutorsService.list).mockResolvedValue([
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      fullName: "Luật sư Thử",
      email: "moi@example.test",
      phoneMasked: null,
      executorRoleTitle: "Người thực thi",
      assignedVaultsCount: 0,
      isAvailable: true,
    },
  ] as never);
  vi.mocked(ownerVaultService.getMine).mockResolvedValue({
    id: VAULT_ID,
    name: "Kho gia đình",
    status: "OPEN",
    etag: "vault-v1",
    executorNote: null,
    executorNoteUpdatedAt: null,
  } as never);
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderPage() {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "chu-kho@example.test",
        fullName: "Nguyễn Văn A",
        role: "USER",
        status: "ACTIVE",
        createdAt: "2026-10-15T00:00:00Z",
        emailVerified: true,
        hasPassword: false,
      },
    }),
  );
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <OwnerTrustedPeople vaultId={VAULT_ID} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("trang Người thực thi: thẻ Người bạn chọn", () => {
  it("chưa mời ai: khung Bạn chưa mời ai và nút Chọn Người thực thi", async () => {
    showPlan({});
    renderPage();

    expect(await screen.findByRole("heading", { name: "Người bạn chọn" })).toBeInTheDocument();
    expect(screen.getByText("Mỗi kho một người · bắt buộc để kích hoạt")).toBeInTheDocument();
    expect(screen.getByText("Bạn chưa mời ai")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chọn Người thực thi" })).toBeInTheDocument();
  });

  it("INVITED: chip Chờ đồng ý, ngày mời, nút Gửi lại lời mời và Thu hồi lời mời", async () => {
    showPlan({ executors: [executor()] });
    renderPage();

    expect(await screen.findByText("Chờ đồng ý")).toBeInTheDocument();
    expect(screen.getByText("thuc-thi@example.test")).toBeInTheDocument();
    expect(screen.getByText("Người thực thi của kho")).toBeInTheDocument();
    expect(screen.getByText(/^Mời ngày /)).toBeInTheDocument();
    expect(screen.getByText(/Đang chờ người này đồng ý/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi lại lời mời" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thu hồi lời mời" })).toBeInTheDocument();
  });

  it("ACCEPTED: chip Đã đồng ý, ngày mời và ngày đồng ý, nút Thay người khác", async () => {
    showPlan({ executors: [executor({ status: "ACCEPTED", acceptedAt: ACCEPTED_AT })] });
    renderPage();

    expect(await screen.findByText("Đã đồng ý")).toBeInTheDocument();
    expect(screen.getByText(/Mời ngày .* · Đồng ý ngày /)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Hệ thống tạo mã mở gói khi bạn ký và kích hoạt kế hoạch, rồi chỉ gửi cho người này khi hồ sơ được duyệt.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thay người khác" })).toBeInTheDocument();
    expect(screen.queryByText(/Mời ngày .* · Đồng ý ngày .*Đồng ý ngày/)).not.toBeInTheDocument();
  });

  it("không có ngày mời thì chỉ hiện ngày đồng ý", async () => {
    showPlan({
      executors: [
        executor({ status: "ACCEPTED", acceptedAt: ACCEPTED_AT, invitationSentAt: null }),
      ],
    });
    renderPage();

    expect(await screen.findByText(/^Đồng ý ngày /)).toBeInTheDocument();
    expect(screen.queryByText(/Mời ngày/)).not.toBeInTheDocument();
  });

  it("ACCEPTED và kế hoạch đang chạy: không có Thu hồi, có Thay người khác, hệ thống giữ mã", async () => {
    showPlan(
      {
        planStatus: "ACTIVE",
        executors: [executor({ status: "ACCEPTED", acceptedAt: ACCEPTED_AT })],
      },
      { hasKey: true, version: 1, issuedAt: "2026-11-04T01:00:00Z" },
    );
    renderPage();

    expect(await screen.findByRole("button", { name: "Thay người khác" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thu hồi lời mời" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Hệ thống tự giữ mã mở gói và chỉ gửi cho người này khi hồ sơ được duyệt và bàn giao bắt đầu.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/không thu hồi trực tiếp/)).toBeInTheDocument();
  });

  it("thay người khi kho đã có mã: hộp thoại nói hệ thống tự đổi mã khi người mới đồng ý", async () => {
    showPlan(
      {
        planStatus: "ACTIVE",
        executors: [executor({ status: "ACCEPTED", acceptedAt: ACCEPTED_AT })],
      },
      { hasKey: true, version: 1, issuedAt: "2026-11-04T01:00:00Z" },
    );
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Thay người khác" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Mời người thay")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("hệ thống tự đổi mã mở gói");
    expect(dialog).not.toHaveTextContent("bạn nên đổi mã mới");
    expect(within(dialog).getByRole("button", { name: "Giữ nguyên" })).toBeInTheDocument();
  });

  it("có người thay đang chờ: hiện dòng Đã mời người thay", async () => {
    showPlan({
      planStatus: "ACTIVE",
      executors: [
        executor({ status: "ACCEPTED", acceptedAt: ACCEPTED_AT }),
        executor({
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          inviteeEmail: "nguoi-thay@example.test",
        }),
      ],
    });
    renderPage();

    expect(
      await screen.findByText(/Đã mời người thay: nguoi-thay@example.test/),
    ).toBeInTheDocument();
  });

  it("INVITED chưa gửi được email: cảnh báo chưa xác nhận gửi được email", async () => {
    showPlan({ executors: [executor({ invitationSentAt: null })] });
    renderPage();

    expect(await screen.findByText(/Chưa xác nhận gửi được email/)).toBeInTheDocument();
  });

  it("mục Người thực thi được làm gì? có hai nhóm Được làm và Không được làm", async () => {
    showPlan({ executors: [executor()] });
    renderPage();

    expect(await screen.findByText("Người thực thi được làm gì?")).toBeInTheDocument();
    expect(screen.getByText("Giữ mã mở gói cho tới khi bàn giao")).toBeInTheDocument();
    expect(screen.getByText("Ký biên bản bàn giao do luật sư lập")).toBeInTheDocument();
    expect(screen.getByText("Trao mã mở gói cho người nhận")).toBeInTheDocument();
    expect(screen.getByText("Đọc nội dung kho")).toBeInTheDocument();
    expect(screen.getByText("Tự duyệt hồ sơ")).toBeInTheDocument();
    expect(screen.getByText("Nhận tài sản trong kho này")).toBeInTheDocument();
  });

  it("kế hoạch bị khóa: chỉ xem, không có nút nào và có lý do", async () => {
    showPlan(
      {
        planStatus: "HANDOVER_REQUESTED",
        executors: [executor({ status: "ACCEPTED", acceptedAt: ACCEPTED_AT })],
      },
      { hasKey: true, version: 1, issuedAt: "2026-11-04T01:00:00Z", canIssue: false },
    );
    renderPage();

    expect(await screen.findByText(/Bạn chỉ xem được/)).toBeInTheDocument();
    for (const name of [
      "Chọn Người thực thi",
      "Thay người khác",
      "Gửi lại lời mời",
      "Thu hồi lời mời",
      "Đổi mã mới",
    ]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });
});

describe("trang Người thực thi: thông báo sau khi mời", () => {
  async function inviteWith(accountExists: boolean) {
    showPlan({});
    vi.mocked(planSetupService.invite).mockResolvedValue(
      executor({ inviteeEmail: "moi@example.test", accountExists }) as never,
    );
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Chọn Người thực thi" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Chọn Người thực thi của bạn")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Lời mời có hiệu lực 10 phút.");
    await userEvent.click(
      await within(dialog).findByRole("button", { name: "Chọn người này: Luật sư Thử" }),
    );
    await userEvent.click(within(dialog).getByRole("switch", { name: /chỉ là đề cử/ }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi lời mời" }));
  }

  it("người được mời đã có tài khoản", async () => {
    await inviteWith(true);

    const notice = await screen.findByText(/Người này đã có tài khoản LegacyVault/);
    expect(notice).toHaveTextContent(
      "Đã gửi lời mời tới moi@example.test. Người này đã có tài khoản LegacyVault, lời mời hiện ngay trong mục Lời mời khi họ đăng nhập.",
    );
    expect(planSetupService.invite).toHaveBeenCalledWith(VAULT_ID, {
      email: "moi@example.test",
    });
    const sentPayload = vi.mocked(planSetupService.invite).mock.calls[0][1];
    expect(Object.keys(sentPayload)).toEqual(["email"]);
  });

  it("người được mời chưa có tài khoản", async () => {
    await inviteWith(false);

    const notice = await screen.findByText(/Người này chưa có tài khoản/);
    expect(notice).toHaveTextContent(
      "Đã gửi lời mời tới moi@example.test. Người này chưa có tài khoản. Họ cần mở email mời và tạo tài khoản bằng đúng email này để đồng ý.",
    );
  });

  it("có nút Đóng thông báo", async () => {
    await inviteWith(true);

    await screen.findByText(/Người này đã có tài khoản LegacyVault/);
    await userEvent.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    expect(screen.queryByText(/Người này đã có tài khoản LegacyVault/)).not.toBeInTheDocument();
  });

  it("tự ẩn sau 8 giây", async () => {
    const timers = vi.spyOn(window, "setTimeout");
    await inviteWith(true);

    await screen.findByText(/Người này đã có tài khoản LegacyVault/);
    let hideNotice: (() => void) | null = null;
    for (const call of timers.mock.calls) {
      if (call[1] === 8000 && typeof call[0] === "function") {
        hideNotice = call[0] as () => void;
      }
    }
    expect(hideNotice).not.toBeNull();
    act(() => {
      if (hideNotice !== null) {
        hideNotice();
      }
    });
    await waitFor(() =>
      expect(screen.queryByText(/Người này đã có tài khoản LegacyVault/)).not.toBeInTheDocument(),
    );
  });
});

describe("trang Người thực thi: không có thẻ Mã mở gói", () => {
  it("Chủ kho không thao tác mã mở gói ở đây: không có thẻ, không có nút Đổi mã mới, không tải trạng thái mã", async () => {
    showPlan(
      {
        planStatus: "ACTIVE",
        executors: [executor({ status: "ACCEPTED", acceptedAt: ACCEPTED_AT })],
      },
      { hasKey: true, version: 2, issuedAt: "2026-11-04T01:00:00Z" },
    );
    renderPage();

    expect(await screen.findByRole("heading", { name: "Người bạn chọn" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mã mở gói" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đổi mã mới" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Bản đang dùng/)).not.toBeInTheDocument();
    expect(executorKeyService.getStatus).not.toHaveBeenCalled();
  });

  it("thẻ Người bạn chọn nằm riêng một hàng, Lời dặn bên trái, Người xét duyệt và Hoạt động bên phải", async () => {
    showPlan({});
    renderPage();

    const chosen = await screen.findByRole("region", { name: "Người bạn chọn" });
    const note = await screen.findByRole("heading", { name: "Lời dặn cho Người thực thi" });
    const reviewer = screen.getByRole("region", { name: "Người xét duyệt" });
    const activity = screen.getByRole("region", { name: "Hoạt động gần đây" });
    // Thẻ chọn người đứng trước và không nằm trong cùng cột với các thẻ bên dưới.
    expect(chosen.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(chosen.contains(note)).toBe(false);
    expect(chosen.contains(reviewer)).toBe(false);
    expect(
      reviewer.compareDocumentPosition(activity) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("trang Người thực thi: các thẻ còn lại", () => {
  it("thẻ Lời dặn: tiêu đề mới, đếm ký tự, câu nhắc, nút Lưu khóa khi chưa đổi gì", async () => {
    showPlan({});
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Lời dặn cho Người thực thi" }),
    ).toBeInTheDocument();
    expect(screen.getByText("0/2000")).toBeInTheDocument();
    expect(
      screen.getByText(/không ghi mật khẩu, số tài khoản hay nội dung tài sản/),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Lời dặn cho Người thực thi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu lời dặn" })).toBeDisabled();

    await userEvent.type(
      screen.getByRole("textbox", { name: "Lời dặn cho Người thực thi" }),
      "Gọi anh Minh",
    );
    expect(screen.getByText("12/2000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu lời dặn" })).toBeEnabled();
  });

  it("thẻ Người xét duyệt hiện ở mọi trạng thái và không nhắc eKYC người nhận", async () => {
    showPlan({});
    renderPage();

    expect(await screen.findByRole("heading", { name: "Người xét duyệt" })).toBeInTheDocument();
    expect(
      screen.getByText(/Hệ thống tự phân công luật sư khi người nhận gửi yêu cầu nhận tài sản/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/eKYC/)).not.toBeInTheDocument();
  });

  it("hoạt động gần đây: rỗng thì có câu Chưa có hoạt động và link nhật ký", async () => {
    showPlan({});
    renderPage();

    expect(await screen.findByText("Chưa có hoạt động.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem nhật ký đầy đủ" })).toHaveAttribute(
      "href",
      ROUTES.DASHBOARD.AUDIT_LOG,
    );
  });

  it("hoạt động gần đây: mới nhất trước", async () => {
    showPlan({ executors: [executor({ status: "ACCEPTED", acceptedAt: ACCEPTED_AT })] });
    renderPage();

    const section = await screen.findByRole("region", { name: "Hoạt động gần đây" });
    const items = within(section).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("thuc-thi@example.test đồng ý lời mời");
    expect(items[1]).toHaveTextContent("Bạn gửi lời mời cho thuc-thi@example.test");
  });

  it("không còn chữ cũ trên trang", async () => {
    showPlan(
      {
        planStatus: "ACTIVE",
        executors: [executor({ status: "ACCEPTED", acceptedAt: ACCEPTED_AT })],
      },
      { hasKey: true, version: 1, issuedAt: "2026-11-04T01:00:00Z" },
    );
    renderPage();

    await screen.findByRole("heading", { name: "Người bạn chọn" });
    for (const old of [
      /Người tin cậy/,
      /Người thực hiện/,
      /Executor/,
      /dự phòng/,
      /eKYC cho người nhận/,
      /Cấp lại/,
      /hết hiệu lực/,
    ]) {
      expect(screen.queryByText(old)).not.toBeInTheDocument();
    }
  });
});
