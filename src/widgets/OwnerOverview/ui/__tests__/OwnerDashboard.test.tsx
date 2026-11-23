import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import authReducer from "@/entities/user/model/authSlice";
import { handoverRequestService } from "@/features/handover-request";
import { AxiosError, AxiosHeaders } from "axios";
import { OwnerDashboard } from "../OwnerDashboard";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { backendAssetService } from "@/features/assets/api/backendAssetService";
import { beneficiaryService } from "@/features/beneficiaries/api/beneficiaryService";
import { planSetupService } from "@/features/plan-setup/api/planSetupService";
import { auditLogService } from "@/features/audit-logs/api/auditLogService";
import { planSetupSchema } from "@/features/plan-setup/model/planSetup.schema";
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
    assignedAssetCount: 0,
    unassignedAssets: [],
    warnings: [],
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
  vi.spyOn(planSetupService, "get").mockResolvedValue(setupFixture());
  vi.spyOn(auditLogService, "list").mockResolvedValue(pageFixture([]));
  vi.spyOn(handoverRequestService, "available").mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});
function mount(enabled = true) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, isAuthenticated: true, isHydrating: false } },
  });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <OwnerDashboard enabled={enabled} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

const RECEIVE_CARD = "Tài sản được để lại cho bạn";
const availableRow = {
  vaultId: "11111111-1111-4111-8111-111111111111",
  beneficiaryId: "22222222-2222-4222-8222-222222222222",
  ownerName: "Nguyễn Thị A",
  status: "CODE_READY" as const,
  needsAction: true,
  canRequest: false,
  reviewReason: null,
  claimId: null,
  turnId: null,
};

describe("Owner dashboard from server metadata", () => {
  it("shows one card with the Owner name and a link to Nhận tài sản when a vault needs action", async () => {
    vi.mocked(handoverRequestService.available).mockResolvedValue([availableRow]);
    mount();
    const card = await screen.findByRole("region", { name: RECEIVE_CARD });
    expect(card).toHaveTextContent("Nguyễn Thị A để lại tài sản cho bạn");
    expect(within(card).getByRole("link", { name: "Mở trang Nhận tài sản" })).toHaveAttribute(
      "href",
      "/dashboard/receive-assets",
    );
    expect(screen.queryByText(/đã để lại cho bạn một gói/)).not.toBeInTheDocument();
  });

  it("hides the card when no vault needs action", async () => {
    vi.mocked(handoverRequestService.available).mockResolvedValue([
      { ...availableRow, status: "WAITING_OTHERS", needsAction: false },
    ]);
    mount();
    await screen.findByRole("heading", { name: "Tài sản mới thêm" });
    await vi.waitFor(() => expect(handoverRequestService.available).toHaveBeenCalled());
    expect(screen.queryByRole("region", { name: RECEIVE_CARD })).not.toBeInTheDocument();
  });

  it("keeps the executor step incomplete when server readiness rejects an accepted invitation", async () => {
    const setup = setupFixture();
    setup.executors = [
      {
        id: VAULT_ID,
        status: "ACCEPTED",
        inviteeEmail: "executor@example.test",
        expiresAt: CREATED_AT,
        acceptedAt: CREATED_AT,
        invitationSentAt: CREATED_AT,
        acceptedScopeVersion: "1",
        etag: "test",
      },
    ];
    vi.mocked(planSetupService.get).mockResolvedValue(setup);
    mount();
    const step = await screen.findByText("Chuẩn bị kế hoạch bàn giao");
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

  it("auto-creates a missing vault and opens the dashboard without a naming step", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue(problem("VAULT_NOT_FOUND", 404));
    const createMine = vi.spyOn(ownerVaultService, "createMine").mockResolvedValue(vault);
    mount();
    await screen.findByRole("heading", { name: "Tài sản mới thêm" });
    expect(createMine).toHaveBeenCalledTimes(1);
    expect(createMine).toHaveBeenCalledWith();
    expect(screen.queryByText("Đặt tên kho")).not.toBeInTheDocument();
  });

  it("asks to verify email when the vault cannot be created yet", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue(problem("VAULT_NOT_FOUND", 404));
    vi.spyOn(ownerVaultService, "createMine").mockRejectedValue(problem("EMAIL_NOT_VERIFIED", 403));
    mount();
    expect(await screen.findByText("Xác minh email để mở kho di sản")).toBeInTheDocument();
    expect(backendAssetService.list).not.toHaveBeenCalled();
  });

  it("keeps an unknown 404 visible instead of inventing an empty vault", async () => {
    vi.mocked(ownerVaultService.getMine).mockRejectedValue(problem("NOT_FOUND", 404));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được kho");
    expect(screen.queryByRole("region", { name: "Tạo kho di sản" })).not.toBeInTheDocument();
  });
});
