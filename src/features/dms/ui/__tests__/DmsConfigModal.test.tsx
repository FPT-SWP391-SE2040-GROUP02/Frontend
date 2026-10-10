import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DmsHeartbeatConfig } from "../../model/dms.types";
import { DmsConfigModal } from "../DmsConfigModal";
const state = vi.hoisted(() => ({
  data: undefined as { config: DmsHeartbeatConfig } | undefined,
  isLoading: true,
  isError: false,
  refetch: vi.fn(),
}));
vi.mock("../../model/useDms", () => ({
  useDmsStatus: () => state,
  useUpdateDmsConfig: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));
const config: DmsHeartbeatConfig = {
  checkIntervalDays: 60,
  gracePeriodDays: 14,
  reminderFrequencyDays: 3,
  channels: [{ type: "EMAIL", enabled: true, targetValue: "owner@example.com" }],
  notifyExecutorOnGracePeriod: true,
};
beforeEach(() => {
  state.data = undefined;
  state.isLoading = true;
  state.isError = false;
  state.refetch.mockReset();
});
afterEach(cleanup);
describe("DMS config form", () => {
  it("chờ query rồi lấy đúng cấu hình, mở lại không giữ bản sửa chưa lưu", async () => {
    const props = { isOpen: true, onClose: vi.fn() };
    const view = render(<DmsConfigModal {...props} />);
    expect(screen.queryByRole("spinbutton")).toBeNull();
    state.isLoading = false;
    state.data = { config };
    view.rerender(<DmsConfigModal {...props} />);
    const interval = await screen.findByLabelText("Chu kỳ kiểm tra (ngày)");
    expect(interval).toHaveValue(60);
    fireEvent.change(interval, { target: { value: "90" } });
    view.rerender(<DmsConfigModal {...props} isOpen={false} />);
    view.rerender(<DmsConfigModal {...props} />);
    expect(await screen.findByLabelText("Chu kỳ kiểm tra (ngày)")).toHaveValue(60);
  });
  it("query lỗi hiển thị retry thay vì form mẫu", async () => {
    state.isLoading = false;
    state.isError = true;
    render(<DmsConfigModal isOpen onClose={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });
  it("kênh nhận rỗng chỉ báo lỗi sau blur", async () => {
    state.isLoading = false;
    state.data = { config };
    render(<DmsConfigModal isOpen onClose={vi.fn()} />);
    const input = await screen.findByLabelText("Email Trực Tiếp - địa chỉ nhận");
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByText("Địa chỉ liên hệ nhận thông báo là bắt buộc")).toBeNull();
    fireEvent.blur(input);
    expect(await screen.findByText(/Địa chỉ liên hệ nhận thông báo/)).toBeInTheDocument();
  });
});
