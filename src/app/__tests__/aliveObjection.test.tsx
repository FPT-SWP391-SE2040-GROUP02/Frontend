import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerDeathCasePanel } from "@/features/owner-objection";
import { VerifierCaseDetail } from "@/features/verifier-review";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const OBJECTION_ID = "77777777-7777-4777-8777-777777777777";
const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;

const objection = (overrides: Record<string, unknown> = {}) => ({
  id: OBJECTION_ID,
  status: "OPEN",
  firstReportedAt: CREATED_AT,
  lastReportedAt: CREATED_AT,
  reportCount: 1,
  selfieDeadlineAt: CREATED_AT,
  selfieWindowOpen: true,
  selfiePassed: false,
  selfiePassedAt: null,
  selfieAttemptsRemaining: 3,
  hasSelfieImage: false,
  selfieImageCapturedAt: null,
  selfieImageMatched: null,
  verifierDueAt: CREATED_AT,
  insufficientEvidenceCount: 0,
  conclusion: null,
  conclusionReason: null,
  concludedAt: null,
  serverTime: CREATED_AT,
  ...overrides,
});
const ownerCase = (status: string, withObjection: unknown = null) => ({
  caseId: CASE_ID,
  caseCode: "1A2F3C4D",
  status,
  objectionStartsAt: CREATED_AT,
  objectionEndsAt: CREATED_AT,
  objection: withObjection,
});

function problem(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("x", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("alive-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

function renderOwner() {
  render(
    <QueryClientProvider client={client}>
      <OwnerDeathCasePanel vaultId={VAULT_ID} enabled />
    </QueryClientProvider>,
  );
}

it("Owner không thấy gì khi kho chưa có hồ sơ chứng tử", async () => {
  const get = vi
    .spyOn(apiClient, "get")
    .mockRejectedValue(problem(404, { code: "DEATH_CASE_NOT_FOUND" }));
  renderOwner();
  await waitFor(() => expect(get).toHaveBeenCalled());
  expect(screen.queryByText(/Có hồ sơ chứng tử/)).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("Owner không bị cảnh báo khi hồ sơ còn là bản nháp của Executor", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue(ownerCase("DRAFT"));
  renderOwner();
  await waitFor(() => expect(get).toHaveBeenCalled());
  expect(screen.queryByText(/Có hồ sơ chứng tử/)).not.toBeInTheDocument();
});

it("Owner báo còn sống chỉ sau khi xác nhận và chỉ hiện trạng thái sau response của BE", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(ownerCase("UNDER_REVIEW"));
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(ownerCase("SUSPENDED", objection()));
  renderOwner();
  await user.click(await screen.findByRole("button", { name: "Tôi còn sống" }));
  const confirm = screen.getByRole("button", { name: "Xác nhận còn sống" });
  expect(confirm).toBeDisabled();
  await user.click(screen.getByRole("checkbox"));
  await user.click(confirm);
  await screen.findByText(/Lời báo còn sống đã được ghi nhận/);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/death-case/objection`);
  expect(screen.getByLabelText("Gửi ảnh selfie xác minh")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Tôi còn sống" })).not.toBeInTheDocument();
});

it("Owner báo thất bại hiện lỗi theo reason và chưa đổi trạng thái", async () => {
  const user = userEvent.setup();
  vi.spyOn(apiClient, "get").mockResolvedValue(ownerCase("UNDER_REVIEW"));
  vi.spyOn(apiClient, "post").mockRejectedValue(
    problem(409, { code: "DEATH_CASE_NOT_ALLOWED", reason: "OBJECTION_ALREADY_REJECTED" }),
  );
  renderOwner();
  await user.click(await screen.findByRole("button", { name: "Tôi còn sống" }));
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Xác nhận còn sống" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/selfie mới/);
  expect(screen.queryByText(/Lời báo còn sống đã được ghi nhận/)).not.toBeInTheDocument();
});

it("Owner chặn ảnh sai định dạng trước khi gọi BE và báo lượt còn lại khi selfie không khớp", async () => {
  const user = userEvent.setup({ applyAccept: false });
  vi.spyOn(apiClient, "get").mockResolvedValue(ownerCase("SUSPENDED", objection()));
  const post = vi
    .spyOn(apiClient, "post")
    .mockResolvedValue(ownerCase("SUSPENDED", objection({ selfieAttemptsRemaining: 2 })));
  renderOwner();
  const input = await screen.findByLabelText("Gửi ảnh selfie xác minh");
  await user.upload(input, new File(["x"], "a.gif", { type: "image/gif" }));
  await user.click(screen.getByRole("button", { name: "Gửi selfie" }));
  expect(await screen.findByText("Chỉ chấp nhận ảnh JPEG hoặc PNG.")).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  await user.upload(input, new File(["x"], "a.jpg", { type: "image/jpeg" }));
  await user.click(screen.getByRole("button", { name: "Gửi selfie" }));
  expect(await screen.findByText(/Còn 2 lượt thử/)).toBeInTheDocument();
  expect(post).toHaveBeenCalledWith(
    `/vaults/${VAULT_ID}/death-case/objection/selfie`,
    expect.any(FormData),
    expect.anything(),
  );
});

it("Verifier ghi chưa đủ bằng chứng thì Owner thấy lý do, hạn mới và được chụp selfie lại", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(
    ownerCase(
      "SUSPENDED",
      objection({
        selfiePassed: false,
        selfiePassedAt: null,
        selfieWindowOpen: true,
        selfieAttemptsRemaining: 3,
        insufficientEvidenceCount: 1,
        conclusionReason: "Ảnh mờ, cần chụp lại",
      }),
    ),
  );
  renderOwner();
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Verifier cần thêm bằng chứng: hãy chụp selfie trực tiếp mới.");
  expect(alert).toHaveTextContent("Lý do: Ảnh mờ, cần chụp lại");
  expect(screen.getByLabelText("Gửi ảnh selfie xác minh")).toBeInTheDocument();
  expect(screen.queryByText(/Đang chờ\s+Verifier kết luận/)).not.toBeInTheDocument();
});

it("Verifier thấy đã yêu cầu chủ kho chụp lại sau khi ghi chưa đủ bằng chứng", async () => {
  renderVerifier(
    objection({
      insufficientEvidenceCount: 1,
      conclusionReason: "Ảnh mờ, cần chụp lại",
    }),
  );
  expect(await screen.findByText(/Đã yêu cầu chủ kho chụp selfie mới \(lần 1\)/)).toHaveTextContent(
    "Lý do: Ảnh mờ, cần chụp lại",
  );
});

it("Owner được gửi bằng chứng mới sau khi lời báo bị bác", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue(
    ownerCase(
      "UNDER_REVIEW",
      objection({
        status: "CONCLUDED",
        selfieWindowOpen: false,
        conclusion: "OBJECTION_REJECTED",
        conclusionReason: "Ảnh không rõ",
      }),
    ),
  );
  renderOwner();
  expect(await screen.findByText("Lời báo bị bác")).toBeInTheDocument();
  expect(screen.getByLabelText("Gửi bằng chứng mới (selfie)")).toBeInTheDocument();
  // Sau khi bác, kế hoạch không còn bị chặn nên không được nói "đang bị chặn".
  expect(screen.getByText(/đã bị bác/)).toBeInTheDocument();
  expect(screen.queryByText(/đang bị chặn/)).not.toBeInTheDocument();
});

const verifierDetail = {
  id: CASE_ID,
  vaultId: VAULT_ID,
  status: "SUSPENDED",
  etag: "v-1",
  createdAt: CREATED_AT,
  firstSubmittedAt: CREATED_AT,
  closedAt: null,
  reviewVersion: {
    versionNo: 1,
    ownerFullName: "Nguyễn Văn A",
    ownerCitizenId: "012345678901",
    ownerCitizenIdLast4: "8901",
    dateOfDeath: "2026-10-01",
    certificateNumber: "CT-001",
    issuedOn: "2026-10-02",
    issuedBy: "UBND Q1",
    submittedAt: CREATED_AT,
    files: [],
  },
  versions: [],
  flags: [],
  decisions: [],
  ownerNotice: { status: "DELIVERED", deliveredAt: CREATED_AT },
  objectionEndsAt: null,
  assignment: { assignedAt: CREATED_AT, dueAt: CREATED_AT },
  canApprove: false,
  approveBlockers: ["NOT_UNDER_REVIEW"],
  previousCase: null,
  handover: null,
  ownerIdentity: {
    verified: false,
    citizenId: null,
    fullName: null,
    dateOfBirth: null,
    verifiedAt: null,
    citizenIdMatches: null,
    fullNameMatches: null,
    hasDocumentImage: false,
    documentImageCapturedAt: null,
  },
};

function renderVerifier(objectionBody: unknown) {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith("/objection") ? objectionBody : verifierDetail,
  );
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VerifierCaseDetail caseId={CASE_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

it("Verifier thấy khối báo còn sống và không được xác nhận còn sống khi selfie chưa đạt", async () => {
  const user = userEvent.setup();
  renderVerifier(objection());
  expect(await screen.findByText("Owner báo còn sống")).toBeInTheDocument();
  expect(screen.getByText(/Chưa thể xác nhận còn sống/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Kết luận lời báo" }));
  expect(screen.queryByRole("radio", { name: "Xác nhận Owner còn sống" })).not.toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Bác lời báo" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Chưa đủ bằng chứng" })).toBeInTheDocument();
});

it("Verifier phải chủ động chọn kết luận, không có lựa chọn mặc định", async () => {
  const user = userEvent.setup();
  renderVerifier(objection());
  await user.click(await screen.findByRole("button", { name: "Kết luận lời báo" }));
  for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked();
});

it("Verifier rời nhóm kết luận khi chưa chọn thì thấy lỗi tiếng Việt, chọn xong lỗi biến mất", async () => {
  const user = userEvent.setup();
  renderVerifier(objection());
  await user.click(await screen.findByRole("button", { name: "Kết luận lời báo" }));
  screen.getByRole("radio", { name: "Bác lời báo" }).focus();
  await user.tab();
  expect(await screen.findByText("Chọn một kết luận.")).toBeInTheDocument();
  expect(screen.queryByText(/Expected string/)).not.toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: "Chưa đủ bằng chứng" }));
  await waitFor(() => expect(screen.queryByText("Chọn một kết luận.")).not.toBeInTheDocument());
});

it("Verifier không được bác lời báo khi selfie đã đạt (ALIVE-05)", async () => {
  const user = userEvent.setup();
  renderVerifier(objection({ selfiePassed: true, selfiePassedAt: CREATED_AT }));
  await user.click(await screen.findByRole("button", { name: "Kết luận lời báo" }));
  expect(screen.queryByRole("radio", { name: "Bác lời báo" })).not.toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Xác nhận Owner còn sống" })).toBeInTheDocument();
});

it("Verifier kết luận cần lý do và xác nhận, rồi gửi đúng body", async () => {
  const user = userEvent.setup();
  renderVerifier(objection());
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(
    objection({
      conclusion: "INSUFFICIENT_EVIDENCE",
      conclusionReason: "Cần thêm bằng chứng",
    }),
  );
  await user.click(await screen.findByRole("button", { name: "Kết luận lời báo" }));
  await user.click(screen.getByRole("radio", { name: "Chưa đủ bằng chứng" }));
  const submit = screen.getByRole("button", { name: "Ghi kết luận" });
  expect(submit).toBeDisabled();
  await user.type(screen.getByLabelText("Lý do"), "Cần thêm bằng chứng");
  await user.click(screen.getByRole("checkbox"));
  await user.click(submit);
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith(`/verifier/death-cases/${CASE_ID}/objection/conclude`, {
    conclusion: "INSUFFICIENT_EVIDENCE",
    reason: "Cần thêm bằng chứng",
  });
});

it("Verifier chỉ xem được khi có VERIFIER_CONFLICT", async () => {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) =>
    String(url).endsWith("/objection")
      ? objection()
      : { ...verifierDetail, approveBlockers: ["VERIFIER_CONFLICT"] },
  );
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VerifierCaseDetail caseId={CASE_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(await screen.findByText("Owner báo còn sống")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Kết luận lời báo" })).not.toBeInTheDocument();
});

const verifiedIdentity = {
  verified: true,
  citizenId: "012345678901",
  fullName: "NGUYỄN VĂN B",
  dateOfBirth: "1950-03-04",
  verifiedAt: CREATED_AT,
  citizenIdMatches: true,
  fullNameMatches: false,
  hasDocumentImage: true,
  documentImageCapturedAt: CREATED_AT,
};

function renderVerifierWith(getImpl: (path: string) => unknown) {
  vi.spyOn(apiClient, "get").mockImplementation(async (url) => getImpl(String(url)));
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VerifierCaseDetail caseId={CASE_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

it("Verifier đối chiếu danh tính đã xác minh và xem ảnh CCCD cạnh selfie gần nhất", async () => {
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) =>
    (blob as Blob).type === "image/png" ? "blob:cccd" : "blob:selfie",
  );
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  renderVerifierWith((path) => {
    if (path.endsWith("/owner-identity/document-image"))
      return new Blob(["cccd"], { type: "image/png" });
    if (path.endsWith("/objection/selfie-image"))
      return new Blob(["selfie"], { type: "image/jpeg" });
    if (path.endsWith("/objection"))
      return objection({
        hasSelfieImage: true,
        selfieImageCapturedAt: CREATED_AT,
        selfieImageMatched: false,
      });
    return { ...verifierDetail, ownerIdentity: verifiedIdentity };
  });

  const table = await screen.findByRole("table");
  expect(table).toHaveTextContent("NGUYỄN VĂN B");
  expect(table).toHaveTextContent("Nguyễn Văn A");
  expect(table).toHaveTextContent("04/03/1950");
  expect(screen.getByText("Khớp")).toBeInTheDocument();
  expect(screen.getByText("Không khớp")).toBeInTheDocument();
  expect(await screen.findByText("Không khớp mẫu")).toBeInTheDocument();

  const documents = await screen.findAllByRole("img", { name: "Ảnh mặt trước CCCD của chủ kho" });
  expect(documents).toHaveLength(2);
  for (const image of documents) expect(image).toHaveAttribute("src", "blob:cccd");
  expect(
    await screen.findByRole("img", { name: "Ảnh selfie gần nhất của chủ kho" }),
  ).toHaveAttribute("src", "blob:selfie");
});

it("Chủ kho chưa xác minh thì không có bảng đối chiếu; ảnh 404 hiện 'Không có ảnh.'", async () => {
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  renderVerifierWith((path) => {
    if (path.endsWith("/objection/selfie-image"))
      throw new AxiosError("missing", undefined, undefined, undefined, {
        status: 404,
        statusText: "Not Found",
        config: { headers: new AxiosHeaders() },
        headers: {},
        data: { code: "IDENTITY_IMAGE_NOT_FOUND" },
      });
    if (path.endsWith("/objection"))
      return objection({ hasSelfieImage: true, selfieImageCapturedAt: CREATED_AT });
    return verifierDetail;
  });

  expect(await screen.findByText(/Chủ kho chưa xác minh danh tính/)).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(await screen.findByText("Chưa có ảnh CCCD lưu lúc xác minh.")).toBeInTheDocument();
  expect(await screen.findByText("Không có ảnh.")).toBeInTheDocument();
});
