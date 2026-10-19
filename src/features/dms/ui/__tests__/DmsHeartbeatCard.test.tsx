import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_MESSAGES } from "@/shared/constants";
import type { DmsState } from "../../model/dms.types";
import { DmsHeartbeatCard } from "../DmsHeartbeatCard";

const query = vi.hoisted(() => ({
  data: undefined as DmsState | undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  isPinging: false,
  isTogglingPause: false,
}));

vi.mock("../../model/useDms", () => ({
  useDmsStatus: () => query,
  useSendPulsePing: () => ({ mutate: vi.fn(), isPending: query.isPinging }),
  useToggleDmsPause: () => ({ mutate: vi.fn(), isPending: query.isTogglingPause }),
}));

const fixture: DmsState = {
  status: "ACTIVE",
  lastPingAt: "2026-10-01T00:00:00Z",
  nextPingDeadline: "2026-10-31T00:00:00Z",
  daysRemaining: 25,
  hoursRemaining: 14,
  integritySealHash: "a".repeat(64),
  config: {
    checkIntervalDays: 30,
    gracePeriodDays: 7,
    reminderFrequencyDays: 3,
    channels: [],
    notifyExecutorOnGracePeriod: false,
  },
};

beforeEach(() => {
  query.data = fixture;
  query.isLoading = false;
  query.isError = false;
  query.isPinging = false;
  query.isTogglingPause = false;
  query.refetch.mockReset();
});
afterEach(cleanup);

describe("DmsHeartbeatCard presentation", () => {
  it("does not expose actions while loading", () => {
    query.isLoading = true;
    render(<DmsHeartbeatCard />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers retry when the query fails", () => {
    query.isError = true;
    render(<DmsHeartbeatCard />);
    expect(screen.getByRole("alert")).toHaveTextContent(APP_MESSAGES.ERROR.LOAD_FAILED);
    fireEvent.click(screen.getByRole("button", { name: APP_MESSAGES.UI.RETRY }));
    expect(query.refetch).toHaveBeenCalledOnce();
  });

  it("shows an empty state without fabricated heartbeat data", () => {
    query.data = undefined;
    render(<DmsHeartbeatCard />);
    expect(screen.getByRole("status")).toHaveTextContent(APP_MESSAGES.UI.EMPTY);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps configuration and history actions connected and copy accessible", () => {
    const onOpenConfig = vi.fn();
    const onOpenHistory = vi.fn();
    render(<DmsHeartbeatCard onOpenConfig={onOpenConfig} onOpenHistory={onOpenHistory} />);
    fireEvent.click(screen.getByRole("button", { name: "Cấu hình" }));
    fireEvent.click(screen.getByRole("button", { name: "Lịch sử ping" }));
    expect(onOpenConfig).toHaveBeenCalledOnce();
    expect(onOpenHistory).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Sao chép chuỗi mã băm" })).toBeVisible();
  });

  it("disables pending actions and shows the complete ping label", () => {
    query.isPinging = true;
    query.isTogglingPause = true;
    render(<DmsHeartbeatCard />);
    expect(screen.getByRole("button", { name: /Đang xác nhận nhịp sinh tồn/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Nghỉ phép" })).toBeDisabled();
  });

  it("keeps ping disabled while paused and exposes resume", () => {
    query.data = { ...fixture, status: "PAUSED" };
    render(<DmsHeartbeatCard />);
    expect(screen.getByRole("button", { name: /I'm Alive/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeEnabled();
  });
});
