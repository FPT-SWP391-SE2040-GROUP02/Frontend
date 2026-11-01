import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { checkInService } from "@/features/dms/api/checkInService";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerCheckIn } from "../OwnerCheckIn";

vi.mock("@/features/dms/model/useCheckIn", () => ({ useCheckIn: vi.fn() }));
vi.mock("@/features/dms/api/checkInService", () => ({
  checkInService: { checkIn: vi.fn(), updateSettings: vi.fn(), getSmartwatchPairingCode: vi.fn() },
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
  accessTokenMemory.clear();
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
    expect(rows[2]).toHaveTextContent("Điểm danh");
    expect(rows[0]).toHaveTextContent("Bắt đầu");
  });

  it("kỳ bị dừng khi kế hoạch về Nháp hiện Đã dừng, không phải Đang chạy", () => {
    vi.mocked(useCheckIn).mockReturnValue(
      statusResult({}, [
        period(1, { closedAt: "2026-09-10T00:00:00Z" }),
        period(2, { startedAt: "2026-09-11T00:00:00Z" }),
      ]) as never,
    );
    renderCheckIn();
    const rows = within(screen.getByRole("region", { name: "Lịch sử điểm danh" })).getAllByRole(
      "listitem",
    );
    expect(rows[0]).toHaveTextContent("Kỳ 2");
    expect(rows[0]).toHaveTextContent("Đang chạy");
    expect(rows[1]).toHaveTextContent("Kỳ 1");
    expect(rows[1]).toHaveTextContent("Đã dừng");
    expect(rows[1]).toHaveTextContent("vì kế hoạch về Nháp");
    expect(rows[1]).not.toHaveTextContent("Đang chạy");
  });

  it("chưa có kỳ nào thì báo trống; không bịa công tắc cài đặt nhắc", () => {
    vi.mocked(useCheckIn).mockReturnValue(statusResult() as never);
    renderCheckIn();
    expect(screen.getByText("Chưa có lần điểm danh nào.")).toBeInTheDocument();
    // Backend gửi email nhắc trước hạn 7 ngày và 1 ngày (CheckInReminderKind): chỉ hiện thông tin, không có công tắc.
    expect(screen.getByText("Gửi trước hạn 7 ngày và 1 ngày")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  // Tạm tắt cùng nút "Kết nối đồng hồ" (Coming soon); bật lại khi mở lại tính năng ghép đồng hồ.
  it.skip("bấm Kết nối đồng hồ thì xin mã ghép và hiện 6 số kèm thời hạn", async () => {
    vi.mocked(useCheckIn).mockReturnValue(statusResult() as never);
    const pairingCode = vi
      .mocked(checkInService.getSmartwatchPairingCode)
      .mockResolvedValue({ code: "482915", expiresInSeconds: 300 });
    accessTokenMemory.set("owner-fixture");
    renderCheckIn();
    expect(pairingCode).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Kết nối đồng hồ" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Kết nối đồng hồ thông minh");
    expect(screen.getByRole("group", { name: "Mã ghép nối 4 8 2 9 1 5" })).toBeInTheDocument();
    expect(screen.getByText(/Mã hết hạn sau 0[45]:\d\d/)).toBeInTheDocument();
    expect(pairingCode).toHaveBeenCalledTimes(1);
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

  it("khóa nút cả ngày sau khi đã điểm danh từ nhiều giờ trước, kể cả khi mở lại trang", () => {
    vi.mocked(useCheckIn).mockReturnValue(
      statusResult({
        serverTime: "2026-10-08T08:00:00Z",
        lastCheckInAt: "2026-10-08T00:00:00Z",
      }) as never,
    );
    renderCheckIn();
    const button = screen.getByRole("button", { name: "Đã điểm danh hôm nay" });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Đã ghi nhận điểm danh/)).toBeInTheDocument();
  });

  it("mở lại nút lúc 00:00 Việt Nam dù lần trước mới cách một giây", () => {
    vi.mocked(useCheckIn).mockReturnValue(
      statusResult({
        serverTime: "2026-10-08T17:00:00Z",
        lastCheckInAt: "2026-10-08T16:59:59Z",
      }) as never,
    );
    renderCheckIn();
    expect(screen.getByRole("button", { name: "Điểm danh bây giờ" })).toBeEnabled();
  });
});
