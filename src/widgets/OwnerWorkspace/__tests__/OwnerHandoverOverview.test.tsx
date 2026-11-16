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

function paper() {
  return screen.getByRole("article", { name: "Di chúc" });
}

describe("trang Bàn giao: kế hoạch còn nháp, di chúc sinh từ dữ liệu kế hoạch", () => {
  it("đủ nội dung: quốc hiệu, tiêu đề, câu mở đầu, Điều 1 đến Điều 6 và câu lưu ý", () => {
    showPlan();
    renderOverview();

    expect(screen.getByText("Kế hoạch chưa kích hoạt")).toBeInTheDocument();
    const doc = within(paper());
    expect(doc.getByText("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")).toBeInTheDocument();
    expect(doc.getByText("Độc lập – Tự do – Hạnh phúc")).toBeInTheDocument();
    expect(doc.getByRole("heading", { name: "DI CHÚC" })).toBeInTheDocument();
    expect(doc.getByText("Ngày lập: điền tự động khi bạn ký")).toBeInTheDocument();
    // Tên và email lấy từ kế hoạch, không phải từ tài khoản đăng nhập.
    // Tên in ở câu mở đầu và ở ô chữ ký của Chủ kho.
    expect(doc.getAllByText("Trần Văn An")).toHaveLength(2);
    expect(doc.getByText("an.tran@example.test")).toBeInTheDocument();
    expect(paper()).toHaveTextContent("đã xác minh danh tính");
    expect(paper()).toHaveTextContent(
      "trạng thái tinh thần hoàn toàn minh mẫn, sáng suốt, không bị bất kỳ sự lừa dối, đe dọa hoặc cưỡng ép nào",
    );
    for (const heading of [
      "Điều 1. Người thực thi",
      "Điều 2. Người nhận và phần được nhận",
      "Điều 3. Điều kiện bàn giao",
      "Điều 4. Thời hạn",
      "Điều 5. Lưu và xóa dữ liệu",
      "Điều 6. Hiệu lực, sửa đổi và thu hồi",
    ]) {
      expect(doc.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    expect(
      doc.getByText(
        "Tôi được sửa tài sản và người nhận mà không cần Người thực thi ký lại; chỉ khi phạm vi nhiệm vụ của Người thực thi thay đổi thì Người thực thi phải ký lại.",
      ),
    ).toBeInTheDocument();
    expect(doc.getByText("Mỗi 30 ngày")).toBeInTheDocument();
    expect(doc.getByText("Trong 30 ngày kể từ lúc đồng ý")).toBeInTheDocument();
    expect(
      doc.getByText(
        "Bản di chúc số phục vụ việc bàn giao dữ liệu trên LegacyVault, chưa thay thế di chúc có người làm chứng hoặc công chứng.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Tài sản thật như nhà đất, tiền gửi vẫn chia theo di chúc có người làm chứng/,
      ),
    ).toBeInTheDocument();
    // Cột phải: không còn ghi chú nhận mã sau khi kích hoạt.
    expect(screen.queryByText(/bạn nhận ngay sau khi kích hoạt/)).not.toBeInTheDocument();
  });

  it("Điều 1 có Người thực thi đã ký nhận vai: tên, email và ngày nhận vai", () => {
    showPlan();
    renderOverview();

    const doc = within(paper());
    expect(doc.getByText("Lê Thị Mẫu", { selector: "dd" })).toBeInTheDocument();
    expect(
      doc.getByText("executor@example.test (Người thực thi của LegacyVault)"),
    ).toBeInTheDocument();
    expect(doc.getByText("Đã ký nhận vai ngày 14/11/2026")).toBeInTheDocument();
    expect(doc.queryByRole("link", { name: "Chọn Người thực thi" })).not.toBeInTheDocument();
  });

  it("chưa có Người thực thi: chỗ trống có nút dẫn tới trang Người thực thi và ô chữ ký ghi rõ", () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [],
    });
    renderOverview();

    const doc = within(paper());
    expect(doc.getByText(/Chưa chọn Người thực thi/)).toBeInTheDocument();
    expect(doc.getByRole("link", { name: "Chọn Người thực thi" })).toHaveAttribute(
      "href",
      "/dashboard/trusted-people",
    );
    expect(doc.getByText("Chưa có Người thực thi")).toBeInTheDocument();
    expect(doc.getByText("Người thực thi ký khi nhận lời mời")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mời Người thực thi" })).toHaveAttribute(
      "href",
      "/dashboard/trusted-people",
    );
    expect(screen.getByText(/Di chúc dưới đây tự điền từ kho của bạn/)).toBeInTheDocument();
  });

  it("Điều 2 liệt kê người nhận theo từng người, hiện đã/chưa viết lời nhắn và không bao giờ hiện nội dung lời nhắn", () => {
    showPlan();
    renderOverview();

    const doc = within(paper());
    expect(doc.getByText("Trần Thị Bình")).toBeInTheDocument();
    expect(doc.getByText("Giấy tờ nhà đất · 4 tài sản")).toBeInTheDocument();
    expect(doc.getByText("Đã viết, gửi kèm thư mời khi bàn giao")).toBeInTheDocument();
    expect(doc.getByText("Trần Minh Cường")).toBeInTheDocument();
    expect(doc.getByText("Tài khoản ngân hàng · 3 tài sản")).toBeInTheDocument();
    // Chỉ một người chưa viết: một dòng "Chưa viết" kèm đường dẫn tới nơi viết.
    expect(doc.getAllByText(/^Chưa viết/)).toHaveLength(1);
    expect(doc.getByRole("link", { name: "Viết lời nhắn" })).toHaveAttribute(
      "href",
      "/dashboard/beneficiaries",
    );
    expect(document.body.textContent ?? "").not.toContain(SECRET_MESSAGE);
  });

  it("gói chưa có người nhận hiện chỗ trống, tài sản ngoài gói có câu nhắc", () => {
    showPlan({
      canActivate: false,
      missingRequirements: [],
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
          id: LETTER_ID,
          name: "Thư gửi các con",
          status: "DRAFT",
          assetCount: 2,
          designationCount: 0,
          missingRequirements: ["NO_DESIGNATION"],
        },
      ],
      assetsOutsideContainer: [
        { id: BANK_ID, name: "Sổ đỏ", kind: "FILE" },
        { id: EXECUTOR_ID, name: "Ghi chú", kind: "TEXT" },
      ],
    });
    renderOverview();

    const doc = within(paper());
    expect(
      doc.getByText(/Gói "Thư gửi các con" \(2 tài sản\) chưa có người nhận/),
    ).toBeInTheDocument();
    expect(doc.getByRole("link", { name: "Chọn người nhận" })).toHaveAttribute(
      "href",
      `/dashboard/assets/groups/${LETTER_ID}`,
    );
    expect(
      doc.getByText(/Còn 2 tài sản chưa nằm trong gói nào nên sẽ không được bàn giao/),
    ).toBeInTheDocument();
  });

  it("câu trả lời cũ của Backend (không có recipients): Điều 2 dùng câu chung, không vỡ", () => {
    showPlan({ recipients: undefined, ownerFullName: undefined, ownerEmail: undefined });
    renderOverview();

    const doc = within(paper());
    expect(doc.getByText(/những người nhận mà tôi đã chỉ định cho từng gói/)).toBeInTheDocument();
    // Không có tên Chủ kho từ Backend thì dùng tài khoản đăng nhập.
    expect(doc.getAllByText("Tên đăng nhập khác")).toHaveLength(2);
  });
});

describe("hai ô chữ ký", () => {
  it("không ai ký: Chủ kho Chưa ký, Người thực thi Chưa có Người thực thi", () => {
    showPlan({ canActivate: false, executors: [] });
    renderOverview();

    const doc = within(paper());
    expect(doc.getByText("NGƯỜI LẬP DI CHÚC")).toBeInTheDocument();
    expect(doc.getByText("(Ký bằng mã PIN của kho)")).toBeInTheDocument();
    expect(doc.getByText("NGƯỜI THỰC THI DI CHÚC")).toBeInTheDocument();
    expect(
      doc.getByText(
        "(Ký nhận vai trò và phạm vi nhiệm vụ bằng mật khẩu tài khoản. Không xác nhận phần tài sản và người nhận.)",
      ),
    ).toBeInTheDocument();
    expect(doc.getByText("Chưa ký")).toBeInTheDocument();
    expect(doc.getByText("Chưa có Người thực thi")).toBeInTheDocument();
    expect(doc.queryByText("ĐÃ KÝ ĐIỆN TỬ")).not.toBeInTheDocument();
  });

  it("Người thực thi đã ký, Chủ kho chưa: một dấu ĐÃ KÝ ĐIỆN TỬ kèm tên và giờ", () => {
    showPlan();
    renderOverview();

    const doc = within(paper());
    expect(doc.getAllByText("ĐÃ KÝ ĐIỆN TỬ")).toHaveLength(1);
    expect(
      doc.getByText("Ký bằng mật khẩu tài khoản lúc 14:20 ngày 14/11/2026"),
    ).toBeInTheDocument();
    expect(doc.getByText("Chưa ký")).toBeInTheDocument();
    expect(doc.getByText("Ký ở khung bên phải sau khi điền đủ")).toBeInTheDocument();
  });

  it("đã mời nhưng chưa ký nhận vai: ô Người thực thi Chưa ký, Điều 1 còn chỗ trống", () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [executor({ status: "INVITED", acceptedAt: null })],
    });
    renderOverview();

    const doc = within(paper());
    expect(doc.getAllByText("Chưa ký")).toHaveLength(2);
    expect(doc.getByText(/chờ người này ký nhận vai/)).toBeInTheDocument();
    expect(doc.queryByText("ĐÃ KÝ ĐIỆN TỬ")).not.toBeInTheDocument();
  });

  it("cả hai đã ký (kế hoạch đang chạy): hai dấu, ngày lập và giờ ký của Chủ kho", () => {
    showPlan({ planStatus: "ACTIVE", canActivate: false, activatedAt: ACTIVATED_AT });
    renderOverview();

    const doc = within(paper());
    expect(doc.getAllByText("ĐÃ KÝ ĐIỆN TỬ")).toHaveLength(2);
    expect(doc.getByText("Lập ngày 15 tháng 11 năm 2026")).toBeInTheDocument();
    expect(doc.getByText("Lúc 09:42 ngày 15/11/2026")).toBeInTheDocument();
    expect(doc.queryByText("Chưa ký")).not.toBeInTheDocument();
  });

  it("kế hoạch không còn DRAFT nhưng thiếu activatedAt thì chưa tính là Chủ kho đã ký", () => {
    showPlan({ planStatus: "ACTIVE", canActivate: false, activatedAt: null });
    renderOverview();

    const doc = within(paper());
    expect(doc.getAllByText("ĐÃ KÝ ĐIỆN TỬ")).toHaveLength(1);
    expect(doc.getByText("Chưa ký")).toBeInTheDocument();
  });
});

describe("ô Ký di chúc và kích hoạt", () => {
  const SUCCESS_BODY = {
    ...setupData({ planStatus: "ACTIVE", canActivate: false, activatedAt: ACTIVATED_AT }),
    recipients: undefined,
  };

  async function tickAndType(pin: string) {
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Tôi đã đọc toàn bộ di chúc, tự nguyện lập, ký di chúc này và chủ động kích hoạt kế hoạch.",
      }),
    );
    await userEvent.type(screen.getByLabelText("Nhập mã PIN của kho (6 số)"), pin);
  }

  it("nút Ký và kích hoạt khóa theo từng bước và nói lý do", async () => {
    showPlan();
    renderOverview();

    const button = screen.getByRole("button", { name: "Ký và kích hoạt" });
    expect(button).toBeDisabled();
    expect(screen.getByText("Cần tick ô xác nhận phía trên.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByText("Nhập đủ 6 số của mã PIN.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Nhập mã PIN của kho (6 số)"), "48291");
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Nhập mã PIN của kho (6 số)"), "3");
    expect(button).toBeEnabled();
  });

  it("chưa đủ điều kiện: ô PIN và nút ký khóa, lý do nói còn điều kiện chưa đạt", () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [],
    });
    renderOverview();

    expect(screen.getByRole("button", { name: "Ký và kích hoạt" })).toBeDisabled();
    expect(screen.getByLabelText("Nhập mã PIN của kho (6 số)")).toBeDisabled();
    expect(screen.getByText("Còn điều kiện chưa đạt trong di chúc.")).toBeInTheDocument();
    expect(screen.getByText("Còn 1 điều kiện chưa đạt")).toBeInTheDocument();
  });

  it("gửi mã PIN ở header X-Vault-Pin (không trong body) và không để PIN lại trên màn hình", async () => {
    showPlan();
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(SUCCESS_BODY as never);
    renderOverview();

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

    await tickAndType("111222");
    await userEvent.click(screen.getByRole("button", { name: "Ký và kích hoạt" }));

    expect(await screen.findByText("Mã PIN không đúng. Còn 4 lần thử.")).toBeVisible();
    const input = screen.getByLabelText("Nhập mã PIN của kho (6 số)");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Gõ lại thì thông báo lỗi PIN mất đi.
    await userEvent.type(input, "9");
    expect(screen.queryByText("Mã PIN không đúng. Còn 4 lần thử.")).not.toBeInTheDocument();
  });

  it("PIN bị khóa: hiện thông báo khóa và khóa ô PIN cùng nút ký", async () => {
    showPlan();
    vi.spyOn(apiClient, "post").mockRejectedValue(pinProblem("VAULT_PIN_LOCKED", {}, 423));
    renderOverview();

    await tickAndType(PIN);
    await userEvent.click(screen.getByRole("button", { name: "Ký và kích hoạt" }));

    expect(await screen.findByText(/Mã PIN đang bị khóa tạm vì nhập sai nhiều lần/)).toBeVisible();
    expect(screen.getByLabelText("Nhập mã PIN của kho (6 số)")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ký và kích hoạt" })).toBeDisabled();
  });

  it("đang gửi: nút đổi thành Đang kiểm tra… và có dòng chờ xác nhận", async () => {
    showPlan();
    vi.spyOn(apiClient, "post").mockReturnValue(new Promise(() => undefined) as never);
    renderOverview();

    await tickAndType(PIN);
    await userEvent.click(screen.getByRole("button", { name: "Ký và kích hoạt" }));

    expect(await screen.findByRole("button", { name: "Đang kiểm tra…" })).toBeDisabled();
    expect(screen.getByText("Chờ hệ thống xác nhận mã PIN.")).toBeInTheDocument();
  });

  it("hiện cảnh báo thiếu Người thực thi dự phòng", () => {
    showPlan({ warnings: ["NO_BACKUP_EXECUTOR"] });
    renderOverview();

    expect(
      screen.getByText("Chưa có Người thực thi dự phòng. Bạn vẫn kích hoạt được."),
    ).toBeInTheDocument();
  });

  it("đã mời nhưng chưa chấp nhận: dòng chờ ở danh sách điều kiện, không còn nút mời", () => {
    showPlan({
      canActivate: false,
      missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
      executors: [
        executor({ status: "INVITED", acceptedAt: null, inviteeEmail: "hai@example.test" }),
      ],
    });
    renderOverview();

    expect(screen.getByText("Đã mời hai@example.test, đang chờ chấp nhận")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mời Người thực thi" })).not.toBeInTheDocument();
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

  it("di chúc đủ hai chữ ký cùng thẻ điểm danh, Kế hoạch đang áp dụng, Mã mở gói và tiến trình", async () => {
    showRunning();
    renderOverview();

    expect(screen.getByText("Kế hoạch đang chạy")).toBeInTheDocument();
    expect(within(paper()).getAllByText("ĐÃ KÝ ĐIỆN TỬ")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Điểm danh" })).toBeEnabled();
    const active = screen.getByRole("region", { name: "Kế hoạch đang áp dụng" });
    expect(within(active).getByText("Kích hoạt lúc")).toBeInTheDocument();
    expect(within(active).getByText("09:42 15/11/2026")).toBeInTheDocument();
    expect(await screen.findByText("Đã có · Bản 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mã mở gói" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tiến trình bàn giao" })).toBeInTheDocument();
    // Không còn ô ký ở trạng thái đã chạy.
    expect(screen.queryByRole("button", { name: "Ký và kích hoạt" })).not.toBeInTheDocument();
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

  it("In di chúc gọi window.print, đặt tên tệp rồi trả tên cũ sau khi in", async () => {
    showRunning();
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const titleBefore = document.title;
    renderOverview();

    await userEvent.click(screen.getByRole("button", { name: "In di chúc" }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.title).toBe("Di-chuc");
    window.dispatchEvent(new Event("afterprint"));
    expect(document.title).toBe(titleBefore);
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
