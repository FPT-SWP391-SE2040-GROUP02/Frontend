import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
function setup(
  authenticated: boolean,
  props: {
    purpose: "OWNER_ENROLLMENT" | "BENEFICIARY_CLAIM";
    turnId?: string | null;
    canComplete?: boolean;
    onComplete?: () => void;
    completeResult?: { error?: string; succeeded?: boolean } | null;
  } = { purpose: "OWNER_ENROLLMENT", turnId: null },
) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, isAuthenticated: authenticated, isHydrating: false } },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <EkycStatusPanel
            purpose={props.purpose}
            turnId={props.turnId ?? null}
            canComplete={props.canComplete}
            onComplete={props.onComplete}
            completeResult={props.completeResult}
          />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}
describe("EkycStatusPanel", () => {
  it("does not request before authentication", () => {
    setup(false);
    expect(screen.getByRole("status")).toHaveTextContent("Vui lòng đăng nhập");
    expect(ekycService.getStatus).not.toHaveBeenCalled();
  });
  it("shows NOT_STARTED from server without a fabricated passed state", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      status: "NOT_STARTED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: null,
      matchThreshold: 0.363,
      spoofCheckPassed: null,
      createdAt: null,
      completedAt: null,
      purpose: null,
      identityMatch: "NOT_CHECKED",
      backSideChecked: false,
    });
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
  it("hides upload form when BENEFICIARY_CLAIM is missing turnId", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      status: "NOT_STARTED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: null,
      matchThreshold: 0.363,
      spoofCheckPassed: null,
      createdAt: null,
      completedAt: null,
      purpose: null,
      identityMatch: "NOT_CHECKED",
      backSideChecked: false,
    });
    setup(true, { purpose: "BENEFICIARY_CLAIM", turnId: null });
    expect(await screen.findByRole("alert")).toHaveTextContent("Mở màn này từ một lượt bàn giao");
    expect(screen.queryByRole("button", { name: "Đồng ý và bắt đầu" })).not.toBeInTheDocument();
  });
  it("shows upload form for OWNER_ENROLLMENT without turnId", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      status: "NOT_STARTED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: null,
      matchThreshold: 0.363,
      spoofCheckPassed: null,
      createdAt: null,
      completedAt: null,
      purpose: null,
      identityMatch: "NOT_CHECKED",
      backSideChecked: false,
    });
    setup(true, { purpose: "OWNER_ENROLLMENT", turnId: null });
    expect(await screen.findByRole("button", { name: "Đồng ý và bắt đầu" })).toBeInTheDocument();
  });
  it("does not offer complete button when page does not enable it", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      status: "PASSED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: 0.4,
      matchThreshold: 0.363,
      spoofCheckPassed: true,
      createdAt: null,
      completedAt: null,
      purpose: "BENEFICIARY_CLAIM",
      identityMatch: "MATCHED",
      backSideChecked: true,
    });
    setup(true, {
      purpose: "BENEFICIARY_CLAIM",
      turnId: "11111111-1111-1111-1111-111111111111",
      canComplete: false,
    });
    expect(await screen.findByRole("button", { name: "Đồng ý và bắt đầu" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hoàn tất danh tính lượt nhận" }),
    ).not.toBeInTheDocument();
  });
  it("offers complete button when page enables it", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      status: "PASSED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: 0.4,
      matchThreshold: 0.363,
      spoofCheckPassed: true,
      createdAt: null,
      completedAt: null,
      purpose: "BENEFICIARY_CLAIM",
      identityMatch: "MATCHED",
      backSideChecked: true,
    });
    const onComplete = vi.fn();
    setup(true, {
      purpose: "BENEFICIARY_CLAIM",
      turnId: "11111111-1111-1111-1111-111111111111",
      canComplete: true,
      onComplete,
    });
    const button = await screen.findByRole("button", { name: "Hoàn tất danh tính lượt nhận" });
    fireEvent.click(button);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
  it("renders completeResult error and success", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      status: "PASSED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: 0.4,
      matchThreshold: 0.363,
      spoofCheckPassed: true,
      createdAt: null,
      completedAt: null,
      purpose: "BENEFICIARY_CLAIM",
      identityMatch: "MATCHED",
      backSideChecked: true,
    });
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { user: null, isAuthenticated: true, isHydrating: false } },
    });
    const { rerender } = render(
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <EkycStatusPanel
              purpose="BENEFICIARY_CLAIM"
              turnId="11111111-1111-1111-1111-111111111111"
              canComplete
              completeResult={{ error: "Lỗi máy chủ." }}
            />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );
    await screen.findByRole("button", { name: "Đồng ý và bắt đầu" });
    expect(screen.getByText("Lỗi máy chủ.")).toBeInTheDocument();
    rerender(
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <EkycStatusPanel
              purpose="BENEFICIARY_CLAIM"
              turnId="11111111-1111-1111-1111-111111111111"
              canComplete
              completeResult={{ succeeded: true }}
            />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );
    expect(await screen.findByText(/Đã chốt danh tính/)).toBeInTheDocument();
  });
  it("does not enable complete when verificationId is null even with PASSED", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      status: "PASSED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: 0.4,
      matchThreshold: 0.363,
      spoofCheckPassed: true,
      createdAt: null,
      completedAt: null,
      purpose: "BENEFICIARY_CLAIM",
      identityMatch: "MATCHED",
      backSideChecked: true,
    });
    setup(true, {
      purpose: "BENEFICIARY_CLAIM",
      turnId: "11111111-1111-1111-1111-111111111111",
      canComplete: false,
    });
    expect(await screen.findByRole("button", { name: "Đồng ý và bắt đầu" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hoàn tất danh tính lượt nhận" }),
    ).not.toBeInTheDocument();
  });
  it("does not enable complete when status is FAILED or identityMatch is wrong", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      status: "FAILED",
      verificationId: null,
      citizenIdLast4: "",
      faceMatchScore: null,
      matchThreshold: 0.363,
      spoofCheckPassed: false,
      createdAt: null,
      completedAt: null,
      purpose: "BENEFICIARY_CLAIM",
      identityMatch: "WRONG_PERSON",
      backSideChecked: true,
    });
    setup(true, {
      purpose: "BENEFICIARY_CLAIM",
      turnId: "11111111-1111-1111-1111-111111111111",
      canComplete: false,
    });
    expect(await screen.findByRole("button", { name: "Đồng ý và bắt đầu" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hoàn tất danh tính lượt nhận" }),
    ).not.toBeInTheDocument();
  });
  it("Owner đã đạt: hiện màn kết quả với thông tin từ máy chủ và gợi ý bước tiếp theo", async () => {
    vi.mocked(ekycService.getStatus).mockResolvedValue({
      status: "PASSED",
      verificationId: "11111111-1111-4111-8111-111111111111",
      citizenIdLast4: "5608",
      faceMatchScore: 0.52,
      matchThreshold: 0.363,
      spoofCheckPassed: true,
      createdAt: "2026-10-20T08:00:00Z",
      completedAt: "2026-10-20T08:05:00Z",
      purpose: "OWNER_ENROLLMENT",
      identityMatch: "NOT_CHECKED",
      backSideChecked: true,
    });
    setup(true);
    expect(await screen.findByText("Danh tính đã được xác minh.")).toBeInTheDocument();
    const result = screen.getByRole("region", { name: "Kết quả xác minh danh tính" });
    expect(result).toHaveTextContent("•••• 5608");
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
});
