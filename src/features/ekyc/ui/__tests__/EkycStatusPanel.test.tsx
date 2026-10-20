import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
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
        <EkycStatusPanel
          purpose={props.purpose}
          turnId={props.turnId ?? null}
          canComplete={props.canComplete}
          onComplete={props.onComplete}
          completeResult={props.completeResult}
        />
      </QueryClientProvider>
    </Provider>,
  );
}
describe("EkycStatusPanel", () => {
  it("does not show a beneficiary verification as a passed owner enrollment", async () => {
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
    setup(true, { purpose: "OWNER_ENROLLMENT" });
    expect(
      await screen.findByText(/Kết quả gần nhất thuộc luồng xác minh khác/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Danh tính đã được xác minh.")).not.toBeInTheDocument();
    expect(screen.queryByText(/khớp với người nhận được chỉ định/)).not.toBeInTheDocument();
    expect(screen.queryByText(/OWNER_ENROLLMENT/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });
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
    expect(
      screen.queryByRole("button", { name: "Tôi đồng ý và tiếp tục" }),
    ).not.toBeInTheDocument();
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
    expect(
      await screen.findByRole("button", { name: "Tôi đồng ý và tiếp tục" }),
    ).toBeInTheDocument();
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
    expect(
      await screen.findByRole("button", { name: "Tôi đồng ý và tiếp tục" }),
    ).toBeInTheDocument();
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
          <EkycStatusPanel
            purpose="BENEFICIARY_CLAIM"
            turnId="11111111-1111-1111-1111-111111111111"
            canComplete
            completeResult={{ error: "Lỗi máy chủ." }}
          />
        </QueryClientProvider>
      </Provider>,
    );
    await screen.findByRole("button", { name: "Tôi đồng ý và tiếp tục" });
    expect(screen.getByText("Lỗi máy chủ.")).toBeInTheDocument();
    rerender(
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <EkycStatusPanel
            purpose="BENEFICIARY_CLAIM"
            turnId="11111111-1111-1111-1111-111111111111"
            canComplete
            completeResult={{ succeeded: true }}
          />
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
    expect(
      await screen.findByRole("button", { name: "Tôi đồng ý và tiếp tục" }),
    ).toBeInTheDocument();
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
    expect(
      await screen.findByRole("button", { name: "Tôi đồng ý và tiếp tục" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hoàn tất danh tính lượt nhận" }),
    ).not.toBeInTheDocument();
  });
});
