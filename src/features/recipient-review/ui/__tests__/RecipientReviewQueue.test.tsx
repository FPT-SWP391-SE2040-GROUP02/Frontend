import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authReducer, { type AuthState } from "@/entities/user/model/authSlice";
import { documentFixture } from "@/entities/handoverDocument/testing/documentFixture";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { formatTimeThenDate } from "@/shared/lib/dateFormat";
import { RecipientReviewQueue } from "../RecipientReviewQueue";

const ID = "0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10";
const ID_LATE = "0199e7a4-1112-7c3e-9a51-3f0f5d2b8a10";
const ID_RETURNED = "0199e7a4-1113-7c3e-9a51-3f0f5d2b8a10";
const TURN = "0199e7a4-2222-7c3e-9a51-3f0f5d2b8a10";
const DOC_EARLY = "0199e7a4-3331-7c3e-9a51-3f0f5d2b8a10";
const DOC_LATE = "0199e7a4-3332-7c3e-9a51-3f0f5d2b8a10";
const DOC_RETURNED = "0199e7a4-3333-7c3e-9a51-3f0f5d2b8a10";

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

/** get: danh sách chờ duyệt, biên bản của Người xét duyệt, chi tiết và ảnh theo đường dẫn. */
function backend(options: { list?: unknown; detail?: unknown; documents?: unknown } = {}) {
  return vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url.endsWith("/images/front") || url.endsWith("/images/back")) {
      return new Blob(["png"], { type: "image/png" });
    }
    if (url === "/verifier/handover-submissions") return options.list ?? [summary()];
    if (url === "/verifier/handover-documents") return options.documents ?? [];
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

describe("RecipientReviewQueue: danh sách việc", () => {
  it("xếp theo thời điểm nộp, nộp trước ở trên, và chỉ dòng đầu tô nổi", async () => {
    backend({
      // API trả nộp sau trước: giao diện phải tự xếp lại.
      list: [summary({ id: ID_LATE, submittedAt: LATE }), summary({ id: ID, submittedAt: EARLY })],
      documents: [
        documentFixture({
          id: DOC_EARLY,
          status: "WAIT_VERIFIER",
          submissionId: ID,
          recipient: { ...documentFixture().recipient, fullName: "Nguyễn Thị Mai" },
        }),
        documentFixture({
          id: DOC_LATE,
          status: "WAIT_VERIFIER",
          submissionId: ID_LATE,
          recipient: { ...documentFixture().recipient, fullName: "Lê Văn Hùng" },
        }),
      ],
    });
    renderQueue();

    const rows = await screen.findAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Nguyễn Thị Mai · Gói gia đình");
    expect(rows[1]).toHaveTextContent("Lê Văn Hùng · Gói gia đình");
    expect(rows[0]).toHaveAttribute("data-featured", "true");
    expect(rows[1]).not.toHaveAttribute("data-featured");
    // Không có chữ "Nộp sớm nhất" hay chữ về hạn.
    expect(screen.queryByText(/Nộp sớm nhất/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quá hạn|Còn \d+ ngày|Hạn/)).not.toBeInTheDocument();
  });

  it("dòng chính, dòng phụ, nhãn lựa chọn và nút Duyệt đúng mẫu", async () => {
    backend({
      list: [summary({ kind: "DECLINE" })],
      documents: [
        documentFixture({
          id: DOC_EARLY,
          status: "WAIT_VERIFIER",
          submissionId: ID,
          kind: "DECLINE",
        }),
      ],
    });
    renderQueue();

    const row = (await screen.findAllByRole("listitem"))[0]!;
    expect(row).toHaveTextContent("Trần Minh Anh · Gói gia đình");
    expect(row).toHaveTextContent(`Chủ kho Nguyễn Văn A · nộp ${formatTimeThenDate(EARLY)}`);
    expect(within(row).getByText("Từ chối nhận")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: /Duyệt/ })).toBeInTheDocument();
    expect(within(row).queryByText("Đã bổ sung")).not.toBeInTheDocument();
    expect(screen.getByText("Hồ sơ nộp trước ở trên, làm từ trên xuống.")).toBeInTheDocument();
  });

  it("hồ sơ nộp lại ghi nộp lại và có nhãn Đã bổ sung", async () => {
    backend({
      list: [summary()],
      documents: [
        documentFixture({
          id: DOC_EARLY,
          status: "WAIT_VERIFIER",
          submissionId: ID,
          resubmitted: true,
        }),
      ],
    });
    renderQueue();

    const row = (await screen.findAllByRole("listitem"))[0]!;
    expect(row).toHaveTextContent(`nộp lại ${formatTimeThenDate(EARLY)}`);
    expect(within(row).getByText("Đã bổ sung")).toBeInTheDocument();
    expect(within(row).getByText("Đồng ý nhận")).toBeInTheDocument();
  });

  it("hai tab có số đếm; tab chờ bổ sung có nút Xem và lý do đã yêu cầu", async () => {
    const user = userEvent.setup();
    backend({
      list: [summary()],
      documents: [
        documentFixture({ id: DOC_EARLY, status: "WAIT_VERIFIER", submissionId: ID }),
        documentFixture({
          id: DOC_RETURNED,
          status: "WAIT_RECIPIENT",
          submissionId: ID_RETURNED,
          supplementReason: "Ảnh mờ",
          submittedAt: LATE,
        }),
      ],
    });
    renderQueue();

    const waitingTab = await screen.findByRole("tab", { name: /Chờ bạn duyệt/ });
    const supplementTab = screen.getByRole("tab", { name: /Chờ người nhận bổ sung/ });
    expect(waitingTab).toHaveTextContent("1");
    await waitFor(() => expect(supplementTab).toHaveTextContent("1"));
    await user.click(supplementTab);

    expect(
      screen.getByText(
        "Không cần bạn làm gì. Hồ sơ tự quay lại tab Chờ bạn duyệt khi được nộp lại.",
      ),
    ).toBeInTheDocument();
    const row = screen.getAllByRole("listitem")[0]!;
    expect(row).toHaveTextContent("đã yêu cầu: Ảnh mờ");
    expect(row).not.toHaveAttribute("data-featured");
    expect(within(row).getByRole("button", { name: /Xem/ })).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: /Duyệt/ })).not.toBeInTheDocument();
  });

  it("trống thì nói rõ hồ sơ sẽ hiện ở đây khi người nhận nộp", async () => {
    backend({ list: [] });
    renderQueue();

    expect(await screen.findByText("Không còn hồ sơ người nhận nào chờ bạn")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Khi người nhận nộp căn cước và ký biên bản đồng ý hoặc từ chối, hồ sơ sẽ hiện ở đây.",
      ),
    ).toBeInTheDocument();
  });

  it("lỗi thì báo và cho thử lại, không hiện danh sách rỗng giả", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("403"));
    renderQueue();

    expect(await screen.findByRole("alert")).toHaveTextContent(/Không tải được hồ sơ người nhận/);
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.queryByText(/Không còn hồ sơ/)).not.toBeInTheDocument();
  });

  it("bấm Duyệt mở màn duyệt của hồ sơ đó", async () => {
    const user = userEvent.setup();
    backend();
    renderQueue();

    await user.click(await screen.findByRole("button", { name: /Duyệt/ }));

    expect(await screen.findByRole("button", { name: /Về hàng chờ/ })).toBeInTheDocument();
  });
});

describe("RecipientReviewQueue: hồ sơ luồng cũ (chưa có biên bản)", () => {
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

  it("hồ sơ không mở được (không thuộc kho mình duyệt) thì báo lỗi và có nút về hàng chờ", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("404"));
    renderQueue(`/notary/recipients?submissionId=${ID}`);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Không mở được hồ sơ này/);
    expect(screen.getByRole("button", { name: /Về hàng chờ/ })).toBeInTheDocument();
  });
});
