import { render, screen, waitFor, within } from "@testing-library/react";
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
const ID_LATE = "0199e7a4-1112-7c3e-9a51-3f0f5d2b8a10";
const TURN = "0199e7a4-2222-7c3e-9a51-3f0f5d2b8a10";
const EARLY = "2026-11-08T03:00:00+00:00";
const LATE = "2026-11-09T05:30:00+00:00";

const summary = (over: Record<string, unknown> = {}) => ({
  id: ID,
  turnId: TURN,
  containerName: "Gói gia đình",
  kind: "ACCEPT",
  allMatch: true,
  submittedAt: EARLY,
  ...over,
});

const detail = (over: Record<string, unknown> = {}) => ({
  ...summary(),
  status: "SUBMITTED",
  nameMatches: true,
  citizenIdMatches: true,
  dateOfBirthMatches: true,
  citizenId: "1234",
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

/** get: danh sách chờ kiểm, chi tiết và ảnh theo đường dẫn. */
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

describe("RecipientReviewQueue: danh sách hồ sơ danh tính", () => {
  it("xếp theo thời điểm nộp, nộp trước ở trên, kèm kết quả đối chiếu tự động", async () => {
    backend({
      // API trả nộp sau trước: giao diện phải tự xếp lại.
      list: [
        summary({ id: ID_LATE, submittedAt: LATE, allMatch: false }),
        summary({ id: ID, submittedAt: EARLY }),
      ],
    });
    renderQueue();

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Khớp thông tin Chủ tài sản khai");
    expect(rows[1]).toHaveTextContent("Có trường không khớp");
    expect(screen.queryByText(/Quá hạn|Còn \d+ ngày/)).not.toBeInTheDocument();
  });

  it("trống thì báo chưa có người nhận nào nộp căn cước", async () => {
    backend({ list: [] });
    renderQueue();

    expect(await screen.findByText("Chưa có người nhận nào nộp căn cước.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("lỗi thì báo và cho thử lại, không hiện danh sách rỗng giả", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("403"));
    renderQueue();

    expect(await screen.findByRole("alert")).toHaveTextContent(/Không tải được hồ sơ danh tính/);
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.queryByText(/Chưa có người nhận/)).not.toBeInTheDocument();
  });

  it("bấm Kiểm danh tính mở màn kiểm của hồ sơ đó", async () => {
    const user = userEvent.setup();
    backend();
    renderQueue();

    await user.click(await screen.findByRole("button", { name: "Kiểm danh tính" }));

    expect(await screen.findByRole("button", { name: "Về danh sách" })).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
  });
});

describe("RecipientReviewQueue: kiểm một hồ sơ", () => {
  it("khớp đủ thì Xác nhận đúng người gọi API duyệt", async () => {
    const user = userEvent.setup();
    backend();
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(detail({ status: "APPROVED" }));
    renderQueue(`/notary/recipients?submissionId=${ID}`);

    await user.click(await screen.findByRole("button", { name: "Xác nhận đúng người" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/verifier/handover-submissions/${ID}/approve`),
    );
  });

  it("có trường lệch thì luật sư vẫn tự quyết: còn nút xác nhận và yêu cầu làm lại kèm lý do", async () => {
    const user = userEvent.setup();
    backend({
      detail: detail({
        allMatch: false,
        citizenIdMatches: false,
        canApprove: true,
        canRequestSupplement: true,
      }),
    });
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(detail({ status: "SUPPLEMENT_REQUESTED" }));
    renderQueue(`/notary/recipients?submissionId=${ID}`);

    expect(await screen.findByText("Không khớp")).toBeInTheDocument();
    expect(screen.getByText("Có trường không khớp")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận đúng người" })).toBeEnabled();
    const again = screen.getByRole("button", { name: "Yêu cầu làm lại" });
    expect(again).toBeDisabled();
    await user.type(screen.getByLabelText("Lý do yêu cầu làm lại"), "Ảnh mờ");
    await user.click(again);
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/verifier/handover-submissions/${ID}/request-supplement`, {
        reason: "Ảnh mờ",
      }),
    );
  });

  it("hiện thông tin người nhận khai và Chủ tài sản khai cạnh nhau để luật sư đối chiếu", async () => {
    backend({
      detail: detail({
        citizenId: "079206021793",
        claimedFullName: "Nguyen Ngoc Minh Tan",
        claimedDateOfBirth: "2006-11-11",
        declaredFullName: "Phan Khanh Duy",
        declaredCitizenId: "079206015608",
        declaredDateOfBirth: "2006-01-23",
        nameMatches: false,
        citizenIdMatches: false,
        dateOfBirthMatches: false,
      }),
    });
    renderQueue(`/notary/recipients?submissionId=${ID}`);

    const table = await screen.findByRole("table", { name: /Đối chiếu thông tin người nhận/ });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Họ tênNguyen Ngoc Minh TanPhan Khanh DuyKhông khớp");
    expect(rows[1]).toHaveTextContent("Ngày sinh11/11/200623/01/2006Không khớp");
    expect(rows[2]).toHaveTextContent("Số căn cước079206021793079206015608Không khớp");
  });

  it("hồ sơ không mở được (không thuộc biên bản của mình) thì báo lỗi và có nút về danh sách", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("404"));
    renderQueue(`/notary/recipients?submissionId=${ID}`);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /hồ sơ không thuộc biên bản của bạn/,
    );
    expect(screen.getByRole("button", { name: "Về danh sách" })).toBeInTheDocument();
  });
});
