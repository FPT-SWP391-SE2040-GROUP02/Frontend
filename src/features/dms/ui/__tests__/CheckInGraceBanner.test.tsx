import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { checkInStatusSchema } from "../../model/checkIn.schema";
import { formatTimeLeft } from "../../model/checkInGrace";
import { CheckInGraceBanner } from "../CheckInGraceBanner";

afterEach(cleanup);

const vaultId = "550e8400-e29b-41d4-a716-446655440001";

function statusOf(status: string, graceEndsAt: string | null) {
  return checkInStatusSchema.parse({
    status,
    planStatus: status,
    serverTime: "2026-12-03T00:00:00Z",
    lastCheckInAt: "2026-11-01T00:00:00Z",
    nextCheckInDueAt: "2026-12-01T00:00:00Z",
    graceEndsAt,
    settings: {
      cycleDays: 30,
      graceDays: 7,
      pendingCycleDays: null,
      pendingGraceDays: null,
      etag: "0",
    },
    history: {
      items: [],
      totalCount: 0,
      pageIndex: 1,
      pageSize: 10,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  });
}

function renderWith(data: ReturnType<typeof statusOf>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["vault-check-in", vaultId], data);
  render(
    <QueryClientProvider client={client}>
      <CheckInGraceBanner vaultId={vaultId} />
    </QueryClientProvider>,
  );
}

describe("CheckInGraceBanner", () => {
  it("đang trong thời gian chờ: đếm ngược tới lúc Người thực hiện được yêu cầu kiểm tra", () => {
    renderWith(statusOf("CHECKIN_OVERDUE", "2026-12-08T05:00:00Z"));
    expect(screen.getByRole("heading", { name: "Bạn đã quá hạn điểm danh" })).toBeInTheDocument();
    expect(screen.getByText(/Còn 5 ngày 5 giờ/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Điểm danh ngay" })).toBeInTheDocument();
  });

  it("hết thời gian chờ: báo Người thực hiện đang được yêu cầu kiểm tra", () => {
    renderWith(statusOf("AWAITING_CHECK", "2026-12-02T00:00:00Z"));
    expect(
      screen.getByRole("heading", { name: "Đã hết thời gian chờ điểm danh" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Người thực hiện đang được yêu cầu/)).toBeInTheDocument();
  });

  it("điểm danh đúng hạn thì không hiện gì", () => {
    renderWith(statusOf("ACTIVE", "2026-12-08T00:00:00Z"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("định dạng thời gian còn lại", () => {
    expect(formatTimeLeft("2026-12-01T00:00:00Z", "2026-12-04T00:00:00Z")).toBe("3 ngày");
    expect(formatTimeLeft("2026-12-01T00:00:00Z", "2026-12-01T05:30:00Z")).toBe("5 giờ");
    expect(formatTimeLeft("2026-12-01T00:00:00Z", "2026-12-01T00:20:00Z")).toBe("dưới 1 giờ");
    expect(formatTimeLeft("2026-12-02T00:00:00Z", "2026-12-01T00:00:00Z")).toBe("dưới 1 giờ");
  });
});
