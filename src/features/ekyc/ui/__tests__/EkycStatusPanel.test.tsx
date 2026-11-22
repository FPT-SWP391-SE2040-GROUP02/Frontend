import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer from "@/entities/user/model/authSlice";
import { ekycService } from "../../api/ekycService";
import { EkycStatusPanel } from "../EkycStatusPanel";
vi.mock("../../api/ekycService", () => ({ ekycService: { getStatus: vi.fn() } }));
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});
function setup(authenticated: boolean, ownerPlanPurchased?: boolean) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, isAuthenticated: authenticated, isHydrating: false } },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <EkycStatusPanel ownerPlanPurchased={ownerPlanPurchased} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}
const notStarted = {
  status: "NOT_STARTED" as const,
  verificationId: null,
  citizenId: "",
  faceMatchScore: null,
  matchThreshold: 0.363,
  spoofCheckPassed: null,
  createdAt: null,
  completedAt: null,
  backSideChecked: false,
};
const passed = {
  status: "PASSED" as const,
  verificationId: "11111111-1111-4111-8111-111111111111",
  citizenId: "5608",
  faceMatchScore: 0.52,
  matchThreshold: 0.363,
  spoofCheckPassed: true,
  createdAt: "2026-10-20T08:00:00Z",
  completedAt: "2026-10-20T08:05:00Z",
  backSideChecked: true,
};
describe("EkycStatusPanel", () => {
  it("does not request before authentication", () => {
    setup(false);
    expect(screen.getByRole("status")).toHaveTextContent("Vui lòng đăng nhập");
    expect(ekycService.getStatus).not.toHaveBeenCalled();
  });
  it("shows NOT_STARTED from server without a fabricated passed state", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue(notStarted);
    setup(true);
    expect(await screen.findByText("Bạn chưa xác minh danh tính.")).toBeInTheDocument();
    expect(screen.queryByText("Danh tính đã được xác minh.")).not.toBeInTheDocument();
  });
  it("keeps backend failure visible with recovery", async () => {
    vi.mocked(ekycService.getStatus).mockRejectedValue(new Error("test failure"));
    setup(true);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeEnabled();
  });
  it("shows the consent step when the owner has not verified yet", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue(notStarted);
    setup(true);
    expect(await screen.findByRole("button", { name: "Đồng ý và bắt đầu" })).toBeInTheDocument();
  });
  it("lets the owner start again after a FAILED attempt", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      ...notStarted,
      status: "FAILED",
      spoofCheckPassed: false,
    });
    setup(true);
    expect(await screen.findByText("Lần xác minh chưa đạt yêu cầu.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đồng ý và bắt đầu" })).toBeInTheDocument();
  });
  it("Owner đã đạt: hiện màn kết quả với thông tin từ máy chủ và gợi ý bước tiếp theo", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue(passed);
    setup(true);
    expect(await screen.findByText("Danh tính đã được xác minh.")).toBeInTheDocument();
    const result = screen.getByRole("region", { name: "Kết quả xác minh danh tính" });
    expect(result).toHaveTextContent("5608");
    expect(result).toHaveTextContent("Qua kiểm tra chống giả mạo");
    expect(result).toHaveTextContent("Đã đọc");
    expect(result).toHaveTextContent("90 ngày");
    expect(screen.getByRole("link", { name: "Chọn gói dịch vụ" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.getByRole("link", { name: "Về Tổng quan" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    // Đã đạt thì khóa: không còn form tải giấy tờ.
    expect(screen.queryByRole("button", { name: "Đồng ý và bắt đầu" })).not.toBeInTheDocument();
  });
  it("Owner đã có gói trả phí: màn kết quả không nhắc mua gói nữa", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue(passed);
    setup(true, true);
    expect(await screen.findByText("Danh tính đã được xác minh.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Chọn gói dịch vụ" })).not.toBeInTheDocument();
  });
});
