import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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
function setup(authenticated: boolean) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, isAuthenticated: authenticated, isHydrating: false } },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <EkycStatusPanel />
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
});
