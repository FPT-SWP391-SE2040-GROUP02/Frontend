import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import { OwnerDashboard } from "../OwnerDashboard";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { backendAssetService } from "@/features/assets/api/backendAssetService";
import { beneficiaryService } from "@/features/beneficiaries/api/beneficiaryService";
import { checkInService } from "@/features/dms/api/checkInService";
import { planSetupService } from "@/features/plan-setup/api/planSetupService";
import { auditLogService } from "@/features/audit-logs/api/auditLogService";
import { ownerObjectionService } from "@/features/owner-objection/api/ownerObjectionService";
import { planSetupSchema } from "@/features/plan-setup/model/planSetup.schema";
import { checkInStatusSchema } from "@/features/dms/model/checkIn.schema";
import {
  vaultFixture,
  pageFixture,
  VAULT_ID,
  CREATED_AT,
} from "@/shared/api/__tests__/backend.fixtures";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";

let client: QueryClient;
const vault = {
  ...vaultFixture,
  storageUsedBytes: 7 * 1_048_576,
  storageQuotaBytes: 200 * 1_048_576,
};
const setupFixture = () =>
  planSetupSchema.parse({
    planStatus: "DRAFT",
    configVersion: 1,
    canActivate: false,
    missingRequirements: ["OWNER_EKYC_REQUIRED", "PRIMARY_EXECUTOR_REQUIRED"],
    policyVersion: "1",
    policyText: "Test policy",
    executorScopeVersion: "1",
    executorScopeText: "Test scope",
    executors: [],
    containers: [],
    assetsOutsideContainer: [],
    warnings: [],
  });
const checkInFixture = () =>
  checkInStatusSchema.parse({
    status: "NOT_STARTED",
    planStatus: "DRAFT",
    serverTime: CREATED_AT,
    lastCheckInAt: null,
    nextCheckInDueAt: null,
    graceEndsAt: null,
    settings: {
      cycleDays: 60,
      graceDays: 7,
      pendingCycleDays: null,
      pendingGraceDays: null,
      etag: "test",
    },
    history: pageFixture([]),
  });

function problem(code: string, status: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("Test response", undefined, config, undefined, {
    status,
    statusText: "Test",
    headers: {},
    config,
    data: { code },
  });
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("dashboard-fixture-access");
  vi.spyOn(ownerVaultService, "getMine").mockResolvedValue(vault);
  vi.spyOn(backendAssetService, "list").mockResolvedValue(pageFixture([]));
  vi.spyOn(beneficiaryService, "list").mockResolvedValue(pageFixture([]));
  vi.spyOn(checkInService, "get").mockResolvedValue(checkInFixture());
  vi.spyOn(planSetupService, "get").mockResolvedValue(setupFixture());
  vi.spyOn(auditLogService, "list").mockResolvedValue(pageFixture([]));
  vi.spyOn(ownerObjectionService, "get").mockRejectedValue(problem("DEATH_CASE_NOT_FOUND", 404));
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});
function mount(enabled = true) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OwnerDashboard enabled={enabled} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Owner dashboard from server metadata", () => {
  it("keeps the executor step incomplete when server readiness rejects an accepted invitation", async () => {
    const setup = setupFixture();
    setup.executors = [
      {
        id: VAULT_ID,
        role: "PRIMARY",
        status: "ACCEPTED",
        inviteeEmail: "executor@example.test",
        isBeneficiary: false,
        expiresAt: CREATED_AT,
        acceptedAt: CREATED_AT,
        invitationSentAt: CREATED_AT,
        acceptedScopeVersion: "1",
        etag: "test",
      },
    ];
    vi.mocked(planSetupService.get).mockResolvedValue(setup);
    mount();
    const step = await screen.findByText("Người thực hiện chính chấp nhận nhiệm vụ");
    expect(within(step.closest("li")!).getByRole("link", { name: "Làm ngay" })).toBeInTheDocument();
  });
  it("does not request private resources without a ready session", () => {
    mount(false);
    expect(screen.getByRole("status")).toHaveTextContent("Vui lòng đăng nhập");
    expect(ownerVaultService.getMine).not.toHaveBeenCalled();
    expect(backendAssetService.list).not.toHaveBeenCalled();
    expect(planSetupService.get).not.toHaveBeenCalled();
  });

  it("does not mount dependent queries while the vault is loading", () => {
    vi.mocked(ownerVaultService.getMine).mockReturnValue(new Promise(() => {}));
    mount();
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải tổng quan");
    expect(backendAssetService.list).not.toHaveBeenCalled();
  });

  it("shows the layout with real quota, no inline eKYC and no mutations on mount", async () => {
    const post = vi.spyOn(apiClient, "post");
    mount();
    expect(
      await screen.findByRole("heading", { name: "Kế hoạch đang được chuẩn bị" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Thống kê kho" })).toHaveTextContent("7 MB / 200 MB");
    expect(await screen.findByRole("link", { name: "Xác minh ngay" })).toHaveAttribute(
      "href",
      "/dashboard/identity",
    );
    expect(screen.queryByText(/OWNER_ENROLLMENT/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tôi đồng ý và tiếp tục" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh" })).toBeDisabled();
    expect(screen.queryByText("Kho đang an toàn")).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("uses totalCount and server sorting rather than counting only the loaded page", async () => {
    vi.mocked(backendAssetService.list).mockResolvedValue({ ...pageFixture([]), totalCount: 27 });
    mount();
    await screen.findByRole("heading", { name: "Tài sản mới thêm" });
    await vi.waitFor(() =>
      expect(screen.getByRole("region", { name: "Thống kê kho" })).toHaveTextContent("27"),
    );
    expect(backendAssetService.list).toHaveBeenCalledWith(
      VAULT_ID,
      { pageIndex: 1, pageSize: 5, sortBy: "createdAt", isAscending: false },
      expect.any(AbortSignal),
    );
  });

  it("keeps storage visible when the assets endpoint fails and offers retry", async () => {
    vi.mocked(backendAssetService.list).mockRejectedValue(new Error("test unavailable"));
    mount();
    const section = await screen.findByRole("region", { name: "Tài sản mới thêm" });
    expect(await within(section).findByRole("alert")).toHaveTextContent("Không tải được dữ liệu");
    expect(within(section).queryByText("Kho chưa có tài sản.")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Thống kê kho" })).toHaveTextContent("7 MB / 200 MB");
    vi.mocked(backendAssetService.list).mockResolvedValue(pageFixture([]));
    fireEvent.click(within(section).getByRole("button", { name: "Thử lại" }));
    expect(await within(section).findByText("Kho chưa có tài sản.")).toBeInTheDocument();
  });

  it("does not claim no death case when the server cannot check it", async () => {
    vi.mocked(ownerObjectionService.get).mockRejectedValue(new Error("test unavailable"));
    mount();
    expect(await screen.findByText(/Chưa kiểm tra được hồ sơ chứng tử/)).toBeInTheDocument();
    expect(screen.queryByText("Không có hồ sơ chứng tử đang mở.")).not.toBeInTheDocument();
  });

  it("preserves the real owner objection warning and action", async () => {
    vi.mocked(ownerObjectionService.get).mockResolvedValue({
      caseId: VAULT_ID,
      caseCode: "TEST-CASE",
      status: "UNDER_REVIEW",
      objectionStartsAt: null,
      objectionEndsAt: null,
      objection: null,
    });
    mount();
    expect(await screen.findByRole("button", { name: "Tôi còn sống" })).toBeInTheDocument();
    expect(screen.getByText(/Có hồ sơ chứng tử trên kho/)).toBeInTheDocument();
  });

  it("offers creation for a missing vault without querying child resources", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue(problem("VAULT_NOT_FOUND", 404));
    mount();
    expect(await screen.findByRole("region", { name: "Tạo kho di sản" })).toBeInTheDocument();
    expect(backendAssetService.list).not.toHaveBeenCalled();
  });

  it("keeps an unknown 404 visible instead of inventing an empty vault", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue(problem("NOT_FOUND", 404));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được kho");
    expect(screen.queryByRole("region", { name: "Tạo kho di sản" })).not.toBeInTheDocument();
  });

  it("waits for check-in confirmation and synchronizes the existing cache", async () => {
    vi.mocked(checkInService.get).mockResolvedValue({
      ...checkInFixture(),
      status: "ACTIVE",
      planStatus: "ACTIVE",
    });
    let finish: (value: ReturnType<typeof checkInFixture>) => void = () => {};
    const submit = vi.spyOn(checkInService, "checkIn").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    mount();
    const button = await screen.findByRole("button", { name: "Điểm danh" });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Đang gửi yêu cầu…" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Đã điểm danh hôm nay" })).not.toBeInTheDocument();
    const checkedIn: ReturnType<typeof checkInFixture> = {
      ...checkInFixture(),
      status: "ACTIVE",
      planStatus: "ACTIVE",
      lastCheckInAt: CREATED_AT,
      serverTime: CREATED_AT,
    };
    vi.mocked(checkInService.get).mockResolvedValue(checkedIn);
    finish(checkedIn);
    expect(await screen.findByRole("button", { name: "Đã điểm danh hôm nay" })).toBeDisabled();
    expect(submit).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(auditLogService.list).toHaveBeenCalledTimes(2));
  });
});
