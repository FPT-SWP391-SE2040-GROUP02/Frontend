import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authReducer, { type AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { RecipientReviewQueue } from "../RecipientReviewQueue";

const ID = "0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10";
const TURN = "0199e7a4-2222-7c3e-9a51-3f0f5d2b8a10";

const summary = (over: Record<string, unknown> = {}) => ({
  id: ID,
  turnId: TURN,
  containerName: "Gói gia đình",
  kind: "ACCEPT",
  allMatch: true,
  submittedAt: "2026-11-08T08:00:00+00:00",
  ...over,
});

const detail = (over: Record<string, unknown> = {}) => ({
  ...summary(),
  status: "SUBMITTED",
  nameMatches: true,
  citizenIdMatches: true,
  dateOfBirthMatches: true,
  citizenIdLast4: "1234",
  acknowledged: true,
  voluntaryDecline: false,
  supplementReason: null,
  itemCount: 3,
  canApprove: true,
  canRequestSupplement: true,
  ...over,
});

function renderQueue(path = "/notary/recipients") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const auth: AuthState = {
    isAuthenticated: true,
    isHydrating: false,
    user: {
      id: "v1",
      email: "ls@example.invalid",
      fullName: "Luật sư",
      phone: "0912345678",
      role: "VERIFIER",
    } as AuthState["user"],
  };
  const store = configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <RecipientReviewQueue />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

/** get: danh sách, chi tiết, ảnh theo đường dẫn. */
function backend(options: { list?: unknown; detail?: unknown } = {}) {
  return vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url.endsWith("/images/front") || url.endsWith("/images/back")) {
      return new Blob(["png"], { type: "image/png" });
    }
    if (url === "/verifier/handover-submissions") return options.list ?? [summary()];
    return options.detail ?? detail();
  });
}

beforeEach(() => {
  accessTokenMemory.set("fixture-token");
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  accessTokenMemory.clear();
});

describe("RecipientReviewQueue: hàng chờ", () => {
  it("hiện hồ sơ chờ duyệt kèm dấu khớp đủ hoặc lệch", async () => {
    backend({ list: [summary(), summary({ id: TURN, allMatch: false, kind: "DECLINE" })] });
    renderQueue();

    expect(await screen.findAllByText(/Hồ sơ người nhận · Gói gia đình/)).toHaveLength(2);
    expect(screen.getByText("Khớp đủ")).toBeInTheDocument();
    expect(screen.getByText("Có trường lệch")).toBeInTheDocument();
  });

  it("trống thì nói chưa có hồ sơ nào chờ", async () => {
    backend({ list: [] });
    renderQueue();

    expect(
      await screen.findByText(/Chưa có hồ sơ người nhận nào chờ bạn duyệt/),
    ).toBeInTheDocument();
  });

  it("lỗi thì báo và cho thử lại, không hiện danh sách rỗng giả", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("403"));
    renderQueue();

    expect(await screen.findByRole("alert")).toHaveTextContent(/Không tải được hồ sơ người nhận/);
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.queryByText(/Chưa có hồ sơ/)).not.toBeInTheDocument();
  });
});

describe("RecipientReviewQueue: chi tiết", () => {
  it("mở chi tiết từ danh sách và hiện ba dòng đối chiếu cùng hai ảnh", async () => {
    const user = userEvent.setup();
    backend();
    renderQueue();

    await user.click(
      await screen.findByRole("button", { name: /Hồ sơ người nhận · Gói gia đình/ }),
    );

    expect(await screen.findByText("Đối chiếu với thông tin Chủ kho đã khai")).toBeInTheDocument();
    expect(screen.getAllByText("Khớp")).toHaveLength(3);
    expect(screen.getByText(/•••••••• 1234/)).toBeInTheDocument();
    expect(await screen.findByAltText("Căn cước mặt trước")).toBeInTheDocument();
    expect(screen.getByAltText("Căn cước mặt sau")).toBeInTheDocument();
  });

  it("khớp đủ thì Duyệt gọi API và báo đã duyệt", async () => {
    const user = userEvent.setup();
    backend();
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(detail({ status: "APPROVED" }));
    renderQueue(`/notary/recipients?submissionId=${ID}`);

    await user.click(await screen.findByRole("button", { name: "Duyệt" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/verifier/handover-submissions/${ID}/approve`),
    );
    expect(await screen.findByText("Đã duyệt hồ sơ người nhận")).toBeInTheDocument();
  });

  it("có trường lệch thì khóa nút Duyệt, chỉ cho yêu cầu bổ sung", async () => {
    backend({
      detail: detail({
        allMatch: false,
        citizenIdMatches: false,
        canApprove: false,
        canRequestSupplement: true,
      }),
    });
    renderQueue(`/notary/recipients?submissionId=${ID}`);

    expect(await screen.findByText("Không khớp")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Yêu cầu bổ sung" })).toBeEnabled();
    expect(screen.getByRole("note")).toHaveTextContent("Chỉ có thể yêu cầu người nhận bổ sung");
  });

  it("yêu cầu bổ sung cần lý do rồi gửi đúng body", async () => {
    const user = userEvent.setup();
    backend();
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(detail({ status: "SUPPLEMENT_REQUESTED", supplementReason: "Ảnh mờ" }));
    renderQueue(`/notary/recipients?submissionId=${ID}`);

    await user.click(await screen.findByRole("button", { name: "Yêu cầu bổ sung" }));
    const send = screen.getByRole("button", { name: "Gửi yêu cầu" });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText("Lý do"), "Ảnh mờ");
    await user.click(send);

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/verifier/handover-submissions/${ID}/request-supplement`, {
        reason: "Ảnh mờ",
      }),
    );
    expect(await screen.findByText("Đã yêu cầu người nhận bổ sung")).toBeInTheDocument();
  });

  it("hồ sơ không mở được (không thuộc kho mình duyệt) thì báo lỗi và có nút về hàng chờ", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("404"));
    renderQueue(`/notary/recipients?submissionId=${ID}`);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Không mở được hồ sơ này/);
    expect(screen.getByRole("button", { name: /Về hàng chờ/ })).toBeInTheDocument();
  });
});
