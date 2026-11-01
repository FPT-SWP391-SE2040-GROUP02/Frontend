import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { z } from "zod";
import authReducer from "@/entities/user/model/authSlice";
import { ekycService } from "../../api/ekycService";
import type { ekycStatusSchema } from "../../model/ekyc.schema";
import { EkycStatusPanel } from "../EkycStatusPanel";

type Status = z.infer<typeof ekycStatusSchema>;

vi.mock("../../api/ekycService", () => ({ ekycService: { getStatus: vi.fn() } }));

/** Thay luồng chụp giấy tờ và quét mặt bằng một nút trả về kết quả máy chủ vừa chốt. */
let nextResult: Status;
vi.mock("../EkycUploads", () => ({
  EkycUploads: ({ onVerified }: { onVerified?: (result: Status) => void }) => (
    <div>
      <p>Màn so khớp khuôn mặt</p>
      <button type="button" onClick={() => onVerified?.(nextResult)}>
        Quét xong
      </button>
    </div>
  ),
}));

const pending: Status = {
  status: "PENDING",
  verificationId: "11111111-1111-4111-8111-111111111111",
  citizenIdLast4: "5608",
  faceMatchScore: null,
  matchThreshold: 0.363,
  spoofCheckPassed: null,
  createdAt: "2026-11-01T08:00:00Z",
  completedAt: null,
  purpose: "OWNER_ENROLLMENT",
  identityMatch: "NOT_CHECKED",
  backSideChecked: true,
};

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(ekycService.getStatus).mockResolvedValue(pending);
});
afterEach(() => {
  cleanup();
  client.clear();
});

function setup() {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, isAuthenticated: true, isHydrating: false } },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <EkycStatusPanel purpose="OWNER_ENROLLMENT" turnId={null} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

it("Owner quét mặt đạt thì vào thẳng màn Danh tính đã được xác minh", async () => {
  nextResult = {
    ...pending,
    status: "PASSED",
    faceMatchScore: 0.52,
    spoofCheckPassed: true,
    completedAt: "2026-11-01T08:05:00Z",
  };
  setup();
  fireEvent.click(await screen.findByRole("button", { name: "Quét xong" }));
  expect(await screen.findByText("Danh tính đã được xác minh.")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Kết quả xác minh danh tính" })).toHaveTextContent(
    "•••• 5608",
  );
  expect(screen.queryByText("Màn so khớp khuôn mặt")).not.toBeInTheDocument();
});

it("Owner quét mặt chưa đạt thì ở lại màn so khớp để xem lý do và làm lại", async () => {
  nextResult = {
    ...pending,
    status: "FAILED",
    faceMatchScore: 0.1,
    completedAt: "2026-11-01T08:05:00Z",
  };
  setup();
  fireEvent.click(await screen.findByRole("button", { name: "Quét xong" }));
  expect(screen.getByText("Màn so khớp khuôn mặt")).toBeInTheDocument();
  expect(screen.queryByText("Danh tính đã được xác minh.")).not.toBeInTheDocument();
});
