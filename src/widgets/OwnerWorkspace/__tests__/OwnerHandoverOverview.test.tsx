import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { planSetupService } from "@/features/plan-setup/api/planSetupService";
import { executorKeyService } from "@/features/executor-key/api/executorKeyService";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { OwnerHandoverOverview } from "../OwnerHandoverOverview";

vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({ usePlanSetup: vi.fn() }));
vi.mock("@/features/plan-setup/api/planSetupService", () => ({
  planSetupService: { activate: vi.fn() },
}));
vi.mock("@/features/executor-key/api/executorKeyService", () => ({
  executorKeyService: { getStatus: vi.fn(), issue: vi.fn(), reissue: vi.fn() },
}));
vi.mock("@/features/dms/model/useCheckIn", () => ({ useCheckIn: vi.fn() }));
vi.mock("@/features/dms/api/checkInService", () => ({ checkInService: { checkIn: vi.fn() } }));
vi.mock("@/shared/settings/usePolicyWindows", () => ({
  usePolicyWindows: () => ({ grantDays: 30 }),
}));

const VAULT_ID = "22222222-2222-4222-8222-222222222222";
const CONTAINER_ID = "33333333-3333-4333-8333-333333333333";
const SHARD = "ABCD-EFGH-JKMN-PQRS-TVWX-YZ01-2345-6789-ABCD-EFGH-JKMN-PQRS-TVWX";
const SLIP_NAME = "Phiếu bàn giao mã mở gói";

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
    executors: [{ id: "e1", status: "ACCEPTED", inviteeEmail: "thuc-thi@example.test" }],
    containers: [
      {
        id: CONTAINER_ID,
        name: "Gói gia đình",
        status: "READY",
        assetCount: 3,
        designationCount: 2,
        missingRequirements: [],
      },
    ],
    assetsOutsideContainer: [],
    warnings: [],
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

function checkInResult(planStatus: string) {
  return {
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: {
      status: "ACTIVE",
      planStatus,
      serverTime: "2026-10-08T00:00:00Z",
      lastCheckInAt: "2026-10-02T00:00:00Z",
      nextCheckInDueAt: "2026-11-01T00:00:00Z",
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

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  accessTokenMemory.set("test-token");
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(useCheckIn).mockReturnValue(checkInResult("ACTIVE") as never);
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderOverview() {
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
          <OwnerHandoverOverview vaultId={VAULT_ID} vaultName="Kho gia đình" />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("trang Bàn giao: kế hoạch còn nháp", () => {
  it("chưa mời Người thực thi: dòng điều kiện có nút Mời Người thực thi, không có điểm danh, chỉ một danh sách 4 bước", () => {
    vi.mocked(usePlanSetup).mockReturnValue(
      planSetupResult(
        setupData({
          canActivate: false,
          missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
          executors: [],
        }),
      ) as never,
    );
    renderOverview();

    expect(screen.getByText("Kế hoạch chưa kích hoạt")).toBeInTheDocument();
    expect(
      screen.getByText("Hoàn thành các việc dưới đây để kế hoạch bàn giao bắt đầu chạy."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Việc cần làm để kích hoạt" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mời Người thực thi" })).toHaveAttribute(
      "href",
      "/dashboard/trusted-people",
    );
    expect(
      screen.getByText(/Mã mở gói: bạn nhận ngay sau khi kích hoạt, kèm phiếu/),
    ).toBeInTheDocument();

    // CheckInCard không render trước kích hoạt, chỉ có một dòng chữ.
    expect(screen.queryByRole("button", { name: "Điểm danh" })).not.toBeInTheDocument();
    expect(useCheckIn).not.toHaveBeenCalled();
    expect(screen.getByText("Điểm danh định kỳ bắt đầu sau khi kích hoạt.")).toBeInTheDocument();

    // Chỉ một danh sách 4 bước, không còn thẻ Quy trình / Trạng thái / Người tin cậy.
    expect(screen.getByRole("heading", { name: "Bàn giao diễn ra thế nào" })).toBeInTheDocument();
    expect(screen.getAllByText("Báo tin")).toHaveLength(1);
    expect(screen.getAllByText("Xét duyệt")).toHaveLength(1);
    expect(screen.getByText("Người nhận xác nhận")).toBeInTheDocument();
    expect(screen.getByText("Nhập mã và tải")).toBeInTheDocument();
    expect(screen.getByText(/tải trong 30 ngày/)).toBeInTheDocument();
    expect(screen.queryByText("Xác minh người nhận")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Quy trình bàn giao" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Trạng thái hiện tại" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Người tin cậy" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Người thực hiện/)).not.toBeInTheDocument();

    // Chưa đủ điều kiện: nút khóa và có lý do bên cạnh.
    expect(screen.getByRole("button", { name: "Kích hoạt kế hoạch" })).toBeDisabled();
    expect(screen.getByText("Còn điều kiện chưa đạt ở trên.")).toBeInTheDocument();
  });

  it("đã mời nhưng chưa chấp nhận: hiện dòng chờ, không còn nút mời", () => {
    vi.mocked(usePlanSetup).mockReturnValue(
      planSetupResult(
        setupData({
          canActivate: false,
          missingRequirements: ["PRIMARY_EXECUTOR_REQUIRED"],
          executors: [{ id: "e1", status: "INVITED", inviteeEmail: "hai@example.test" }],
        }),
      ) as never,
    );
    renderOverview();

    expect(screen.getByText("Đã mời hai@example.test, đang chờ chấp nhận")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mời Người thực thi" })).not.toBeInTheDocument();
  });

  it("hiện soát lại trước khi kích hoạt và cảnh báo thiếu Người thực thi dự phòng", () => {
    vi.mocked(usePlanSetup).mockReturnValue(
      planSetupResult(
        setupData({
          warnings: ["NO_BACKUP_EXECUTOR"],
          assetsOutsideContainer: [{ id: CONTAINER_ID, name: "Sổ đỏ", kind: "FILE" }],
        }),
      ) as never,
    );
    renderOverview();

    expect(
      screen.getByRole("heading", { name: "Soát lại trước khi kích hoạt" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Gói gia đình")).toBeInTheDocument();
    expect(screen.getByText(/Sổ đỏ/)).toBeInTheDocument();
    expect(
      screen.getByText("Chưa có Người thực thi dự phòng. Bạn vẫn kích hoạt được."),
    ).toBeInTheDocument();
  });

  it("kích hoạt xong rồi cấp mã thành công: hiện phiếu có mã, Hoàn tất khóa đến khi tick, tải phiếu gọi window.print", async () => {
    vi.mocked(usePlanSetup).mockReturnValue(planSetupResult(setupData()) as never);
    vi.mocked(planSetupService.activate).mockResolvedValue(
      setupData({ planStatus: "ACTIVE", canActivate: false }) as never,
    );
    vi.mocked(executorKeyService.getStatus).mockResolvedValue(keyStatus());
    vi.mocked(executorKeyService.issue).mockResolvedValue({
      ...keyStatus({ hasKey: true, version: 1, issuedAt: "2026-11-09T01:00:00Z" }),
      shard: SHARD,
    });
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const titleBefore = document.title;
    renderOverview();

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Kích hoạt kế hoạch" }));

    expect(
      await screen.findByRole("heading", {
        name: "Kế hoạch đã kích hoạt. Còn một việc: lưu mã mở gói",
      }),
    ).toBeInTheDocument();
    expect(planSetupService.activate).toHaveBeenCalledWith(VAULT_ID, {
      configVersion: 3,
      policyVersion: "setup-test",
      acknowledgePolicy: true,
    });
    expect(executorKeyService.issue).toHaveBeenCalledWith(VAULT_ID);

    const slip = screen.getByRole("region", { name: SLIP_NAME });
    expect(within(slip).getByText(SHARD)).toBeInTheDocument();
    expect(within(slip).getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(within(slip).getByText("thuc-thi@example.test")).toBeInTheDocument();
    expect(within(slip).getByText("Kho gia đình")).toBeInTheDocument();
    expect(within(slip).getByText(/Bản 1 · một mã duy nhất/)).toBeInTheDocument();
    expect(screen.getByText(/Phiếu chỉ hiện lần này/)).toBeInTheDocument();

    // Mã không rò vào Web Storage.
    for (const storage of [window.localStorage, window.sessionStorage]) {
      for (let index = 0; index < storage.length; index = index + 1) {
        const key = storage.key(index);
        expect(key).not.toBeNull();
        if (key !== null) {
          expect(key).not.toContain(SHARD);
          expect(storage.getItem(key) ?? "").not.toContain(SHARD);
        }
      }
    }

    // Tải phiếu: đổi tên tài liệu tạm thời, gọi window.print, trả lại tên sau afterprint.
    await userEvent.click(screen.getByRole("button", { name: "Tải phiếu (PDF)" }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.title).toBe("Phieu-ban-giao-ma-mo-goi-ban-1");
    window.dispatchEvent(new Event("afterprint"));
    expect(document.title).toBe(titleBefore);

    // Hoàn tất khóa đến khi tick; xong thì xóa mã khỏi màn hình.
    const done = screen.getByRole("button", { name: "Hoàn tất" });
    expect(done).toBeDisabled();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Tôi đã tải phiếu hoặc chép mã ra nơi an toàn" }),
    );
    expect(done).toBeEnabled();
    await userEvent.click(done);
    await waitFor(() => expect(screen.queryByText(SHARD)).not.toBeInTheDocument());
  });

  it("cấp mã lỗi sau khi kích hoạt: kế hoạch vẫn chạy, hiện dải chưa có mã mở gói và nút Tạo mã mở gói", async () => {
    vi.mocked(usePlanSetup).mockReturnValue(planSetupResult(setupData()) as never);
    vi.mocked(planSetupService.activate).mockImplementation(async () => {
      // Backend đã kích hoạt: các lần đọc kế hoạch sau đó thấy ACTIVE.
      vi.mocked(usePlanSetup).mockReturnValue(
        planSetupResult(setupData({ planStatus: "ACTIVE", canActivate: false })) as never,
      );
      return setupData({ planStatus: "ACTIVE", canActivate: false }) as never;
    });
    vi.mocked(executorKeyService.getStatus).mockResolvedValue(keyStatus());
    vi.mocked(executorKeyService.issue).mockRejectedValueOnce(new Error("huy-pin"));
    renderOverview();

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Kích hoạt kế hoạch" }));

    expect(await screen.findByText(/Kế hoạch đang chạy nhưng chưa có mã mở gói/)).toBeVisible();
    expect(screen.getByText(/Không có mã thì người nhận không mở được tài sản/)).toBeVisible();
    expect(screen.getByText("Kế hoạch đang chạy")).toBeInTheDocument();
    expect(screen.queryByText(SHARD)).not.toBeInTheDocument();

    // Bấm Tạo mã mở gói gọi lại issue và hiện phiếu.
    vi.mocked(executorKeyService.issue).mockResolvedValueOnce({
      ...keyStatus({ hasKey: true, version: 1, issuedAt: "2026-11-09T01:00:00Z" }),
      shard: SHARD,
    });
    await userEvent.click(screen.getByRole("button", { name: "Tạo mã mở gói" }));
    expect(
      await screen.findByRole("heading", {
        name: "Kế hoạch đã kích hoạt. Còn một việc: lưu mã mở gói",
      }),
    ).toBeInTheDocument();
    expect(executorKeyService.issue).toHaveBeenCalledTimes(2);
    expect(
      within(screen.getByRole("region", { name: SLIP_NAME })).getByText(SHARD),
    ).toBeInTheDocument();
  });

  it("kho đã có mã khi kích hoạt xong: không gọi issue, về thẳng trạng thái đang chạy", async () => {
    vi.mocked(usePlanSetup).mockReturnValue(planSetupResult(setupData()) as never);
    vi.mocked(planSetupService.activate).mockImplementation(async () => {
      vi.mocked(usePlanSetup).mockReturnValue(
        planSetupResult(setupData({ planStatus: "ACTIVE", canActivate: false })) as never,
      );
      return setupData({ planStatus: "ACTIVE", canActivate: false }) as never;
    });
    vi.mocked(executorKeyService.getStatus).mockResolvedValue(
      keyStatus({ hasKey: true, version: 2, issuedAt: "2026-11-09T01:00:00Z" }),
    );
    renderOverview();

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Kích hoạt kế hoạch" }));

    expect(await screen.findByText("Đã cấp · Bản 2")).toBeInTheDocument();
    expect(executorKeyService.issue).not.toHaveBeenCalled();
  });
});

describe("trang Bàn giao: kế hoạch đã chạy", () => {
  function mockRunning(canIssue: boolean) {
    vi.mocked(usePlanSetup).mockReturnValue(
      planSetupResult(
        setupData({
          planStatus: "ACTIVE",
          canActivate: false,
          assetsOutsideContainer: [{ id: CONTAINER_ID, name: "Tài sản thêm sau", kind: "TEXT" }],
        }),
      ) as never,
    );
    vi.mocked(executorKeyService.getStatus).mockResolvedValue(
      keyStatus({ hasKey: true, version: 1, issuedAt: "2026-11-09T01:00:00Z", canIssue }),
    );
  }

  it("hiện thẻ Mã mở gói, gói sẽ bàn giao, điểm danh và tiến trình bàn giao", async () => {
    mockRunning(true);
    renderOverview();

    expect(screen.getByText("Kế hoạch đang chạy")).toBeInTheDocument();
    expect(await screen.findByText("Đã cấp · Bản 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mã mở gói" })).toBeInTheDocument();
    expect(screen.getByText("Người giữ: thuc-thi@example.test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mất mã? Cấp lại" })).toBeEnabled();
    expect(screen.getByRole("heading", { name: "Gói sẽ bàn giao" })).toBeInTheDocument();
    expect(screen.getByText(/Tài sản thêm sau/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh" })).toBeEnabled();
    expect(screen.getByRole("heading", { name: "Tiến trình bàn giao" })).toBeInTheDocument();
    expect(screen.getByText(/Chưa có báo tin\./)).toBeInTheDocument();
    expect(screen.queryByText(/chưa có mã mở gói/)).not.toBeInTheDocument();
  });

  it("kế hoạch bị khóa: ẩn nút cấp lại và giải thích", async () => {
    mockRunning(false);
    renderOverview();

    expect(await screen.findByText("Kế hoạch đang bị khóa nên không cấp lại được.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Mất mã? Cấp lại" })).not.toBeInTheDocument();
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
