import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerCheckIn } from "../OwnerCheckIn";

vi.mock("@/features/dms/model/useCheckIn", () => ({ useCheckIn: vi.fn() }));
vi.mock("@/features/dms/api/checkInService", () => ({
  checkInService: { checkIn: vi.fn(), updateSettings: vi.fn() },
}));

const SERVER_TIME = "2026-10-08T00:00:00Z";

function period(sequence: number, overrides: Record<string, unknown> = {}) {
  return {
    sequence,
    startedAt: "2026-09-01T00:00:00Z",
    dueAt: "2026-10-01T00:00:00Z",
    graceEndsAt: "2026-10-08T00:00:00Z",
    checkedInAt: null,
    overdueAt: null,
    awaitingCheckAt: null,
    ...overrides,
  };
}

function statusResult(overrides: Record<string, unknown> = {}, history: unknown[] = []) {
  return {
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: {
      status: "ACTIVE",
      planStatus: "ACTIVE",
      serverTime: SERVER_TIME,
      lastCheckInAt: "2026-10-02T00:00:00Z",
      nextCheckInDueAt: "2026-11-01T06:41:00Z",
      graceEndsAt: null,
      settings: {
        cycleDays: 30,
        graceDays: 7,
        pendingCycleDays: null,
        pendingGraceDays: null,
        etag: "settings-v1",
      },
      history: { items: history, totalCount: history.length, hasNextPage: false },
      ...overrides,
    },
  };
}

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient();
});
afterEach(() => {
  cleanup();
  client.clear();
});

function renderCheckIn() {
  return render(
    <QueryClientProvider client={client}>
      <OwnerCheckIn vaultId={VAULT_ID} />
    </QueryClientProvider>,
  );
}

describe("màn Điểm danh định kỳ", () => {
  it("hiện hạn tiếp theo, đồng hồ đếm ngược theo giờ máy chủ và nút điểm danh", () => {
    vi.mocked(useCheckIn).mockReturnValue(statusResult() as never);
    renderCheckIn();
    expect(screen.getByRole("heading", { name: "Hạn tiếp theo: 01/11/2026" })).toBeInTheDocument();
    const timer = screen.getByRole("timer");
    // Từ 08/10 00:00 tới 01/11 06:41 là 24 ngày 6 giờ 41 phút.
    expect(within(timer).getByText("24")).toBeInTheDocument();
    expect(within(timer).getByText("06")).toBeInTheDocument();
    expect(within(timer).getByText("41")).toBeInTheDocument();
    expect(screen.getByText(/Lần gần nhất: 02\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh bây giờ" })).toBeEnabled();
  });

  it("kế hoạch nháp: chưa có hạn, không có đồng hồ và khóa nút điểm danh", () => {
    vi.mocked(useCheckIn).mockReturnValue(
      statusResult({ planStatus: "DRAFT", nextCheckInDueAt: null, lastCheckInAt: null }) as never,
    );
    renderCheckIn();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.getByText(/Chưa bắt đầu kỳ điểm danh/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh bây giờ" })).toBeDisabled();
  });

  it("quá hạn thì báo rõ thay vì đếm ngược số âm", () => {
    vi.mocked(useCheckIn).mockReturnValue(
      statusResult({
        status: "CHECKIN_OVERDUE",
        planStatus: "CHECKIN_OVERDUE",
        nextCheckInDueAt: "2026-10-01T00:00:00Z",
      }) as never,
    );
    renderCheckIn();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Đã quá hạn điểm danh");
  });

  it("lịch sử liệt kê kỳ mới nhất trước kèm trạng thái đã ghi, quá hạn, đang chạy", () => {
    vi.mocked(useCheckIn).mockReturnValue(
      statusResult({}, [
        period(1, { checkedInAt: "2026-09-02T01:14:00Z" }),
        period(2, { overdueAt: "2026-10-01T00:00:00Z" }),
        period(3),
      ]) as never,
    );
    renderCheckIn();
    const history = screen.getByRole("region", { name: "Lịch sử điểm danh" });
    const rows = within(history).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Kỳ 3");
    expect(rows[0]).toHaveTextContent("Đang chạy");
    expect(rows[1]).toHaveTextContent("Quá hạn");
    expect(rows[2]).toHaveTextContent("Đã ghi");
  });

  it("chưa có kỳ nào thì báo trống; không bịa cài đặt nhắc email hay tin nhắn", () => {
    vi.mocked(useCheckIn).mockReturnValue(statusResult() as never);
    renderCheckIn();
    expect(screen.getByText("Chưa có lần điểm danh nào.")).toBeInTheDocument();
    expect(screen.queryByText(/Nhắc qua email/)).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("giữ lỗi và cho thử lại thay vì hiện trạng thái rỗng", () => {
    vi.mocked(useCheckIn).mockReturnValue({
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: vi.fn(),
    } as never);
    renderCheckIn();
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được dữ liệu");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("khóa nút điểm danh khi vừa điểm danh trong vòng 60 giây", () => {
    vi.mocked(useCheckIn).mockReturnValue(
      statusResult({
        serverTime: "2026-10-08T00:00:30Z",
        lastCheckInAt: "2026-10-08T00:00:00Z",
      }) as never,
    );
    renderCheckIn();
    const button = screen.getByRole("button", { name: "Đã điểm danh" });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Đã ghi nhận điểm danh/)).toBeInTheDocument();
  });
});

