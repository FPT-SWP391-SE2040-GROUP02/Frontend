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

const waitingDocument = () =>
  documentFixture({
    id: DOCUMENT_ID,
    status: "WAIT_VERIFIER",
    submissionId: ID,
    completedAt: null,
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
    return over.detail ?? detail();
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

describe("Người xét duyệt kiểm tra thủ công biên bản", () => {
  it("hồ sơ thuộc biên bản: hiện bốn mục kiểm tra và ô xác nhận trách nhiệm, không còn nút Duyệt", async () => {
    backend();
    renderWith(<RecipientReviewQueue />);

    const checks = await screen.findByRole("group", { name: /Kiểm tra thủ công/ });
    expect(within(checks).getAllByRole("checkbox")).toHaveLength(4);
    expect(screen.getByLabelText(/Tôi đã tự kiểm tra thủ công từng mục/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Duyệt" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận đã kiểm tra và gửi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yêu cầu bổ sung" })).toBeInTheDocument();
  });

  it("ghi tiêu đề nhỏ cho biết ảnh căn cước là của ai để đối chiếu với tên ở Phần 2", async () => {
    backend();
    renderWith(<RecipientReviewQueue />);

    expect(
      await screen.findByRole("heading", { name: "Căn cước của Trần Minh Anh" }),
    ).toBeInTheDocument();
    // Người xét duyệt thấy số căn cước đầy đủ để đối chiếu với ảnh, không bị che.
    expect(screen.getByText(/Số căn cước cần khớp: 079190001234/)).toBeInTheDocument();
  });

  it("khung đối chiếu hiện đủ họ tên, số căn cước, năm sinh và nơi thường trú, không che", async () => {
    backend();
    renderWith(<RecipientReviewQueue />);

    const panel = (await screen.findByText("Đối chiếu với thông tin Chủ kho đã khai")).closest(
      "section",
    );
    expect(panel).toHaveTextContent("Trần Minh Anh");
    expect(panel).toHaveTextContent("079190001234");
    expect(panel).toHaveTextContent("Năm 1990");
    expect(panel).toHaveTextContent("34 Trần Hưng Đạo, Phường Hoàn Kiếm, Hà Nội");
    expect(panel).not.toHaveTextContent("••••");
  });

  it("chưa tick đủ bốn mục thì báo lỗi và không gửi", async () => {
    const user = userEvent.setup();
    backend();
    const post = vi.spyOn(apiClient, "post");
    renderWith(<RecipientReviewQueue />);

    const checks = await screen.findByRole("group", { name: /Kiểm tra thủ công/ });
    const boxes = within(checks).getAllByRole("checkbox");
    await user.click(boxes[0]!);
    await user.click(boxes[1]!);
    await user.click(screen.getByLabelText(/Tôi đã tự kiểm tra thủ công từng mục/));
    await user.click(screen.getByRole("button", { name: "Xác nhận đã kiểm tra và gửi" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Phải tick đủ cả bốn mục");
    expect(post).not.toHaveBeenCalled();
  });

  it("tick đủ bốn mục nhưng chưa xác nhận trách nhiệm thì vẫn không gửi", async () => {
    const user = userEvent.setup();
    backend();
    const post = vi.spyOn(apiClient, "post");
    renderWith(<RecipientReviewQueue />);

    const checks = await screen.findByRole("group", { name: /Kiểm tra thủ công/ });
    for (const box of within(checks).getAllByRole("checkbox")) await user.click(box);
    await user.click(screen.getByRole("button", { name: "Xác nhận đã kiểm tra và gửi" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("tick ô xác nhận trách nhiệm");
    expect(post).not.toHaveBeenCalled();
  });

  it("tick đủ và xác nhận: POST complete đúng body rồi báo đã gửi", async () => {
    const user = userEvent.setup();
    backend();
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(detail({ status: "APPROVED", canApprove: false }));
    renderWith(<RecipientReviewQueue />);

    const checks = await screen.findByRole("group", { name: /Kiểm tra thủ công/ });
    for (const box of within(checks).getAllByRole("checkbox")) await user.click(box);
    await user.click(screen.getByLabelText(/Tôi đã tự kiểm tra thủ công từng mục/));
    await user.click(screen.getByRole("button", { name: "Xác nhận đã kiểm tra và gửi" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-submissions/${ID}/complete`, {
      checks: [true, true, true, true],
      acknowledged: true,
    });
    expect(await screen.findByText("Đã kiểm tra và gửi biên bản")).toBeInTheDocument();
  });

  it("có trường lệch vẫn gửi được vì Người xét duyệt tự chịu trách nhiệm, nhưng có ghi chú rõ", async () => {
    backend({ detail: detail({ allMatch: false, nameMatches: false }) });
    renderWith(<RecipientReviewQueue />);

    expect(await screen.findByRole("note")).toHaveTextContent(
      "tự kiểm tra ảnh căn cước và chịu trách nhiệm",
    );
    expect(screen.getByRole("button", { name: "Xác nhận đã kiểm tra và gửi" })).toBeEnabled();
  });

  it("hồ sơ luồng cũ (không có biên bản) vẫn dùng nút Duyệt như trước", async () => {
    backend({ detail: detail({ documentId: null }), documents: [] });
    renderWith(<RecipientReviewQueue />);

    expect(await screen.findByRole("button", { name: "Duyệt" })).toBeEnabled();
    expect(screen.queryByRole("group", { name: /Kiểm tra thủ công/ })).not.toBeInTheDocument();
  });
});

describe("Mục Biên Bản của Người xét duyệt", () => {
  it("biên bản chờ mình có nút mở hồ sơ để kiểm tra, biên bản xong ghi Hoàn tất", async () => {
    backend({
      documents: [
        waitingDocument(),
        documentFixture({ id: "0199e7a4-6666-7c3e-9a51-3f0f5d2b8a10" }),
      ],
    });
    renderWith(<VerifierDocuments />, "/notary/documents");

    expect(
      await screen.findByText(/1 biên bản người nhận đã ký chờ bạn kiểm tra/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở để kiểm tra" })).toHaveAttribute(
      "href",
      `/notary/recipients?submissionId=${ID}`,
    );
    expect(screen.getByText("Hoàn tất")).toBeInTheDocument();
  });

  it("chưa có biên bản nào thì nói rõ, lỗi thì cho thử lại", async () => {
    backend({ documents: [] });
    renderWith(<VerifierDocuments />, "/notary/documents");
    expect(await screen.findByText(/Chưa có biên bản nào trong các kho/)).toBeInTheDocument();
  });
});
