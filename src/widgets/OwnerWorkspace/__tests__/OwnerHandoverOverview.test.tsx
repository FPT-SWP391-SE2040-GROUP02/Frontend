import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { executorKeyService } from "@/features/executor-key/api/executorKeyService";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { OwnerHandoverOverview } from "../OwnerHandoverOverview";

vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({ usePlanSetup: vi.fn() }));
// getStatus giả; các hàm còn lại giữ nguyên.
vi.mock("@/features/executor-key/api/executorKeyService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/executor-key/api/executorKeyService")>();
  return { executorKeyService: { ...actual.executorKeyService, getStatus: vi.fn() } };
});
vi.mock("@/features/dms/model/useCheckIn", () => ({ useCheckIn: vi.fn() }));
vi.mock("@/features/dms/api/checkInService", () => ({ checkInService: { checkIn: vi.fn() } }));
vi.mock("@/shared/settings/usePolicyWindows", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/settings/usePolicyWindows")>();
  return {
    ...actual,
    usePolicyWindows: () => ({ ...actual.DEFAULT_POLICY_WINDOWS, grantDays: 30 }),
  };
});

const VAULT_ID = "22222222-2222-4222-8222-222222222222";
const HOUSE_ID = "33333333-3333-4333-8333-333333333333";
const LETTER_ID = "44444444-4444-4444-8444-444444444444";
const BANK_ID = "55555555-5555-4555-8555-555555555555";
const EXECUTOR_ID = "66666666-6666-4666-8666-666666666666";
const SECRET_MESSAGE = "NOI-DUNG-LOI-NHAN-BI-MAT";
// 02:42 UTC = 09:42 giờ Việt Nam.
const ACTIVATED_AT = "2026-11-15T02:42:00Z";
const ACCEPTED_AT = "2026-11-14T07:20:00Z";
const PIN = "482913";

function executor(overrides: Record<string, unknown> = {}) {
  return {
    id: EXECUTOR_ID,
    status: "ACCEPTED",
    inviteeEmail: "executor@example.test",
    fullName: "Lê Thị Mẫu",
    expiresAt: "2026-11-20T00:00:00Z",
    acceptedAt: ACCEPTED_AT,
    invitationSentAt: "2026-11-13T00:00:00Z",
    acceptedScopeVersion: "scope-test",
    etag: '"1"',
    ...overrides,
  };
}

function setupData(overrides: Record<string, unknown> = {}) {
  return {
    planStatus: "DRAFT",
    configVersion: 3,
    canActivate: true,
    missingRequirements: [],
    policyVersion: "setup-test",
    policyText: "Nội dung chính sách thử.",
    executorScopeVersion: "scope-test",
    executorScopeText: "Phạm vi thử.",
    ownerFullName: "Trần Văn An",
    ownerEmail: "an.tran@example.test",
    activatedAt: null,
    executors: [executor()],
    containers: [
      {
        id: HOUSE_ID,
        name: "Giấy tờ nhà đất",
        status: "READY",
        assetCount: 4,
        designationCount: 1,
        missingRequirements: [],
      },
      {
        id: BANK_ID,
        name: "Tài khoản ngân hàng",
        status: "READY",
        assetCount: 3,
        designationCount: 1,
        missingRequirements: [],
      },
    ],
    assetsOutsideContainer: [],
    warnings: [],
    recipients: [
      {
        beneficiaryId: "77777777-7777-4777-8777-777777777777",
        fullName: "Trần Thị Bình",
        hasMessage: true,
        message: SECRET_MESSAGE,
        containers: [{ id: HOUSE_ID, name: "Giấy tờ nhà đất", assetCount: 4, status: "READY" }],
      },
      {
        beneficiaryId: "88888888-8888-4888-8888-888888888888",
        fullName: "Trần Minh Cường",
        hasMessage: false,
        containers: [{ id: BANK_ID, name: "Tài khoản ngân hàng", assetCount: 3, status: "READY" }],
      },
    ],
    ...overrides,
  };
}

function planSetupResult(data: Record<string, unknown>) {
  return {
    isPending: false,
    isError: false,
    isFetching: false,
    data,
    refetch: vi.fn(),
  };
}

function checkInResult() {
  return {
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: {
      status: "ACTIVE",
      planStatus: "ACTIVE",
      serverTime: "2026-11-16T00:00:00Z",
      lastCheckInAt: "2026-11-15T00:00:00Z",
      nextCheckInDueAt: "2026-12-15T00:00:00Z",
    },
  };
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

function pinProblem(code: string, extra: Record<string, unknown> = {}, httpStatus = 403) {
  return new AxiosError("pin", AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
    status: httpStatus,
    statusText: "error",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { code, ...extra },
  });
}

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  accessTokenMemory.set("test-token");
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(useCheckIn).mockReturnValue(checkInResult() as never);
  vi.mocked(executorKeyService.getStatus).mockResolvedValue(keyStatus());
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function showPlan(overrides: Record<string, unknown> = {}) {
  vi.mocked(usePlanSetup).mockReturnValue(planSetupResult(setupData(overrides)) as never);
}

function renderOverview() {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "chu-kho@example.test",
        fullName: "Tên đăng nhập khác",
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
          <OwnerHandoverOverview vaultId={VAULT_ID} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

/** Nút ở cột phải mở khung xem trước; chữ nút đổi theo trạng thái. */
async function openDrawer(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole("button", { name: /^Xem (trước|di chúc đã ký)/ }));
  return screen.findByRole("dialog");
}

/** Tờ di chúc trong khung xem trước (phải mở khung trước). */
function paper() {
  return screen.getByRole("article", { name: "Di chúc" });
}

const TICK_LABEL =
  "Tôi đã đọc toàn bộ di chúc, tự nguyện lập, ký di chúc này và chủ động kích hoạt kế hoạch.";
const PIN_LABEL = "Nhập mã PIN của kho (6 số)";

describe("trang Bàn giao: thẻ việc và tiến độ", () => {
  it("đủ điều kiện: bốn thẻ việc, tiến độ đầy và nút Xem trước và ký", () => {
    showPlan();
    renderOverview();

    expect(screen.getByText("Kế hoạch chưa kích hoạt")).toBeInTheDocument();
    for (const name of [
      /Xác minh danh tính \(eKYC\)/,
      /Người thực thi/,
      /Gói tài sản và người nhận/,
      /Gói dịch vụ/,
    ]) {
      expect(screen.getAllByRole("heading", { name }).length).toBeGreaterThan(0);
    }
    const progress = screen.getByRole("region", { name: "Tiến độ bàn giao" });
    expect(within(progress).getByText("Đã đủ điều kiện để ký")).toBeInTheDocument();
    expect(within(progress).getByRole("button", { name: "Xem trước và ký" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Tiến độ điền di chúc" })).toHaveAttribute(
      "aria-valuenow",
      "4",
    );
    expect(screen.getByText(/^2 gói · 7 tài sản · 2 người nhận/)).toBeInTheDocument();
    expect(
      screen.getByText(/Tài sản thật như nhà đất, tiền gửi vẫn chia theo di chúc/),
    ).toBeVisible();
    // Chưa mở khung thì chưa có tờ di chúc trên trang.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Di chúc" })).not.toBeInTheDocument();
  });

  it("chưa chọn Người thực thi: thẻ có nút Chọn, mở hộp thoại mời; tiến độ nêu điều kiện thiếu", async () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [],
    });
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    renderOverview();

    const progress = screen.getByRole("region", { name: "Tiến độ bàn giao" });
    expect(within(progress).getByText("Còn 1 điều kiện chưa đạt")).toBeInTheDocument();
    expect(within(progress).getByText("Chưa chọn Người thực thi")).toBeInTheDocument();
    expect(within(progress).getByRole("button", { name: "Xem trước di chúc" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Chọn Người thực thi" }));
    expect(await screen.findByRole("dialog", { name: "Mời Người thực thi" })).toBeInTheDocument();
  });

  it("đã mời nhưng chưa chấp nhận: thẻ có Gửi lại lời mời và Đổi người, gửi lại gọi đúng API", async () => {
    const invited = executor({
      status: "INVITED",
      acceptedAt: null,
      inviteeEmail: "hai@example.test",
    });
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [invited],
    });
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(invited as never);
    renderOverview();

    expect(
      screen.getByText(/hai@example.test.*đã gửi lời mời, đang chờ họ ký nhận vai/),
    ).toBeVisible();
    expect(screen.getByText("Người thực thi chưa chấp nhận")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đổi người" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Chọn Người thực thi" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Gửi lại lời mời" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe(`/vaults/${VAULT_ID}/executors/${EXECUTOR_ID}/resend`);
    expect(await screen.findByText("Đã gửi lại lời mời tới hai@example.test.")).toBeVisible();
  });

  it("Người thực thi đã nhận vai: thẻ xong, có nút Đổi người", () => {
    showPlan();
    renderOverview();

    expect(
      screen.getByText(/Lê Thị Mẫu \(executor@example.test\) — đã ký nhận vai ngày/),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Đổi người" })).toBeInTheDocument();
  });

  it("thiếu eKYC, gói và gói dịch vụ: mỗi thẻ có nút dẫn tới nơi xử lý", () => {
    showPlan({
      canActivate: false,
      missingRequirements: [
        "OWNER_EKYC_REQUIRED",
        "READY_CONTAINER_REQUIRED",
        "PAID_SERVICE_REQUIRED",
      ],
      containers: [],
      recipients: [],
    });
    renderOverview();

    expect(screen.getByRole("link", { name: "Đi xác minh danh tính" })).toHaveAttribute(
      "href",
      "/dashboard/identity",
    );
    expect(screen.getByRole("link", { name: "Tạo gói và chọn người nhận" })).toHaveAttribute(
      "href",
      "/dashboard/assets",
    );
    expect(screen.getByRole("link", { name: "Xem gói dịch vụ" })).toBeInTheDocument();
    expect(screen.getByText("Còn 3 điều kiện chưa đạt")).toBeInTheDocument();
  });

  it("gói chưa có người nhận: thẻ gói có lối chọn người nhận cho từng gói", () => {
    showPlan({
      canActivate: false,
      containers: [
        {
          id: LETTER_ID,
          name: "Thư gửi các con",
          status: "DRAFT",
          assetCount: 2,
          designationCount: 0,
          missingRequirements: ["NO_DESIGNATION"],
        },
      ],
      assetsOutsideContainer: [{ id: BANK_ID, name: "Sổ đỏ", kind: "FILE" }],
    });
    renderOverview();

    expect(
      screen.getByRole("link", { name: "Chọn người nhận cho gói “Thư gửi các con”" }),
    ).toHaveAttribute("href", `/dashboard/assets/groups/${LETTER_ID}`);
    expect(screen.getByText(/Còn 1 tài sản chưa nằm trong gói nào/)).toBeInTheDocument();
  });

  it("hiện cảnh báo thiếu Người thực thi dự phòng ở cột phải", () => {
    showPlan({ warnings: ["NO_BACKUP_EXECUTOR"] });
    renderOverview();

    expect(
      screen.getByText("Chưa có Người thực thi dự phòng. Bạn vẫn kích hoạt được."),
    ).toBeInTheDocument();
  });
});

describe("khung xem trước di chúc", () => {
  it("mở bằng nút, có tên dialog; đóng bằng nút Đóng và bằng phím Esc", async () => {
    showPlan();
    renderOverview();

    const dialog = await openDrawer();
    expect(dialog).toHaveAccessibleName("Xem trước di chúc");
    expect(within(paper()).getByRole("heading", { name: "DI CHÚC" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await openDrawer();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("tờ di chúc điền đủ: quốc hiệu, mục I đến IV, bảng gói và người nhận, không ghi tên tài sản", async () => {
    showPlan();
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.getByText("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")).toBeInTheDocument();
    expect(doc.getByText("Độc lập – Tự do – Hạnh phúc")).toBeInTheDocument();
    expect(
      doc.getByText("Hôm nay, ngày … tháng … năm … (điền tự động khi bạn ký), tại LegacyVault."),
    ).toBeInTheDocument();
    for (const heading of [
      "I. Người lập di chúc",
      "II. Tài sản và định đoạt tài sản",
      "III. Người thực thi",
      "IV. Hiệu lực, sửa đổi và thu hồi",
    ]) {
      expect(doc.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    // Tên và email lấy từ kế hoạch, không phải từ tài khoản đăng nhập.
    expect(doc.getAllByText("Trần Văn An")).toHaveLength(2);
    expect(doc.getByText("an.tran@example.test")).toBeInTheDocument();
    expect(paper()).toHaveTextContent(
      "trạng thái tinh thần hoàn toàn minh mẫn, sáng suốt, không bị bất kỳ sự lừa dối, đe dọa hoặc cưỡng ép nào",
    );
    // Bảng: STT, gói kèm số tài sản, người nhận.
    const rows = doc.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("Giấy tờ nhà đất")).toBeInTheDocument();
    expect(within(rows[1]).getByText("4 tài sản")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Trần Thị Bình")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Tài khoản ngân hàng")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Trần Minh Cường")).toBeInTheDocument();
    expect(
      doc.getByText(
        "Ngoài những người nêu trên, tôi không để lại các gói tài sản này cho bất cứ ai khác.",
      ),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toContain(SECRET_MESSAGE);
    // Mục III và IV.
    expect(paper()).toHaveTextContent("Lê Thị Mẫu, email executor@example.test");
    expect(paper()).toHaveTextContent("không được xem nội dung kho, không tự đổi người nhận");
    expect(paper()).toHaveTextContent("Quá hạn điểm danh chỉ tạo bước kiểm tra, không tự bàn giao");
    expect(paper()).toHaveTextContent("thu hồi di chúc này bất cứ lúc nào");
    // Chân tờ.
    expect(paper()).toHaveTextContent(
      "Chữ ký điện tử được xác thực qua tài khoản LegacyVault; chi tiết trong nhật ký ký.",
    );
    expect(paper()).toHaveTextContent("không thay thế di chúc theo quy định của pháp luật dân sự");
    // Không còn các điều khoản cũ và mã tham chiếu.
    expect(paper()).not.toHaveTextContent(/Mã tham chiếu|Phiên bản/);
  });

  it("câu trả lời cũ của Backend (không có recipients): mục II dùng câu chung, tên lấy từ tài khoản đăng nhập", async () => {
    showPlan({ recipients: undefined, ownerFullName: undefined, ownerEmail: undefined });
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.getByText(/những người nhận mà tôi đã chỉ định cho từng gói/)).toBeInTheDocument();
    expect(doc.getAllByText("Tên đăng nhập khác")).toHaveLength(2);
  });
});

describe("chỗ trống đỏ trong di chúc", () => {
  const scrollIntoView = vi.fn();
  beforeEach(() => {
    scrollIntoView.mockReset();
    Element.prototype.scrollIntoView = scrollIntoView;
  });
  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("chưa chọn Người thực thi: chỗ trống bấm được, đóng khung và nháy sáng đúng thẻ Người thực thi", async () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [],
    });
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.getByText("Chờ Người thực thi nhận vai")).toBeInTheDocument();
    await userEvent.click(
      doc.getByRole("button", { name: "Chưa chọn Người thực thi — bấm để điền" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const card = document.getElementById("handover-task-executor");
    expect(card).not.toBeNull();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(card).toHaveClass("ring-4");
    // Bàn phím: focus chuyển vào thẻ vừa được đưa tới (nút đầu tiên trong thẻ, tức nút Chọn Người thực thi).
    await waitFor(() => expect(card).toContainElement(document.activeElement as HTMLElement));
    expect(screen.getByRole("button", { name: "Chọn Người thực thi" })).toHaveFocus();
    // Các thẻ khác không nháy.
    expect(document.getElementById("handover-task-packages")).not.toHaveClass("ring-4");
  });

  it("chưa có gói và người nhận: chỗ trống đưa về thẻ Gói tài sản và người nhận", async () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["READY_CONTAINER_REQUIRED"],
      containers: [],
      recipients: [],
    });
    renderOverview();
    await openDrawer();

    await userEvent.click(
      within(paper()).getByRole("button", { name: "Chưa có gói và người nhận — bấm để điền" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(document.getElementById("handover-task-packages")).toHaveClass("ring-4");
  });

  it("gói chưa có người nhận: dòng bảng có chỗ trống đỏ bấm được", async () => {
    showPlan({
      canActivate: false,
      containers: [
        {
          id: LETTER_ID,
          name: "Thư gửi các con",
          status: "DRAFT",
          assetCount: 2,
          designationCount: 0,
          missingRequirements: ["NO_DESIGNATION"],
        },
      ],
      recipients: [],
    });
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.getByText("Thư gửi các con")).toBeInTheDocument();
    await userEvent.click(doc.getByRole("button", { name: "Chưa có người nhận — bấm để điền" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(document.getElementById("handover-task-packages")).toHaveClass("ring-4");
  });

  it("đã mời nhưng chưa chấp nhận: không còn chỗ trống, ghi chờ chấp nhận và chờ ký nhận vai", async () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [executor({ status: "INVITED", acceptedAt: null, fullName: null })],
    });
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.queryByRole("button", { name: /bấm để điền/ })).not.toBeInTheDocument();
    expect(paper()).toHaveTextContent("executor@example.test (chờ chấp nhận)");
    expect(doc.getByText("Chờ Người thực thi nhận vai")).toBeInTheDocument();
  });
});

describe("hai ô chữ ký", () => {
  it("hai ô ngang hàng: không ai ký thì ghi Chờ Chủ kho ký và Chờ Người thực thi nhận vai", async () => {
    showPlan({ canActivate: false, executors: [] });
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.getByText("Người lập di chúc", { selector: "p" })).toBeInTheDocument();
    expect(doc.getByText("Người thực thi", { selector: "p" })).toBeInTheDocument();
    expect(doc.getByText("Chờ Chủ kho ký")).toBeInTheDocument();
    expect(doc.getByText("Chờ Người thực thi nhận vai")).toBeInTheDocument();
    expect(doc.queryByText(/Đã ký điện tử/)).not.toBeInTheDocument();
    expect(doc.getByText(/^Tôi, Người thực thi, xác nhận đã nhận vai trò/)).toBeInTheDocument();
  });

  it("Người thực thi đã ký, Chủ kho chưa: ô Người thực thi có giờ ký, dòng xác nhận dưới ô; không ghi cách ký", async () => {
    showPlan();
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.getAllByText(/^Đã ký điện tử/)).toHaveLength(1);
    expect(doc.getByText("Đã ký điện tử · 14:20 ngày 14/11/2026")).toBeInTheDocument();
    expect(doc.getByText("Chờ Chủ kho ký")).toBeInTheDocument();
    expect(
      doc.getByText(
        "Tôi, Lê Thị Mẫu, xác nhận đã nhận vai trò và phạm vi nhiệm vụ nêu tại mục III.",
      ),
    ).toBeInTheDocument();
    expect(paper()).not.toHaveTextContent(/bằng PIN|bằng mã PIN|bằng mật khẩu/);
    // Hai ô cùng một hàng: cùng nằm trong một lưới hai cột.
    const grid = doc.getByText("Chờ Chủ kho ký").closest(".grid");
    expect(grid).not.toBeNull();
    expect(grid).toHaveClass("grid-cols-2");
  });

  it("đã mời nhưng chưa ký nhận vai: ô Người thực thi vẫn chờ nhận vai", async () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [executor({ status: "INVITED", acceptedAt: null })],
    });
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.getByText("Chờ Người thực thi nhận vai")).toBeInTheDocument();
    expect(doc.getByText("Chờ Chủ kho ký")).toBeInTheDocument();
  });

  it("cả hai đã ký (kế hoạch đang chạy): hai ô đã ký, ngày lập và giờ ký của Chủ kho", async () => {
    showPlan({ planStatus: "ACTIVE", canActivate: false, activatedAt: ACTIVATED_AT });
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.getAllByText(/^Đã ký điện tử/)).toHaveLength(2);
    expect(doc.getByText("Đã ký điện tử · 09:42 ngày 15/11/2026")).toBeInTheDocument();
    expect(
      doc.getByText("Hôm nay, ngày 15 tháng 11 năm 2026, tại LegacyVault."),
    ).toBeInTheDocument();
    expect(doc.queryByText(/Chờ/)).not.toBeInTheDocument();
  });

  it("kế hoạch không còn DRAFT nhưng thiếu activatedAt thì chưa tính là Chủ kho đã ký", async () => {
    showPlan({ planStatus: "ACTIVE", canActivate: false, activatedAt: null });
    renderOverview();
    await openDrawer();

    const doc = within(paper());
    expect(doc.getAllByText(/^Đã ký điện tử/)).toHaveLength(1);
    expect(doc.getByText("Chờ Chủ kho ký")).toBeInTheDocument();
  });
});

describe("nút Xuất file PDF", () => {
  it("khóa khi Chủ kho chưa ký, có dòng giải thích dưới nút", async () => {
    showPlan();
    renderOverview();
    await openDrawer();

    const button = screen.getByRole("button", { name: "Xuất file PDF" });
    expect(button).toBeDisabled();
    expect(screen.getByText("Xuất được sau khi 2 bên đã ký")).toBeInTheDocument();
    expect(button).toHaveAccessibleDescription("Xuất được sau khi 2 bên đã ký");
  });

  it("Chủ kho đã ký nhưng Người thực thi chưa ký: vẫn khóa, ghi Chờ Người thực thi ký", async () => {
    showPlan({
      planStatus: "ACTIVE",
      canActivate: false,
      activatedAt: ACTIVATED_AT,
      executors: [executor({ status: "INVITED", acceptedAt: null })],
    });
    renderOverview();
    await openDrawer();

    expect(screen.getByRole("button", { name: "Xuất file PDF" })).toBeDisabled();
    expect(screen.getByText("Chờ Người thực thi ký")).toBeInTheDocument();
  });

  it("đủ hai chữ ký: mở khóa, dùng hộp thoại in của trình duyệt, đặt tên tệp rồi trả tên cũ", async () => {
    showPlan({ planStatus: "ACTIVE", canActivate: false, activatedAt: ACTIVATED_AT });
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const titleBefore = document.title;
    renderOverview();
    await openDrawer();

    expect(screen.getByText("Đã đủ 2 chữ ký")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xuất file PDF" }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.title).toBe("Di-chuc");
    window.dispatchEvent(new Event("afterprint"));
    expect(document.title).toBe(titleBefore);
  });
});

describe("chân khung: ký và kích hoạt", () => {
  const SUCCESS_BODY = {
    ...setupData({ planStatus: "ACTIVE", canActivate: false, activatedAt: ACTIVATED_AT }),
    recipients: undefined,
  };

  async function tickAndType(pin: string) {
    await userEvent.click(screen.getByRole("checkbox", { name: TICK_LABEL }));
    await userEvent.type(screen.getByLabelText(PIN_LABEL), pin);
  }

  it("nút Ký và kích hoạt khóa theo từng bước và nói lý do", async () => {
    showPlan();
    renderOverview();
    await openDrawer();

    const button = screen.getByRole("button", { name: "Ký và kích hoạt" });
    expect(button).toBeDisabled();
    expect(screen.getByText("Cần tick ô xác nhận phía trên.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByText("Nhập đủ 6 số của mã PIN.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(PIN_LABEL), "48291");
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText(PIN_LABEL), "3");
    expect(button).toBeEnabled();
    // Bỏ tick thì khóa lại.
    await userEvent.click(screen.getByRole("checkbox"));
    expect(button).toBeDisabled();
  });

  it("chưa đủ điều kiện: tick, ô PIN và nút ký khóa; lý do nói còn mấy điều kiện và chỉ chỗ đỏ", async () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [],
    });
    renderOverview();
    await openDrawer();

    expect(screen.getByRole("button", { name: "Ký và kích hoạt" })).toBeDisabled();
    expect(screen.getByLabelText(PIN_LABEL)).toBeDisabled();
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(
      screen.getByText(
        "Chưa thể ký: còn 1 điều kiện chưa đạt. Bấm vào chỗ đỏ trong di chúc để điền.",
      ),
    ).toBeInTheDocument();
  });

  it("gửi mã PIN ở header X-Vault-Pin (không trong body) và không để PIN lại trên màn hình", async () => {
    showPlan();
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(SUCCESS_BODY as never);
    renderOverview();
    await openDrawer();

    await tickAndType(PIN);
    await userEvent.click(screen.getByRole("button", { name: "Ký và kích hoạt" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe(`/vaults/${VAULT_ID}/activate`);
    expect(body).toEqual({
      configVersion: 3,
      policyVersion: "setup-test",
      acknowledgePolicy: true,
    });
    expect(JSON.stringify(body)).not.toContain(PIN);
    expect(config).toMatchObject({
      headers: { "X-Vault-Pin": PIN },
      skipVaultPinPrompt: true,
    });
  });

  it("sai PIN: hiện số lần còn lại ngay dưới ô PIN, xóa ô nhập, không hiện hộp thoại PIN chung", async () => {
    showPlan();
    vi.spyOn(apiClient, "post").mockRejectedValue(
      pinProblem("INVALID_VAULT_PIN", { attemptsRemaining: 4 }),
    );
    renderOverview();
    await openDrawer();

    await tickAndType("111222");
    await userEvent.click(screen.getByRole("button", { name: "Ký và kích hoạt" }));

    expect(await screen.findByText("Mã PIN không đúng. Còn 4 lần thử.")).toBeVisible();
    const input = screen.getByLabelText(PIN_LABEL);
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-invalid", "true");
    // Chỉ có khung xem trước, không có hộp thoại PIN chung.
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await userEvent.type(input, "9");
    expect(screen.queryByText("Mã PIN không đúng. Còn 4 lần thử.")).not.toBeInTheDocument();
  });

  it("PIN bị khóa: hiện thông báo khóa và khóa ô PIN cùng nút ký", async () => {
    showPlan();
    vi.spyOn(apiClient, "post").mockRejectedValue(pinProblem("VAULT_PIN_LOCKED", {}, 423));
    renderOverview();
    await openDrawer();

    await tickAndType(PIN);
    await userEvent.click(screen.getByRole("button", { name: "Ký và kích hoạt" }));

    expect(await screen.findByText(/Mã PIN đang bị khóa tạm vì nhập sai nhiều lần/)).toBeVisible();
    expect(screen.getByLabelText(PIN_LABEL)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ký và kích hoạt" })).toBeDisabled();
  });

  it("đang gửi: nút đổi thành Đang kiểm tra… và có dòng chờ xác nhận", async () => {
    showPlan();
    vi.spyOn(apiClient, "post").mockReturnValue(new Promise(() => undefined) as never);
    renderOverview();
    await openDrawer();

    await tickAndType(PIN);
    await userEvent.click(screen.getByRole("button", { name: "Ký và kích hoạt" }));

    expect(await screen.findByRole("button", { name: "Đang kiểm tra…" })).toBeDisabled();
    expect(screen.getByText("Chờ hệ thống xác nhận mã PIN.")).toBeInTheDocument();
  });

  it("kế hoạch đã kích hoạt: khung chỉ xem, không còn tick, PIN và nút ký", async () => {
    showPlan({ planStatus: "ACTIVE", canActivate: false, activatedAt: ACTIVATED_AT });
    renderOverview();
    await userEvent.click(screen.getByRole("button", { name: "Xem di chúc đã ký" }));
    expect(await screen.findByRole("dialog", { name: "Di chúc đã ký" })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Ký và kích hoạt" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(PIN_LABEL)).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

describe("trang Bàn giao: kế hoạch đã chạy", () => {
  function showRunning(key: Record<string, unknown> = {}) {
    showPlan({
      planStatus: "ACTIVE",
      canActivate: false,
      activatedAt: ACTIVATED_AT,
      assetsOutsideContainer: [{ id: BANK_ID, name: "Tài sản thêm sau", kind: "TEXT" }],
    });
    vi.mocked(executorKeyService.getStatus).mockResolvedValue(
      keyStatus({ hasKey: true, version: 1, issuedAt: "2026-11-15T02:42:00Z", ...key }),
    );
  }

  it("thẻ việc chỉ tóm tắt (không nút), kèm điểm danh, Kế hoạch đang áp dụng, Mã mở gói và tiến trình", async () => {
    showRunning();
    renderOverview();

    expect(screen.getByText("Kế hoạch đang chạy", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đổi người" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Đi xác minh danh tính" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh" })).toBeEnabled();
    const active = screen.getByRole("region", { name: "Kế hoạch đang áp dụng" });
    expect(within(active).getByText("Kích hoạt lúc")).toBeInTheDocument();
    expect(within(active).getByText("09:42 15/11/2026")).toBeInTheDocument();
    expect(await screen.findByText("Đã có · Bản 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mã mở gói" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tiến trình bàn giao" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem di chúc đã ký" })).toBeInTheDocument();
  });

  it("không còn màn nhận mã, dải chưa có mã hay phiếu: Chủ kho không giữ mã", async () => {
    showRunning({ hasKey: false, version: 0, issuedAt: null });
    renderOverview();

    expect(await screen.findByText("Chưa tạo")).toBeInTheDocument();
    expect(screen.queryByText(/chưa có mã mở gói/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tạo mã mở gói" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tải phiếu/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/lưu mã mở gói/)).not.toBeInTheDocument();
  });

  it("kế hoạch bị khóa: ẩn nút đổi mã và giải thích", async () => {
    showRunning({ canIssue: false });
    renderOverview();

    expect(await screen.findByText("Kế hoạch đang bị khóa nên không đổi mã được.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Đổi mã mới" })).not.toBeInTheDocument();
  });

  it("lỗi tải kế hoạch hiện thử lại", () => {
    vi.mocked(usePlanSetup).mockReturnValue({
      isPending: false,
      isError: true,
      isFetching: false,
      data: undefined,
      refetch: vi.fn(),
    } as never);
    renderOverview();

    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được kế hoạch bàn giao");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
