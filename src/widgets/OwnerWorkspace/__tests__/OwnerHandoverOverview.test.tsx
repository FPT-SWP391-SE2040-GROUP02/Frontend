import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { useOwnerDeathCase } from "@/features/owner-objection/model/useOwnerDeathCase";
import { OwnerHandoverOverview } from "../OwnerHandoverOverview";

vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({ usePlanSetup: vi.fn() }));
vi.mock("@/features/dms/model/useCheckIn", () => ({ useCheckIn: vi.fn() }));
vi.mock("@/features/owner-objection/model/useOwnerDeathCase", () => ({
  useOwnerDeathCase: vi.fn(),
}));
vi.mock("@/features/dms/api/checkInService", () => ({ checkInService: { checkIn: vi.fn() } }));

const VAULT_ID = "22222222-2222-4222-8222-222222222222";

function planSetupResult(executors: unknown[]) {
  return {
    isPending: false,
    isError: false,
    isFetching: false,
    data: { executors },
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

function deathCaseResult(data: unknown) {
  return { isPending: false, isError: false, isFetching: false, data, refetch: vi.fn() };
}

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});

function renderOverview() {
  return render(
    <QueryClientProvider client={client}>
      <OwnerHandoverOverview vaultId={VAULT_ID} />
    </QueryClientProvider>,
  );
}

describe("tổng quan bàn giao của Chủ kho", () => {
  it("hiện quy trình 5 bước, cần mời Người thực hiện và chưa có yêu cầu bàn giao", () => {
    vi.mocked(usePlanSetup).mockReturnValue(planSetupResult([]) as never);
    vi.mocked(useCheckIn).mockReturnValue(checkInResult("ACTIVE") as never);
    vi.mocked(useOwnerDeathCase).mockReturnValue(deathCaseResult(null) as never);
    renderOverview();

    expect(screen.getByRole("heading", { name: "Quy trình bàn giao" })).toBeInTheDocument();
    expect(screen.getByText("Tải nội dung 7 ngày")).toBeInTheDocument();
    expect(screen.getByText("Cần mời")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mời người thực hiện" })).toHaveAttribute(
      "href",
      "#kich-hoat-ke-hoach",
    );
    expect(screen.getByText("Hệ thống phân công")).toBeInTheDocument();
    expect(screen.getByText(/Chưa có yêu cầu bàn giao/)).toBeInTheDocument();
    expect(screen.getByText("Điều 4. Thời gian phản đối 72 giờ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh" })).toBeEnabled();
  });

  it("hiện Người thực hiện đã xác nhận và khóa điểm danh khi kế hoạch còn nháp", () => {
    vi.mocked(usePlanSetup).mockReturnValue(
      planSetupResult([
        { id: "e1", role: "PRIMARY", status: "ACCEPTED", inviteeEmail: "hai@example.test" },
        { id: "e2", role: "BACKUP", status: "REVOKED", inviteeEmail: "cu@example.test" },
      ]) as never,
    );
    vi.mocked(useCheckIn).mockReturnValue(checkInResult("DRAFT") as never);
    vi.mocked(useOwnerDeathCase).mockReturnValue(deathCaseResult(null) as never);
    renderOverview();

    expect(screen.getByText("hai@example.test")).toBeInTheDocument();
    expect(screen.getByText("Đã xác nhận lời mời")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mời người thực hiện" })).not.toBeInTheDocument();
    expect(screen.getByText("Chưa có Executor dự phòng.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh" })).toBeDisabled();
  });

  it("hiện mã hồ sơ khi kho đang có yêu cầu bàn giao", () => {
    vi.mocked(usePlanSetup).mockReturnValue(planSetupResult([]) as never);
    vi.mocked(useCheckIn).mockReturnValue(checkInResult("ACTIVE") as never);
    vi.mocked(useOwnerDeathCase).mockReturnValue(
      deathCaseResult({
        caseId: "33333333-3333-4333-8333-333333333333",
        caseCode: "DC-0001",
        status: "UNDER_REVIEW",
        objectionEndsAt: null,
      }) as never,
    );
    renderOverview();

    expect(screen.getByText("DC-0001")).toBeInTheDocument();
    expect(screen.queryByText(/Chưa có yêu cầu bàn giao/)).not.toBeInTheDocument();
  });
});
