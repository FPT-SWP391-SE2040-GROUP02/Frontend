import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it } from "vitest";
import { checkInStatusSchema } from "../../model/checkIn.schema";
import { QuickCheckIn } from "../QuickCheckIn";

afterEach(cleanup);

it("nút tổng quan khóa theo dữ liệu server và mở lại khi server sang ngày mới", () => {
  const client = new QueryClient();
  const status = checkInStatusSchema.parse({
    status: "ACTIVE",
    planStatus: "ACTIVE",
    serverTime: "2026-10-24T08:00:00Z",
    lastCheckInAt: "2026-10-24T00:00:00Z",
    nextCheckInDueAt: null,
    graceEndsAt: null,
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
  const view = render(
    <QueryClientProvider client={client}>
      <QuickCheckIn vaultId="test-vault" status={status} />
    </QueryClientProvider>,
  );
  expect(screen.getByRole("button", { name: "Đã điểm danh hôm nay" })).toBeDisabled();
  view.rerender(
    <QueryClientProvider client={client}>
      <QuickCheckIn
        vaultId="test-vault"
        status={{ ...status, serverTime: "2026-10-24T17:00:00Z" }}
      />
    </QueryClientProvider>,
  );
  expect(screen.getByRole("button", { name: "Điểm danh" })).toBeEnabled();
  view.unmount();
  client.clear();
});

it("hiện Executor đã điểm danh hộ, khóa nút và không ghi ngày", () => {
  const client = new QueryClient();
  const status = checkInStatusSchema.parse({
    status: "ACTIVE",
    planStatus: "ACTIVE",
    serverTime: "2026-11-01T10:24:00Z",
    lastCheckInAt: "2026-09-02T08:00:00Z",
    checkedInByExecutorToday: true,
    nextCheckInDueAt: "2026-12-31T10:24:00Z",
    graceEndsAt: null,
    settings: {
      cycleDays: 60,
      graceDays: 14,
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
  const view = render(
    <QueryClientProvider client={client}>
      <QuickCheckIn vaultId="test-vault" status={status} />
    </QueryClientProvider>,
  );
  expect(screen.getByRole("button", { name: "Executor đã điểm danh hộ" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Executor đã điểm danh hộ bạn hôm nay");
  view.unmount();
  client.clear();
});
