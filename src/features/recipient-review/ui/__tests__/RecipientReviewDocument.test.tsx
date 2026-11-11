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
import { RecipientReviewQueue } from "../RecipientReviewQueue";
import { VerifierDocuments } from "../VerifierDocuments";

const ID = "0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10";
const TURN = "0199e7a4-2222-7c3e-9a51-3f0f5d2b8a10";
const DOCUMENT_ID = "0199e7a4-3333-7c3e-9a51-3f0f5d2b8a10";
const VAULT_A = "0199e7a4-aaaa-7c3e-9a51-3f0f5d2b8a10";
const VAULT_B = "0199e7a4-bbbb-7c3e-9a51-3f0f5d2b8a10";

const detail = (over: Record<string, unknown> = {}) => ({
  id: ID,
  turnId: TURN,
  containerName: "Gói gia đình",
  kind: "ACCEPT",
  allMatch: true,
  submittedAt: "2026-11-10T04:00:00+00:00",
  status: "SUBMITTED",
  nameMatches: true,
  citizenIdMatches: true,
  dateOfBirthMatches: true,
  citizenIdLast4: "1234",
  acknowledged: true,
  voluntaryDecline: false,
  supplementReason: null,
  itemCount: 3,
  documentId: DOCUMENT_ID,
  canApprove: true,
  canRequestSupplement: true,
  ...over,
});

const waitingDocument = (over: Parameters<typeof documentFixture>[0] = {}) =>
  documentFixture({
    id: DOCUMENT_ID,
    status: "WAIT_VERIFIER",
    submissionId: ID,
    completedAt: null,
    caseApprovedAt: "2026-11-09T03:00:00+00:00",
    verifier: { signedByName: "", checks: [], signedAt: null },
    ...over,
  });

function renderWith(node: React.ReactNode, path = `/notary/recipients?submissionId=${ID}`) {
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
        <MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

function backend(over: { detail?: unknown; documents?: unknown } = {}) {
  return vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
    if (url.endsWith("/images/front") || url.endsWith("/images/back")) {
      return new Blob(["png"], { type: "image/png" });
    }
    if (url === "/verifier/handover-documents") return over.documents ?? [waitingDocument()];
    if (url === "/verifier/handover-submissions") return [];
    return over.detail ?? detail();
  });
}

const CHECK_ONE = /Tôi đã nhìn ảnh căn cước/;
const CHECK_TWO = /Biên bản đúng lựa chọn Đồng ý nhận, đúng gói/;
const RESPONSIBILITY = /Tôi chịu trách nhiệm về kết quả kiểm tra này/;

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

describe("Màn duyệt hồ sơ người nhận (có biên bản)", () => {
  it("đầu trang nêu người nhận, gói, Chủ kho, giờ ký, lựa chọn và trạng thái", async () => {
    backend();
    renderWith(<RecipientReviewQueue />);

    expect(
      await screen.findByRole("heading", { name: "Trần Minh Anh · Gói gia đình" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Chủ kho Nguyễn Văn A · Người nhận ký biên bản lúc/),
    ).toBeInTheDocument();
    expect(screen.getByText("Đồng ý nhận")).toBeInTheDocument();
    expect(screen.getByText("Chờ bạn duyệt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Về hàng chờ/ })).toBeInTheDocument();
  });

  it("hộp thông tin nêu ngày duyệt hồ sơ báo tin, ngày mất, nơi đăng ký và 2 việc cần kiểm", async () => {
    backend();
    renderWith(<RecipientReviewQueue />);

    const note = await screen.findByText(/Hồ sơ báo tin của Chủ kho đã được duyệt ngày/);
    expect(note).toHaveTextContent("ngày 09/11/2026");
    expect(note).toHaveTextContent("mất ngày 05/11/2026");
    expect(note).toHaveTextContent(
      "UBND phường Bến Thành, Thành phố Hồ Chí Minh đăng ký khai tử ngày 07/11/2026",
    );
    expect(note).toHaveTextContent("Bạn chỉ cần kiểm 2 việc dưới đây.");
  });

  it("thiếu ngày duyệt hồ sơ báo tin thì bỏ cụm ngày duyệt", async () => {
    backend({ documents: [waitingDocument({ caseApprovedAt: null })] });
    renderWith(<RecipientReviewQueue />);

    const note = await screen.findByText(/Hồ sơ báo tin của Chủ kho đã được duyệt:/);
    expect(note).not.toHaveTextContent("duyệt ngày");
  });

  it("bảng đối chiếu 3 cột chỉ hiện 4 số cuối căn cước, hai ảnh to, biên bản mở sẵn rộng hết khung", async () => {
    backend();
    renderWith(<RecipientReviewQueue />);

    const table = await screen.findByRole("table", { name: "Đối chiếu thông tin người nhận" });
    expect(
      within(table).getByRole("columnheader", { name: "Người nhận khai" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Chủ kho đã khai" }),
    ).toBeInTheDocument();
    expect(within(table).getAllByText("Khớp")).toHaveLength(3);
    expect(within(table).getByText("Trần Minh Anh")).toBeInTheDocument();
    expect(within(table).getByText("1990")).toBeInTheDocument();
    expect(table).not.toHaveTextContent("079190001234");
    expect(table).toHaveTextContent("•••• 1234");
    expect(await screen.findByAltText("Căn cước mặt trước")).toBeInTheDocument();
    expect(screen.getByAltText("Căn cước mặt sau")).toBeInTheDocument();
    // Biên bản hiện sẵn (không nằm trong nút xổ), rộng hết khung.
    const paper = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(paper).toHaveClass("w-full");
    expect(paper).not.toHaveClass("max-w-2xl");
  });

  it("tick nhận trách nhiệm cùng 2 mục: Duyệt và ký khóa tới khi đủ, bước 1 thành dấu ✓", async () => {
    const user = userEvent.setup();
    backend();
    renderWith(<RecipientReviewQueue />);

    const sign = await screen.findByRole("button", { name: "Duyệt và ký" });
    expect(sign).toBeDisabled();
    expect(screen.getByText("Đã kiểm 0/2")).toBeInTheDocument();
    expect(screen.queryByTestId("step-1-done")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: CHECK_ONE }));
    expect(screen.getByText("Đã kiểm 1/2")).toBeInTheDocument();
    expect(screen.getByTestId("step-1-done")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: CHECK_TWO }));
    expect(screen.getByText("Đã kiểm 2/2")).toBeInTheDocument();
    // Đủ 2 mục nhưng chưa nhận trách nhiệm thì vẫn khóa.
    expect(sign).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: RESPONSIBILITY }));
    expect(sign).toBeEnabled();
    // Bỏ một mục thì khóa lại.
    await user.click(screen.getByRole("checkbox", { name: CHECK_ONE }));
    expect(sign).toBeDisabled();
  });

  it("Duyệt và ký gửi đúng 2 mục kiểm tra rồi báo đã duyệt, ẩn thanh quyết định", async () => {
    const user = userEvent.setup();
    const get = backend();
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(detail({ status: "APPROVED", canApprove: false }));
    renderWith(<RecipientReviewQueue />);

    await user.click(await screen.findByRole("checkbox", { name: CHECK_ONE }));
    await user.click(screen.getByRole("checkbox", { name: CHECK_TWO }));
    await user.click(screen.getByRole("checkbox", { name: RESPONSIBILITY }));
    // Sau khi gửi, Backend trả hồ sơ đã duyệt và biên bản đã hoàn tất kèm chữ ký Người xét duyệt.
    get.mockImplementation(async (url: string) => {
      if (url.endsWith("/images/front") || url.endsWith("/images/back")) {
        return new Blob(["png"], { type: "image/png" });
      }
      if (url === "/verifier/handover-documents") {
        return [
          waitingDocument({
            status: "COMPLETED",
            completedAt: "2026-11-10T05:00:00+00:00",
            verifier: {
              signedByName: "Luật sư Dũng",
              checks: [true, true],
              signedAt: "2026-11-10T05:00:00+00:00",
            },
          }),
        ];
      }
      return detail({ status: "APPROVED", canApprove: false });
    });
    await user.click(screen.getByRole("button", { name: "Duyệt và ký" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-submissions/${ID}/complete`, {
      checks: [true, true],
      acknowledged: true,
    });
    expect(
      await screen.findByText(
        "Đã duyệt và ký biên bản. Người nhận được thông báo và có thể nhập mã mở gói để tải tài sản.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Luật sư Dũng/)).toBeInTheDocument();
    // Hai chữ ký: người nhận và Người xét duyệt, mỗi chữ ký có thời điểm.
    expect(screen.getAllByText(/Đã ký điện tử/)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Duyệt và ký" })).not.toBeInTheDocument();
  });

  it("liên kết Xem 2 điều khoản mở phần điều khoản đang có", async () => {
    const user = userEvent.setup();
    backend();
    renderWith(<RecipientReviewQueue />);

    await user.click(await screen.findByRole("button", { name: "Xem 2 điều khoản" }));

    const terms = screen.getByRole("region", { name: "Điều khoản cần biết trước khi ký" });
    expect(within(terms).getAllByRole("listitem")).toHaveLength(2);
  });

  it("Yêu cầu bổ sung: bấm lý do nhanh thì điền vào ô, gửi đúng body", async () => {
    const user = userEvent.setup();
    backend();
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(detail({ status: "SUPPLEMENT_REQUESTED", canApprove: false }));
    renderWith(<RecipientReviewQueue />);

    await user.click(await screen.findByRole("button", { name: "Yêu cầu bổ sung" }));
    const send = screen.getByRole("button", { name: "Gửi yêu cầu" });
    expect(send).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Ảnh căn cước mờ, không đọc được" }));
    expect(screen.getByLabelText("Lý do")).toHaveValue("Ảnh căn cước mờ, không đọc được");
    await user.click(screen.getByRole("button", { name: "Thông tin trên ảnh không khớp" }));
    expect(screen.getByLabelText("Lý do")).toHaveValue("Thông tin trên ảnh không khớp");
    await user.type(screen.getByLabelText("Lý do"), " (họ tên)");
    await user.click(send);

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/verifier/handover-submissions/${ID}/request-supplement`, {
        reason: "Thông tin trên ảnh không khớp (họ tên)",
      }),
    );
    expect(await screen.findByText("Đã yêu cầu người nhận bổ sung")).toBeInTheDocument();
  });

  it("nút Hủy đóng khung yêu cầu bổ sung mà không gửi gì", async () => {
    const user = userEvent.setup();
    backend();
    const post = vi.spyOn(apiClient, "post");
    renderWith(<RecipientReviewQueue />);

    await user.click(await screen.findByRole("button", { name: "Yêu cầu bổ sung" }));
    await user.click(screen.getByRole("button", { name: "Hủy" }));

    expect(screen.queryByRole("button", { name: "Gửi yêu cầu" })).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("hồ sơ đang chờ người nhận bổ sung chỉ để xem: không có thanh quyết định", async () => {
    backend({
      detail: detail({
        status: "SUPPLEMENT_REQUESTED",
        supplementReason: "Ảnh mờ",
        canApprove: false,
        canRequestSupplement: false,
      }),
    });
    renderWith(<RecipientReviewQueue />);

    expect(await screen.findByText("Đã yêu cầu bổ sung: Ảnh mờ")).toBeInTheDocument();
    expect(screen.getByText("Chờ người nhận bổ sung")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Duyệt và ký" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("không tải được biên bản thì báo lỗi, cho thử lại và chưa cho Duyệt và ký", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/verifier/handover-documents") throw new Error("down");
      if (url.endsWith("/images/front") || url.endsWith("/images/back")) {
        return new Blob(["png"], { type: "image/png" });
      }
      return detail();
    });
    renderWith(<RecipientReviewQueue />);

    expect(await screen.findByText(/Không tải được biên bản/)).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: CHECK_ONE }));
    await user.click(screen.getByRole("checkbox", { name: CHECK_TWO }));
    await user.click(screen.getByRole("checkbox", { name: RESPONSIBILITY }));
    expect(screen.getByRole("button", { name: "Duyệt và ký" })).toBeDisabled();
  });
});

const doneDocument = (
  id: string,
  vaultId: string,
  owner: string,
  recipient: string,
  container: string,
  kind: "ACCEPT" | "DECLINE",
  completedAt: string,
  total: number,
) =>
  documentFixture({
    id,
    vaultId,
    kind,
    containerName: container,
    completedAt,
    caseApprovedAt: "2026-11-01T03:00:00+00:00",
    vaultRecipientTotal: total,
    owner: { ...documentFixture().owner, fullName: owner },
    recipient: { ...documentFixture().recipient, fullName: recipient },
  });

const SIGNED = [
  doneDocument(
    "0199e7a4-0001-7c3e-9a51-3f0f5d2b8a10",
    VAULT_A,
    "Nguyễn Văn A",
    "Trần Minh Anh",
    "Gói gia đình",
    "ACCEPT",
    "2026-11-05T03:00:00+00:00",
    3,
  ),
  doneDocument(
    "0199e7a4-0002-7c3e-9a51-3f0f5d2b8a10",
    VAULT_A,
    "Nguyễn Văn A",
    "Lê Hùng",
    "Gói bạn bè",
    "DECLINE",
    "2026-11-06T03:00:00+00:00",
    3,
  ),
  doneDocument(
    "0199e7a4-0003-7c3e-9a51-3f0f5d2b8a10",
    VAULT_B,
    "Phạm Thị B",
    "Đỗ Quang",
    "Gói công việc",
    "ACCEPT",
    "2026-11-08T03:00:00+00:00",
    1,
  ),
  // Biên bản chưa xong không nằm trong Biên bản đã ký.
  documentFixture({
    id: "0199e7a4-0004-7c3e-9a51-3f0f5d2b8a10",
    vaultId: VAULT_A,
    status: "WAIT_VERIFIER",
    completedAt: null,
    owner: { ...documentFixture().owner, fullName: "Nguyễn Văn A" },
    recipient: { ...documentFixture().recipient, fullName: "Chưa Xong" },
  }),
];

describe("Biên bản đã ký của Người xét duyệt", () => {
  it("gom theo kho, kho mới nhất ở trên, chip đã xong x/y đúng màu", async () => {
    backend({ documents: SIGNED });
    renderWith(<VerifierDocuments />, "/notary/documents");

    const vaults = await screen.findAllByRole("region", { name: /^Kho của / });
    expect(vaults).toHaveLength(2);
    expect(vaults[0]).toHaveAccessibleName("Kho của Phạm Thị B");
    expect(vaults[1]).toHaveAccessibleName("Kho của Nguyễn Văn A");
    expect(within(vaults[0]!).getByText("Đã xong 1/1 người nhận")).toBeInTheDocument();
    // Kho A còn một người nhận chưa xong: chip vàng (cảnh báo), không phải xanh.
    const pending = within(vaults[1]!).getByText("Đã xong 2/3 người nhận");
    expect(pending.className).toContain("bg-[#F1E6CC]");
    expect(within(vaults[0]!).getByText("Đã xong 1/1 người nhận").className).toContain(
      "bg-[#DDEFE6]",
    );
    expect(vaults[1]).toHaveTextContent(
      "Mất ngày 05/11/2026 · Hồ sơ báo tin duyệt ngày 01/11/2026",
    );
    expect(screen.queryByText(/Chưa Xong/)).not.toBeInTheDocument();
  });

  it("mỗi người nhận một dòng có loại văn bản, giờ hoàn tất và nút Xem mở văn bản rộng hết khung", async () => {
    const user = userEvent.setup();
    backend({ documents: SIGNED });
    renderWith(<VerifierDocuments />, "/notary/documents");

    const vaultA = (await screen.findAllByRole("region", { name: /^Kho của / }))[1]!;
    const rows = within(vaultA).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Lê Hùng · Gói bạn bè");
    expect(rows[0]).toHaveTextContent("Văn bản từ chối nhận · hoàn tất");
    await user.click(
      within(rows[1]!).getByRole("button", { name: /Xem biên bản của Trần Minh Anh/ }),
    );

    const paper = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(paper).toHaveClass("w-full");
  });

  it("bấm tiêu đề kho thì thu gọn và mở lại", async () => {
    const user = userEvent.setup();
    backend({ documents: SIGNED });
    renderWith(<VerifierDocuments />, "/notary/documents");

    const header = await screen.findByRole("button", { name: /Kho của Phạm Thị B/ });
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Đỗ Quang · Gói công việc")).toBeInTheDocument();
    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Đỗ Quang · Gói công việc")).not.toBeInTheDocument();
    await user.click(header);
    expect(screen.getByText("Đỗ Quang · Gói công việc")).toBeInTheDocument();
  });

  it("gõ tên Chủ kho thì hiện cả kho, gõ tên người nhận hoặc gói thì chỉ dòng khớp", async () => {
    const user = userEvent.setup();
    backend({ documents: SIGNED });
    renderWith(<VerifierDocuments />, "/notary/documents");
    const search = await screen.findByRole("searchbox", {
      name: /Tìm Chủ kho, người nhận hoặc tên gói/,
    });

    await user.type(search, "nguyễn văn a");
    expect(screen.getAllByRole("region", { name: /^Kho của / })).toHaveLength(1);
    expect(screen.getByText("Trần Minh Anh · Gói gia đình")).toBeInTheDocument();
    expect(screen.getByText("Lê Hùng · Gói bạn bè")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "lê hùng");
    expect(screen.getAllByRole("region", { name: /^Kho của / })).toHaveLength(1);
    expect(screen.getByText("Lê Hùng · Gói bạn bè")).toBeInTheDocument();
    expect(screen.queryByText("Trần Minh Anh · Gói gia đình")).not.toBeInTheDocument();
    // Chip x/y vẫn tính cả kho, không theo bộ lọc.
    expect(screen.getByText("Đã xong 2/3 người nhận")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "gói công việc");
    expect(screen.getAllByRole("region", { name: /^Kho của / })).toHaveLength(1);
    expect(screen.getByText("Đỗ Quang · Gói công việc")).toBeInTheDocument();
  });

  it("3 nút lọc Tất cả, Đồng ý nhận, Từ chối nhận", async () => {
    const user = userEvent.setup();
    backend({ documents: SIGNED });
    renderWith(<VerifierDocuments />, "/notary/documents");
    await screen.findAllByRole("region", { name: /^Kho của / });

    await user.click(screen.getByRole("button", { name: "Từ chối nhận" }));
    expect(screen.getAllByRole("region", { name: /^Kho của / })).toHaveLength(1);
    expect(screen.getByText("Lê Hùng · Gói bạn bè")).toBeInTheDocument();
    expect(screen.queryByText("Trần Minh Anh · Gói gia đình")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Đồng ý nhận" }));
    expect(screen.getAllByRole("region", { name: /^Kho của / })).toHaveLength(2);
    expect(screen.queryByText("Lê Hùng · Gói bạn bè")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tất cả" }));
    expect(screen.getByText("Lê Hùng · Gói bạn bè")).toBeInTheDocument();
  });

  it("không có kết quả thì một câu gợi ý; chưa có biên bản nào thì nói rõ", async () => {
    const user = userEvent.setup();
    backend({ documents: SIGNED });
    renderWith(<VerifierDocuments />, "/notary/documents");
    const search = await screen.findByRole("searchbox", { name: /Tìm Chủ kho/ });

    await user.type(search, "không có ai tên vậy");
    expect(screen.getByText(/Không có biên bản nào khớp/)).toBeInTheDocument();
  });

  it("chưa có biên bản đã ký nào thì nói rõ", async () => {
    backend({ documents: [] });
    renderWith(<VerifierDocuments />, "/notary/documents");

    expect(await screen.findByText("Chưa có biên bản nào đã ký")).toBeInTheDocument();
  });

  it("lỗi tải thì cho thử lại", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("403"));
    renderWith(<VerifierDocuments />, "/notary/documents");

    expect(await screen.findByRole("alert")).toHaveTextContent(/Không tải được các biên bản/);
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
