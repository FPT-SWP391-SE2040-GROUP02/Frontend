import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { RecipientRecordPanel } from "../RecipientRecordPanel";
import { VerifierRecordDetail } from "../VerifierRecordDetail";

const RECORD_ID = "33333333-3333-4333-8333-333333333333";
const VAULT_ID = "11111111-1111-4111-8111-111111111111";
const TURN_ID = "99999999-9999-4999-8999-999999999999";
const AN = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BINH = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const HOUSE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SAVINGS = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const AT = "2026-11-20T03:00:00+00:00";

const houseAsset = { assetId: HOUSE, name: "Sổ đỏ", kind: "FILE" };
const savingsAsset = { assetId: SAVINGS, name: "Sổ tiết kiệm", kind: "FILE" };

function recipient(beneficiaryId: string, fullName: string, assets: unknown[], extra: object = {}) {
  return {
    beneficiaryId,
    fullName,
    citizenId: "0001",
    assets,
    turnId: null,
    turnStatus: "",
    claimed: false,
    submissionId: null,
    submissionStatus: "",
    identityConfirmedAt: null,
    signedAt: null,
    ...extra,
  };
}

/** Biên bản Backend trả; mặc định đang lập, An đã được giao Sổ đỏ. */
function record(extra: Record<string, unknown> = {}) {
  return {
    id: RECORD_ID,
    vaultId: VAULT_ID,
    vaultName: "Kho gia đình",
    ownerName: "Anh Nam",
    status: "DRAFTING",
    revisionNo: 1,
    requestedAt: AT,
    finalizedAt: null,
    completedAt: null,
    verifierName: "Luật sư Dũng",
    executorName: "Chú Hải",
    verifierSignedAt: null,
    executorSignedAt: null,
    recipients: [recipient(AN, "Trần An", [houseAsset])],
    canSign: false,
    availableAssets: [houseAsset, savingsAsset],
    availableRecipients: [
      { beneficiaryId: AN, fullName: "Trần An", citizenId: "0001" },
      { beneficiaryId: BINH, fullName: "Lê Bình", citizenId: "0002" },
    ],
    ownerSplit: [],
    // An đã gửi yêu cầu kèm giấy tờ và được luật sư chấp nhận, nên chốt được biên bản.
    claims: [
      {
        id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        beneficiaryId: AN,
        fullName: "Trần An",
        citizenId: "0001",
        status: "ACCEPTED",
        note: "",
        reviewReason: null,
        createdAt: AT,
        reviewedAt: AT,
        files: [],
      },
    ],
    evidenceFiles: [],
    ...extra,
  };
}

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("record-flow-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

/** Backend giả có trạng thái: GET luôn trả bản mới nhất; POST/PUT trả và lưu bản kế tiếp. */
function backend(first: unknown, next?: unknown) {
  let current = first;
  const get = vi.spyOn(apiClient, "get").mockImplementation(async () => current);
  const write = async () => {
    current = next;
    return next;
  };
  const post = vi.spyOn(apiClient, "post").mockImplementation(write);
  const put = vi.spyOn(apiClient, "put").mockImplementation(write);
  return { get, post, put };
}

const LEGAL_BASIS_LABEL =
  "Tôi đã kiểm tra di chúc (bản sau cùng, hợp pháp) hoặc xác định không có di chúc, và lập biên bản này theo đúng quy định. Tôi chịu trách nhiệm về nội dung biên bản.";

/** Luật sư tick ô xác nhận căn cứ pháp lý trước khi chốt. */
async function confirmLegalBasis(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("checkbox", { name: LEGAL_BASIS_LABEL }));
}

function setup(children: ReactNode) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Luật sư lập biên bản (bước 1)", () => {
  it("đánh dấu cho thêm người cùng nhận một tài sản rồi lưu đúng các cặp người nhận - tài sản", async () => {
    const user = userEvent.setup();
    const { put } = backend(
      record(),
      record({
        recipients: [
          recipient(AN, "Trần An", [houseAsset]),
          recipient(BINH, "Lê Bình", [houseAsset]),
        ],
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByLabelText("Trần An nhận Sổ đỏ")).toBeChecked();
    const finalize = screen.getByRole("button", { name: "Chốt biên bản" });
    await confirmLegalBasis(user);
    expect(finalize).toBeEnabled();

    await user.click(screen.getByLabelText("Lê Bình nhận Sổ đỏ"));
    // Có thay đổi chưa lưu thì chưa chốt được.
    expect(finalize).toBeDisabled();
    expect(screen.getByText(/Có thay đổi chưa lưu/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Lưu biên bản" }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    const [url, body] = put.mock.calls[0];
    expect(url).toBe(`/verifier/handover-records/${RECORD_ID}/lines`);
    expect((body as { lines: unknown[] }).lines).toEqual(
      expect.arrayContaining([
        { beneficiaryId: AN, assetId: HOUSE },
        { beneficiaryId: BINH, assetId: HOUSE },
      ]),
    );
    expect((body as { lines: unknown[] }).lines).toHaveLength(2);
    // Lưu xong, nội dung biên bản đã đổi nên luật sư phải xác nhận lại căn cứ pháp lý rồi mới chốt.
    await waitFor(() => expect(screen.getByLabelText("Lê Bình nhận Sổ đỏ")).toBeEnabled());
    expect(screen.getByRole("button", { name: "Chốt biên bản" })).toBeDisabled();
    await confirmLegalBasis(user);
    expect(screen.getByRole("button", { name: "Chốt biên bản" })).toBeEnabled();
  });

  it("có biên bản phân chia của Chủ kho thì lấy làm bản đầu được", async () => {
    const user = userEvent.setup();
    const { post } = backend(
      record({
        recipients: [],
        ownerSplit: [{ packageName: "Gói nhà", beneficiaryIds: [AN], assetIds: [HOUSE] }],
      }),
      record(),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("Gói nhà: 1 tài sản cho 1 người nhận")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chốt biên bản" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Lấy biên bản phân chia làm bản đầu" }));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/use-owner-split`);
    expect(await screen.findByLabelText("Trần An nhận Sổ đỏ")).toBeChecked();
  });

  it("chốt biên bản thì sang bước ký và giao từng người, hiện nút kiểm cho người đã nộp căn cước", async () => {
    const user = userEvent.setup();
    const submissionId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    const { post } = backend(
      record(),
      record({
        status: "SIGNING",
        finalizedAt: AT,
        recipients: [
          recipient(AN, "Trần An", [houseAsset], {
            turnId: TURN_ID,
            submissionId,
            submissionStatus: "SUBMITTED",
          }),
        ],
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await confirmLegalBasis(user);
    await user.click(await screen.findByRole("button", { name: "Chốt biên bản" }));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/finalize`, {
      confirmLegalBasis: true,
    });
    expect(await screen.findByText("Bước 2 · Ký và giao từng người")).toBeInTheDocument();
    expect(screen.getByText(/Còn 1 người nhận chưa được xác nhận danh tính/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kiểm danh tính" })).toHaveAttribute(
      "href",
      `/notary/recipients?submissionId=${submissionId}`,
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("Backend từ chối chốt thì báo lỗi và vẫn ở bước lập", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue(record());
    vi.spyOn(apiClient, "post").mockRejectedValue(new Error("down"));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await confirmLegalBasis(user);
    await user.click(await screen.findByRole("button", { name: "Chốt biên bản" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chốt biên bản" })).toBeEnabled();
  });
});

describe("Luật sư xác nhận căn cứ pháp lý khi chốt", () => {
  it("chưa tick thì nút Chốt bị khóa; tick xong bật và gửi confirmLegalBasis: true", async () => {
    const user = userEvent.setup();
    const { post } = backend(record(), record({ status: "SIGNING", finalizedAt: AT }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    const checkbox = await screen.findByRole("checkbox", { name: LEGAL_BASIS_LABEL });
    const finalize = screen.getByRole("button", { name: "Chốt biên bản" });
    expect(checkbox).not.toBeChecked();
    expect(finalize).toBeDisabled();

    await user.click(checkbox);
    expect(finalize).toBeEnabled();

    await user.click(finalize);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/finalize`, {
      confirmLegalBasis: true,
    });
  });

  it("bỏ tick thì nút Chốt khóa lại", async () => {
    const user = userEvent.setup();
    backend(record());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await confirmLegalBasis(user);
    expect(screen.getByRole("button", { name: "Chốt biên bản" })).toBeEnabled();
    await user.click(screen.getByRole("checkbox", { name: LEGAL_BASIS_LABEL }));
    expect(screen.getByRole("button", { name: "Chốt biên bản" })).toBeDisabled();
  });

  it("biên bản mở lại về bước lập (bản mới) thì ô xác nhận bỏ tick", async () => {
    const user = userEvent.setup();
    const finalized = record({
      status: "SIGNING",
      finalizedAt: AT,
      legalBasisConfirmedAt: AT,
      legalBasisConfirmedByUserId: AN,
      legalBasisConfirmedByName: "Luật sư Dũng",
    });
    const reopened = record({ revisionNo: 2 });
    let current: unknown = record();
    vi.spyOn(apiClient, "get").mockImplementation(async () => current);
    const post = vi.spyOn(apiClient, "post").mockImplementation(async (url: string) => {
      if (url.endsWith("/finalize")) {
        current = finalized;
      } else {
        current = reopened;
      }
      return current;
    });
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await confirmLegalBasis(user);
    await user.click(screen.getByRole("button", { name: "Chốt biên bản" }));
    await screen.findByText("Bước 2 · Ký và giao từng người");

    await user.click(screen.getByRole("button", { name: "Mở lại biên bản để sửa" }));
    expect(post).toHaveBeenCalledTimes(2);

    // Quay về bước lập bản số 2: ô xác nhận trống, nút Chốt khóa dù biên bản đã có dữ liệu hợp lệ.
    const checkbox = await screen.findByRole("checkbox", { name: LEGAL_BASIS_LABEL });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Chốt biên bản" })).toBeDisabled();
  });
});

describe("Luật sư ký và mở lại biên bản (bước 2)", () => {
  const signing = (extra: Record<string, unknown> = {}) =>
    record({
      status: "SIGNING",
      finalizedAt: AT,
      canSign: true,
      recipients: [
        recipient(AN, "Trần An", [houseAsset], { turnId: TURN_ID, identityConfirmedAt: AT }),
      ],
      ...extra,
    });

  it("ký xác minh xong thì nút đổi thành Bạn đã ký", async () => {
    const user = userEvent.setup();
    const { post } = backend(signing(), signing({ canSign: false, verifierSignedAt: AT }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await user.click(await screen.findByRole("button", { name: "Ký xác minh" }));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/sign`);
    expect(await screen.findByRole("button", { name: "Bạn đã ký" })).toBeDisabled();
  });

  it("vừa chốt, người nhận chưa danh tính: nút ký của luật sư hiện ngay", async () => {
    const { post } = backend(
      signing({
        recipients: [recipient(AN, "Trần An", [houseAsset], { turnId: TURN_ID })],
      }),
      signing({ canSign: false, verifierSignedAt: AT }),
    );
    const user = userEvent.setup();
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    const button = await screen.findByRole("button", { name: "Ký xác minh" });
    expect(button).toBeEnabled();
    expect(screen.getByText("Chờ xác nhận danh tính")).toBeInTheDocument();
    await user.click(button);
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/sign`);
  });

  it("biên bản cũ còn IDENTITY_CHECK vẫn hiện nút ký như SIGNING", async () => {
    backend(signing({ status: "IDENTITY_CHECK" }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByRole("button", { name: "Ký xác minh" })).toBeEnabled();
  });

  it("tiến độ theo từng người: An đã được mở quyền tải, Bình chưa ký", async () => {
    const wholeRecord = signing({
      verifierSignedAt: AT,
      executorSignedAt: AT,
      canSign: false,
      recipients: [
        recipient(AN, "Trần An", [houseAsset], {
          turnId: TURN_ID,
          turnStatus: "HANDOVER_COMMITTED",
          identityConfirmedAt: AT,
          signedAt: AT,
        }),
        recipient(BINH, "Lê Bình", [savingsAsset], {
          turnId: "88888888-8888-4888-8888-888888888888",
          turnStatus: "READY_TO_ACCEPT",
          identityConfirmedAt: AT,
        }),
      ],
    });
    backend(wholeRecord);
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    const rows = await screen.findAllByRole("row");
    const an = rows.find((row) => within(row).queryByText("Trần An") !== null);
    const binh = rows.find((row) => within(row).queryByText("Lê Bình") !== null);
    expect(an).toHaveTextContent("Đã mở quyền tải");
    expect(binh).toHaveTextContent("Chờ người này ký");
    expect(screen.queryByText(/chờ tất cả/i)).not.toBeInTheDocument();
    // Đã giao cho An: không còn nút Mở lại, hiện lý do.
    expect(
      screen.queryByRole("button", { name: "Mở lại biên bản để sửa" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Đã giao tài sản cho ít nhất một người nhận nên không mở lại được biên bản. Sai sót sau khi giao xử lý ngoài hệ thống.",
      ),
    ).toBeInTheDocument();
  });

  it("chưa giao cho ai thì vẫn có nút Mở lại", async () => {
    backend(signing());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByRole("button", { name: "Mở lại biên bản để sửa" })).toBeEnabled();
    expect(
      screen.queryByText(/Đã giao tài sản cho ít nhất một người nhận/),
    ).not.toBeInTheDocument();
  });

  it("mở lại bị chặn vì đã có người được mở quyền tải thì báo câu dễ hiểu", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue(signing());
    vi.spyOn(apiClient, "post").mockRejectedValue(
      Object.assign(new Error("conflict"), {
        isAxiosError: true,
        response: {
          status: 409,
          data: { code: "HANDOVER_NOT_ALLOWED", reason: "PARTIALLY_DELIVERED" },
        },
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await user.click(await screen.findByRole("button", { name: "Mở lại biên bản để sửa" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Đã giao tài sản cho ít nhất một người nhận nên không mở lại được biên bản.",
    );
  });

  it("mở lại biên bản thì quay về bước lập để sửa", async () => {
    const user = userEvent.setup();
    const { post } = backend(signing(), record({ revisionNo: 2 }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(
      await screen.findByText(/mọi chữ ký đã có mất hiệu lực, cả ba bên phải ký lại/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mở lại biên bản để sửa" }));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/reopen`);
    expect(await screen.findByText("Bước 1 · Lập biên bản")).toBeInTheDocument();
  });

  it("mọi người nhận đã ký thì chỉ còn thông báo hoàn tất, không còn nút thao tác", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      signing({ status: "COMPLETED", canSign: false, completedAt: AT }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("Mọi người nhận đã ký")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ký xác minh|Mở lại/ })).not.toBeInTheDocument();
  });

  it("biên bản không được giao cho mình thì báo lỗi và có nút về danh sách", async () => {
    const back = vi.fn();
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("404"));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={back} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("biên bản không được giao cho bạn");
    await user.click(within(alert).getByRole("button", { name: "Về danh sách" }));
    expect(back).toHaveBeenCalledTimes(1);
  });
});

describe("Người nhận ký biên bản", () => {
  it("tới lượt ký thì bấm Ký biên bản; ký xong báo chờ luật sư hoặc Người thực thi ký", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    const mine = [
      recipient(AN, "Trần An", [houseAsset], { turnId: TURN_ID, identityConfirmedAt: AT }),
    ];
    const { post } = backend(
      record({ status: "SIGNING", finalizedAt: AT, canSign: true, recipients: mine }),
      record({
        status: "SIGNING",
        finalizedAt: AT,
        canSign: false,
        recipients: [
          recipient(AN, "Trần An", [houseAsset], {
            turnId: TURN_ID,
            identityConfirmedAt: AT,
            signedAt: AT,
          }),
        ],
      }),
    );
    setup(<RecipientRecordPanel turnId={TURN_ID} onChanged={changed} />);

    expect(
      await screen.findByText("Đọc kỹ phần tài sản của bạn rồi bấm Ký biên bản."),
    ).toBeInTheDocument();
    expect(screen.getByText("Phần của bạn trong biên bản bàn giao")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ký biên bản" }));
    expect(post).toHaveBeenCalledWith(`/handover/turns/${TURN_ID}/record/sign`);
    expect(
      await screen.findByText("Bạn đã ký. Chờ luật sư hoặc Người thực thi ký."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ký biên bản" })).not.toBeInTheDocument();
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it("chưa xong danh tính thì nhắc nộp ảnh căn cước và không có nút ký", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      record({
        status: "SIGNING",
        finalizedAt: AT,
        canSign: false,
        recipients: [recipient(AN, "Trần An", [houseAsset], { turnId: TURN_ID })],
      }),
    );
    setup(<RecipientRecordPanel turnId={TURN_ID} />);

    expect(
      await screen.findByText(/nộp ảnh căn cước để luật sư xác nhận danh tính/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ký biên bản" })).not.toBeInTheDocument();
  });

  it("phần của mình đã đủ chữ ký (HANDOVER_COMMITTED) dù biên bản còn đang ký: chờ mã nhận", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      record({
        status: "SIGNING",
        finalizedAt: AT,
        canSign: false,
        verifierSignedAt: AT,
        executorSignedAt: AT,
        recipients: [
          recipient(AN, "Trần An", [houseAsset], {
            turnId: TURN_ID,
            turnStatus: "HANDOVER_COMMITTED",
            identityConfirmedAt: AT,
            signedAt: AT,
          }),
        ],
      }),
    );
    setup(<RecipientRecordPanel turnId={TURN_ID} />);

    expect(await screen.findByText(/Phần của bạn đã đủ chữ ký/)).toBeInTheDocument();
  });

  it("luật sư đang sửa biên bản thì người nhận chưa ký được", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(record({ status: "DRAFTING" }));
    setup(<RecipientRecordPanel turnId={TURN_ID} />);

    expect(
      await screen.findByText("Luật sư đang sửa biên bản. Bạn chờ bản mới rồi ký."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ký biên bản" })).not.toBeInTheDocument();
  });
});

describe("Luật sư xét giấy tờ và tệp căn cứ", () => {
  const CLAIM = "abababab-abab-4bab-8bab-abababababab";
  const DOC = "cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd";
  const submitted = (extra: Record<string, unknown> = {}) =>
    record({
      claims: [
        {
          id: CLAIM,
          beneficiaryId: BINH,
          fullName: "Lê Bình",
          citizenId: "0002",
          status: "SUBMITTED",
          note: "Tôi là con",
          reviewReason: null,
          createdAt: AT,
          reviewedAt: null,
          files: [
            {
              id: DOC,
              fileName: "khai-sinh.pdf",
              contentType: "application/pdf",
              sizeBytes: 4096,
              createdAt: AT,
            },
          ],
        },
      ],
      ...extra,
    });

  it("còn yêu cầu chưa xét thì chưa chốt được; bổ sung hay từ chối phải ghi lý do", async () => {
    const user = userEvent.setup();
    const { post } = backend(
      submitted(),
      submitted({
        claims: [
          {
            ...submitted().claims[0],
            status: "REJECTED",
            reviewReason: "Giấy tờ không hợp lệ",
          },
        ],
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    const card = await screen.findByRole("article", { name: "Yêu cầu của Lê Bình" });
    expect(card).toHaveTextContent("Chờ luật sư xét");
    expect(card).toHaveTextContent("“Tôi là con”");
    expect(within(card).getByRole("button", { name: "Tải về khai-sinh.pdf" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chốt biên bản" })).toBeDisabled();
    expect(screen.getByText(/Còn yêu cầu nhận chưa xét xong/)).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Từ chối" })).toBeDisabled();
    expect(within(card).getByRole("button", { name: "Yêu cầu bổ sung" })).toBeDisabled();

    await user.type(within(card).getByLabelText(/Lý do/), "Giấy tờ không hợp lệ");
    await user.click(within(card).getByRole("button", { name: "Từ chối" }));
    expect(post).toHaveBeenCalledWith(
      `/verifier/handover-records/${RECORD_ID}/claims/${CLAIM}/review`,
      {
        decision: "REJECT",
        reason: "Giấy tờ không hợp lệ",
      },
    );
    // Người bị từ chối không được ghi tài sản.
    expect(await screen.findByLabelText("Lê Bình nhận Sổ đỏ")).toBeDisabled();
  });

  it("chấp nhận không cần lý do", async () => {
    const user = userEvent.setup();
    const { post } = backend(submitted(), record());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    const card = await screen.findByRole("article", { name: "Yêu cầu của Lê Bình" });
    await user.click(within(card).getByRole("button", { name: "Chấp nhận" }));
    expect(post).toHaveBeenCalledWith(
      `/verifier/handover-records/${RECORD_ID}/claims/${CLAIM}/review`,
      {
        decision: "ACCEPT",
        reason: undefined,
      },
    );
  });

  it("đính kèm và gỡ tệp căn cứ", async () => {
    const user = userEvent.setup();
    const withEvidence = record({
      evidenceFiles: [
        {
          id: DOC,
          fileName: "di-chuc.pdf",
          contentType: "application/pdf",
          sizeBytes: 2048,
          createdAt: AT,
        },
      ],
    });
    const { post } = backend(record(), withEvidence);
    const del = vi.spyOn(apiClient, "delete").mockResolvedValue(record());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("Chưa đính kèm tệp căn cứ nào.")).toBeInTheDocument();
    await user.upload(
      screen.getByLabelText(/Đính kèm tệp/),
      new File(["%PDF-1.4"], "di-chuc.pdf", { type: "application/pdf" }),
    );
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe(`/verifier/handover-records/${RECORD_ID}/evidence`);
    await user.click(await screen.findByRole("button", { name: "Gỡ di-chuc.pdf" }));
    expect(del).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/evidence/${DOC}`);
  });

  it("thêm người nhận mới phải đủ thông tin hợp lệ", async () => {
    const user = userEvent.setup();
    const { post } = backend(record(), record());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await user.click(await screen.findByRole("button", { name: "Thêm người nhận" }));
    await user.click(screen.getByRole("button", { name: "Lưu người nhận" }));
    expect(screen.getByText("Số căn cước gồm 12 chữ số.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Họ tên"), "Lê Văn Mới");
    await user.type(screen.getByLabelText("Số căn cước (12 số)"), "001090000099");
    await user.type(screen.getByLabelText("Ngày sinh"), "1990-01-01");
    await user.type(screen.getByLabelText("Email (nhận thư mời)"), "moi@example.com");
    await user.click(screen.getByRole("button", { name: "Lưu người nhận" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/recipients`, {
        fullName: "Lê Văn Mới",
        citizenId: "001090000099",
        dateOfBirth: "1990-01-01",
        email: "moi@example.com",
      }),
    );
  });

  it("Chủ kho đã hủy thì chỉ còn thông báo, không còn bước lập", async () => {
    backend(record({ status: "CANCELLED" }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("Chủ kho đã hủy yêu cầu nhận tài sản")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Chốt biên bản" })).not.toBeInTheDocument();
  });
});
