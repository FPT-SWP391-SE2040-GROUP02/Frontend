import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
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
  "Tôi đã kiểm tra di chúc (bản sau cùng, hợp pháp) và lập biên bản này theo đúng quy định. Tôi chịu trách nhiệm về nội dung biên bản.";

/** Luật sư tick ô xác nhận căn cứ pháp lý trước khi chốt. */
async function confirmLegalBasis(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("checkbox", { name: LEGAL_BASIS_LABEL }));
}

/** Người nhận được chọn trong hộp riêng của từng tài sản; mở hộp đó ra. */
async function openPicker(user: ReturnType<typeof userEvent.setup>, assetName: string) {
  await user.click(await screen.findByRole("button", { name: `Chọn người nhận ${assetName}` }));
}

async function closePicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Xong" }));
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

    await screen.findByRole("button", { name: "Chọn người nhận Sổ đỏ" });
    const finalize = screen.getByRole("button", { name: "Phát hành biên bản" });
    await confirmLegalBasis(user);
    expect(finalize).toBeEnabled();

    await openPicker(user, "Sổ đỏ");
    expect(screen.getByLabelText("Trần An nhận Sổ đỏ")).toBeChecked();
    await user.click(screen.getByLabelText("Lê Bình nhận Sổ đỏ"));
    await closePicker(user);
    // Nội dung đổi thì phải xác nhận lại căn cứ pháp lý.
    expect(finalize).toBeDisabled();

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
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Gỡ Lê Bình khỏi Sổ đỏ" })).toBeEnabled(),
    );
    expect(screen.getByRole("button", { name: "Phát hành biên bản" })).toBeDisabled();
    await confirmLegalBasis(user);
    expect(screen.getByRole("button", { name: "Phát hành biên bản" })).toBeEnabled();
  });

  it("có biên bản phân chia của Chủ tài sản thì lấy làm bản đầu được", async () => {
    const user = userEvent.setup();
    const { post } = backend(
      record({
        recipients: [],
        ownerSplit: [{ beneficiaryId: AN, assetIds: [HOUSE] }],
      }),
      record(),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("Chủ tài sản chia: Trần An")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Phát hành biên bản" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Lấy theo Chủ tài sản" }));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/use-owner-split`);
    expect(
      await screen.findByRole("button", { name: "Gỡ Trần An khỏi Sổ đỏ" }),
    ).toBeInTheDocument();
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
    await user.click(await screen.findByRole("button", { name: "Phát hành biên bản" }));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/finalize`, {
      confirmLegalBasis: true,
      confirmSplitDeviation: false,
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
    await user.click(await screen.findByRole("button", { name: "Phát hành biên bản" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Phát hành biên bản" })).toBeEnabled();
  });
});

const DEVIATION_LABEL =
  "Biên bản này khác cách chia ban đầu của Chủ tài sản (danh sách trên). Tôi xác nhận việc thay đổi là theo di chúc hoặc quy định pháp luật và chịu trách nhiệm về căn cứ này. LegacyVault chỉ giao tài sản theo biên bản luật sư đã lập.";

const differences = [
  {
    kind: "RECIPIENT_ADDED",
    beneficiaryId: BINH,
    recipientName: "Lê Bình",
    assetId: null,
    assetName: "",
    ownerRecipientNames: [],
    recordRecipientNames: [],
  },
  {
    kind: "ASSET_RECIPIENTS_CHANGED",
    beneficiaryId: null,
    recipientName: "",
    assetId: HOUSE,
    assetName: "Sổ đỏ",
    ownerRecipientNames: ["Trần An"],
    recordRecipientNames: [],
  },
];

describe("Làm tuần tự: giấy tờ, chia tài sản, chốt rồi mới ký", () => {
  it("còn giấy tờ chưa xét thì chưa mở mục B, C và chưa có tờ biên bản bàn giao", async () => {
    const pending = record();
    pending.claims[0].status = "SUBMITTED";
    backend(pending);
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("Xét giấy tờ ở mục A để mở bước tiếp theo")).toBeInTheDocument();
    expect(screen.queryByText("B. Chia tài sản cho từng người")).not.toBeInTheDocument();
    expect(screen.queryByText("C. Giấy tờ đính kèm thêm (nếu có)")).not.toBeInTheDocument();
    expect(screen.queryByText("Biên bản bàn giao")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ký xác minh" })).not.toBeInTheDocument();
  });

  it("đã chấp nhận thì mở mục B, C; tờ biên bản vẫn chờ tới khi chốt", async () => {
    backend(record());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("B. Chia tài sản cho từng người")).toBeInTheDocument();
    expect(screen.getByText("C. Giấy tờ đính kèm thêm (nếu có)")).toBeInTheDocument();
    expect(screen.queryByText("Biên bản bàn giao")).not.toBeInTheDocument();
  });
});

describe("Danh sách chia tài sản", () => {
  it("lọc tài sản chưa chia và soát lại theo từng người", async () => {
    const user = userEvent.setup();
    backend(record());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await user.selectOptions(await screen.findByLabelText("Lọc tài sản"), "empty");
    const list = screen.getByRole("list", { name: "Chia theo tài sản" });
    expect(within(list).getByText("Sổ tiết kiệm")).toBeInTheDocument();
    expect(within(list).queryByText("Sổ đỏ")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Theo từng người" }));
    const people = screen.getByRole("list", { name: "Chia theo từng người" });
    expect(within(people).getByText("CCCD 0001 · 1 tài sản")).toBeInTheDocument();
    expect(within(people).getByText("Chưa được chia tài sản nào")).toBeInTheDocument();
  });

  it("xem bản nháp biên bản bàn giao theo đúng cách đang chọn", async () => {
    const user = userEvent.setup();
    backend(record());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await user.click(await screen.findByRole("button", { name: "Xem trước biên bản" }));
    const sheet = screen.getByRole("article", { name: "Tờ Bản nháp biên bản bàn giao" });
    expect(sheet).toHaveTextContent("BẢN NHÁP để kiểm tra");
    expect(sheet).toHaveTextContent("Trần An (0001)");
    expect(sheet).toHaveTextContent("2 (đã chia 1, chưa chia 1)");
  });
});

describe("Luật sư xác nhận khi biên bản khác cách chia của Chủ tài sản", () => {
  it("không có khác biệt thì không hiện cảnh báo và chốt được sau khi tick căn cứ pháp lý", async () => {
    const user = userEvent.setup();
    backend(record());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await confirmLegalBasis(user);
    expect(screen.queryByRole("checkbox", { name: DEVIATION_LABEL })).not.toBeInTheDocument();
    expect(
      screen.queryByText("Biên bản khác cách chia ban đầu của Chủ tài sản"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Phát hành biên bản" })).toBeEnabled();
  });

  it("có khác biệt thì liệt kê, khóa Chốt tới khi tick ô xác nhận và gửi confirmSplitDeviation: true", async () => {
    const user = userEvent.setup();
    const { post } = backend(
      record({ splitDifferences: differences }),
      record({ status: "SIGNING", finalizedAt: AT }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("Thêm người nhận: Lê Bình")).toBeInTheDocument();
    expect(
      screen.getByText("Sổ đỏ: Chủ tài sản chia cho Trần An → biên bản ghi không ai"),
    ).toBeInTheDocument();
    const finalize = screen.getByRole("button", { name: "Phát hành biên bản" });
    await confirmLegalBasis(user);
    expect(finalize).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: DEVIATION_LABEL }));
    expect(finalize).toBeEnabled();
    await user.click(finalize);
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/finalize`, {
      confirmLegalBasis: true,
      confirmSplitDeviation: true,
    });
  });

  it("kho chưa khóa thì báo và khóa nút Chốt dù đã tick", async () => {
    backend(record({ vaultLocked: false }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await screen.findByText("Xét giấy tờ ở mục A để mở bước tiếp theo");
    expect(
      screen.getByText("Kho chưa khóa: chấp nhận giấy tờ của ít nhất một yêu cầu trước khi chốt."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Phát hành biên bản" })).not.toBeInTheDocument();
  });
});

describe("Luật sư xác nhận căn cứ pháp lý khi chốt", () => {
  it("chưa tick thì nút Chốt bị khóa; tick xong bật và gửi confirmLegalBasis: true", async () => {
    const user = userEvent.setup();
    const { post } = backend(record(), record({ status: "SIGNING", finalizedAt: AT }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    const checkbox = await screen.findByRole("checkbox", { name: LEGAL_BASIS_LABEL });
    const finalize = screen.getByRole("button", { name: "Phát hành biên bản" });
    expect(checkbox).not.toBeChecked();
    expect(finalize).toBeDisabled();

    await user.click(checkbox);
    expect(finalize).toBeEnabled();

    await user.click(finalize);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/finalize`, {
      confirmLegalBasis: true,
      confirmSplitDeviation: false,
    });
  });

  it("bỏ tick thì nút Chốt khóa lại", async () => {
    const user = userEvent.setup();
    backend(record());
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await confirmLegalBasis(user);
    expect(screen.getByRole("button", { name: "Phát hành biên bản" })).toBeEnabled();
    await user.click(screen.getByRole("checkbox", { name: LEGAL_BASIS_LABEL }));
    expect(screen.getByRole("button", { name: "Phát hành biên bản" })).toBeDisabled();
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
    await user.click(screen.getByRole("button", { name: "Phát hành biên bản" }));
    await screen.findByText("Bước 2 · Ký và giao từng người");

    await user.click(screen.getByRole("button", { name: "Mở lại biên bản để sửa" }));
    expect(post).toHaveBeenCalledTimes(2);

    // Quay về bước lập bản số 2: ô xác nhận trống, nút Chốt khóa dù biên bản đã có dữ liệu hợp lệ.
    const checkbox = await screen.findByRole("checkbox", { name: LEGAL_BASIS_LABEL });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Phát hành biên bản" })).toBeDisabled();
  });
});

describe("Luật sư ký và mở lại biên bản (bước 2)", () => {
  const confirmed = { turnId: TURN_ID, identityConfirmedAt: AT };
  const signing = (extra: Record<string, unknown> = {}) =>
    record({
      status: "SIGNING",
      finalizedAt: AT,
      canSign: true,
      recipients: [
        recipient(AN, "Trần An", [houseAsset], {
          ...confirmed,
          executorSignedAt: AT,
          canSign: true,
        }),
      ],
      ...extra,
    });

  it("ký riêng cho người nhận trên dòng của họ; ký xong ô chữ ký hiện Đã ký điện tử", async () => {
    const user = userEvent.setup();
    const { post } = backend(
      signing(),
      signing({
        canSign: false,
        recipients: [
          recipient(AN, "Trần An", [houseAsset], {
            ...confirmed,
            executorSignedAt: AT,
            verifierSignedAt: AT,
          }),
        ],
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    // Chưa mở tờ biên bản thì chưa có nút ký ở đâu cả.
    await screen.findByRole("button", { name: "Xem và ký" });
    expect(screen.queryByRole("button", { name: "Ký xác minh" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xem và ký" }));
    const button = await screen.findByRole("button", { name: "Ký xác minh" });
    expect(button.closest("div.break-inside-avoid")).toHaveTextContent("Luật sư chứng kiến");
    await user.click(button);
    expect(post).toHaveBeenCalledWith(
      `/verifier/handover-records/${RECORD_ID}/recipients/${AN}/sign`,
    );
    const dialog = screen.getByRole("dialog");
    expect((await within(dialog).findAllByText("Đã ký điện tử")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Ký xác minh" })).not.toBeInTheDocument();
  });

  it("người nhận chưa được xác nhận danh tính thì luật sư chưa có nút ký", async () => {
    backend(
      signing({
        canSign: false,
        recipients: [
          recipient(AN, "Trần An", [houseAsset], { turnId: TURN_ID }),
          recipient(BINH, "Lê Bình", [savingsAsset]),
        ],
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await screen.findAllByText("Chờ xác nhận danh tính");
    expect(screen.queryByRole("button", { name: "Xem và ký" })).not.toBeInTheDocument();
    expect(screen.getByText(/ký được cho người đó/)).toBeInTheDocument();
  });

  it("biên bản cũ còn IDENTITY_CHECK vẫn hiện nút ký như SIGNING", async () => {
    const user = userEvent.setup();
    backend(signing({ status: "IDENTITY_CHECK" }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await user.click(await screen.findByRole("button", { name: "Xem và ký" }));
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
      await screen.findByText(/mọi chữ ký mất hiệu lực, các bên phải ký lại/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mở lại biên bản để sửa" }));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/reopen`);
    expect(await screen.findByText("B. Chia tài sản cho từng người")).toBeInTheDocument();
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
      await screen.findByText(
        "Bấm Xem và ký biên bản, đọc kỹ phần tài sản của bạn rồi bấm Ký biên bản ở ô chữ ký của bạn.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Tóm tắt phần của bạn trong Biên bản bàn giao")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ký biên bản" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Xem và ký biên bản" }));
    const signSlot = (await screen.findByRole("button", { name: "Ký biên bản" })).closest(
      "div.break-inside-avoid",
    );
    expect(signSlot).toHaveTextContent("Bên nhận");
    expect(signSlot).toHaveTextContent("Trần An");
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

describe("Phiếu giao nhận", () => {
  it("phiếu giao nhận: hiện nội dung người nhận báo thiếu và xem được tờ phiếu bản nháp", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue(
      record({
        status: "COMPLETED",
        canSign: false,
        completedAt: AT,
        verifierSignedAt: AT,
        recipients: [
          recipient(AN, "Trần An", [houseAsset], {
            turnId: TURN_ID,
            turnStatus: "HANDOVER_COMMITTED",
            identityConfirmedAt: AT,
            receiptIssueNote: "Thiếu trang 2",
            receiptIssueAt: AT,
          }),
        ],
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("“Thiếu trang 2”")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xem phiếu" }));
    const paper = await screen.findByRole("article", { name: "Tờ Phiếu giao nhận" });
    expect(paper).toHaveTextContent("chưa đủ chữ ký hai bên");
    expect(paper).toHaveTextContent("Sổ đỏ");
    expect(within(paper).getAllByText("(Chưa ký)")).toHaveLength(2);
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

  it("còn yêu cầu chưa xét thì chưa chốt được; từ chối phải ghi lý do; không còn nút yêu cầu bổ sung", async () => {
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
          // Còn một người được chấp nhận nên mục B mở ra sau khi từ chối.
          record().claims[0],
        ],
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    const card = await screen.findByRole("article", { name: "Yêu cầu của Lê Bình" });
    expect(card).toHaveTextContent("Chờ luật sư xét");
    expect(card).toHaveTextContent("“Tôi là con”");
    expect(within(card).getByRole("button", { name: "Tải về khai-sinh.pdf" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Phát hành biên bản" })).not.toBeInTheDocument();
    expect(screen.getByText(/Còn yêu cầu nhận chưa xét xong/)).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Từ chối" })).toBeDisabled();
    expect(within(card).queryByRole("button", { name: "Yêu cầu bổ sung" })).not.toBeInTheDocument();

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
    await openPicker(user, "Sổ đỏ");
    expect(screen.getByLabelText("Lê Bình nhận Sổ đỏ")).toBeDisabled();
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
    // Mục C mặc định thu gọn: mở ra trước khi đính kèm.
    const evidence = screen.getByRole("region", { name: /C\. Giấy tờ đính kèm/ });
    await user.click(within(evidence).getByRole("button", { name: "Mở" }));
    await user.upload(
      screen.getByLabelText(/Đính kèm tệp/),
      new File(["%PDF-1.4"], "di-chuc.pdf", { type: "application/pdf" }),
    );
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe(`/verifier/handover-records/${RECORD_ID}/evidence`);
    await user.click(await screen.findByRole("button", { name: "Gỡ di-chuc.pdf" }));
    expect(del).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/evidence/${DOC}`);
  });

  it("một nút: nhập người nhận trong di chúc rồi lưu, chốt và gửi thư theo đúng thứ tự", async () => {
    const user = userEvent.setup();
    const NEW_ID = "99999999-9999-4999-8999-999999999999";
    const drafting = record({
      recipients: [],
      availableRecipients: [],
      claims: [],
      reports: [
        {
          id: DOC,
          submitterName: "Lê Nộp",
          note: "",
          createdAt: AT,
          recipients: [{ fullName: "Lê Văn Mới", email: "moi@example.com", phone: "" }],
          files: [],
        },
      ],
    });
    const added = {
      ...drafting,
      availableRecipients: [
        {
          beneficiaryId: NEW_ID,
          fullName: "Lê Văn Mới",
          citizenId: "001090000099",
          email: "moi@example.com",
        },
      ],
    };
    let current: unknown = drafting;
    vi.spyOn(apiClient, "get").mockImplementation(async () => current);
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(added);
    let finalizeFails = true;
    const post = vi.spyOn(apiClient, "post").mockImplementation(async (url: string) => {
      if (url.endsWith("/recipients/batch")) return added;
      if (finalizeFails) {
        finalizeFails = false;
        throw new Error("down");
      }
      current = record({ status: "SIGNING", finalizedAt: AT });
      return current;
    });
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    // Hồ sơ báo tin điền sẵn; thiếu căn cước, ngày sinh, tài sản thì không gửi gì.
    expect(await screen.findByLabelText("Họ tên")).toHaveValue("Lê Văn Mới");
    await confirmLegalBasis(user);
    await user.click(screen.getByRole("button", { name: "Phát hành biên bản" }));
    expect(screen.getByText("Số căn cước gồm 12 chữ số.")).toBeInTheDocument();
    expect(screen.getByText("Chọn ít nhất một tài sản.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Số căn cước (12 số)"), "001090000099");
    await user.type(screen.getByLabelText("Ngày sinh"), "1990-01-01");
    await user.click(screen.getByRole("checkbox", { name: "Sổ đỏ" }));
    // Sửa nội dung thì phải xác nhận lại căn cứ pháp lý.
    expect(screen.getByRole("button", { name: "Phát hành biên bản" })).toBeDisabled();
    await confirmLegalBasis(user);
    await user.click(screen.getByRole("button", { name: "Phát hành biên bản" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[0]).toEqual([
      `/verifier/handover-records/${RECORD_ID}/recipients/batch`,
      {
        recipients: [
          {
            fullName: "Lê Văn Mới",
            citizenId: "001090000099",
            dateOfBirth: "1990-01-01",
            email: "moi@example.com",
          },
        ],
      },
    ]);
    expect(put.mock.calls[0][1]).toEqual({ lines: [{ beneficiaryId: NEW_ID, assetId: HOUSE }] });

    // Chốt lỗi: bấm lại không thêm trùng người nhận.
    const retry = await screen.findByRole("button", { name: "Phát hành biên bản" });
    await waitFor(() => expect(retry).toBeEnabled());
    await user.click(retry);
    expect(await screen.findByText("Bước 2 · Ký và giao từng người")).toBeInTheDocument();
    expect(
      post.mock.calls.filter(([url]) => String(url).endsWith("/recipients/batch")),
    ).toHaveLength(1);
  });

  it("người khai trong hồ sơ: trùng email thì không điền sẵn, trùng tên thì điền và nhắc kiểm lại", async () => {
    // Chuẩn bị
    const drafting = record({
      recipients: [],
      claims: [],
      availableRecipients: [
        { beneficiaryId: AN, fullName: "Trần An", citizenId: "0001", email: "an@example.com" },
      ],
      ownerSplit: [{ beneficiaryId: AN, assetIds: [HOUSE] }],
      reports: [
        {
          id: DOC,
          submitterName: "Lê Nộp",
          note: "",
          createdAt: AT,
          recipients: [
            { fullName: "Trần Văn An", email: "AN@example.com", phone: "" },
            { fullName: "Trần An", email: "an-khac@example.com", phone: "" },
          ],
          files: [],
        },
      ],
    });
    vi.spyOn(apiClient, "get").mockResolvedValue(drafting);

    // Hành động
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    // Kiểm tra: một ô điền sẵn (người trùng tên), người trùng email chỉ được nêu tên
    expect(await screen.findByLabelText("Email (nhận thư mời)")).toHaveValue("an-khac@example.com");
    expect(screen.getByText(/Trong kho đã có người tên Trần An/)).toBeInTheDocument();
    expect(screen.getByText(/Trần Văn An \(trùng email với Trần An\)/)).toBeInTheDocument();
    expect(screen.getByText("Chủ tài sản chia: Trần An")).toBeInTheDocument();
    // Người đang nhập làm biên bản khác cách chia: ô xác nhận hiện ngay, chưa cần gửi gì
    expect(screen.getByText("Thêm người nhận: Trần An")).toBeInTheDocument();
  });

  it("máy chủ từ chối một người nhận thì báo lỗi đúng ô, giữ nguyên phần đang nhập", async () => {
    // Chuẩn bị
    const user = userEvent.setup();
    const drafting = record({
      recipients: [],
      availableRecipients: [],
      claims: [],
      reports: [
        {
          id: DOC,
          submitterName: "Lê Nộp",
          note: "",
          createdAt: AT,
          recipients: [{ fullName: "Lê Văn Mới", email: "moi@example.com", phone: "" }],
          files: [],
        },
      ],
    });
    vi.spyOn(apiClient, "get").mockResolvedValue(drafting);
    const put = vi.spyOn(apiClient, "put");
    const post = vi.spyOn(apiClient, "post").mockRejectedValue(
      new AxiosError("bad", AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {
          code: "VALIDATION_ERROR",
          errors: {
            "recipients[0].email": [
              "Người nhận mới 1: Email người nhận không được trùng với email của Chủ tài sản.",
            ],
          },
        },
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    // Hành động
    await user.type(await screen.findByLabelText("Số căn cước (12 số)"), "001090000099");
    await user.type(screen.getByLabelText("Ngày sinh"), "1990-01-01");
    await user.click(screen.getByRole("checkbox", { name: "Sổ đỏ" }));
    await confirmLegalBasis(user);
    await user.click(screen.getByRole("button", { name: "Phát hành biên bản" }));

    // Kiểm tra
    expect(
      await screen.findByText("Email người nhận không được trùng với email của Chủ tài sản."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Họ tên")).toHaveValue("Lê Văn Mới");
    expect(post).toHaveBeenCalledTimes(1);
    expect(put).not.toHaveBeenCalled();
  });

  it("luật sư không còn khung hủy biên bản; biên bản đã hủy vẫn xem được", async () => {
    backend(record());
    const view = setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);
    await screen.findByText("B. Chia tài sản cho từng người");
    expect(screen.queryByRole("button", { name: "Hủy biên bản" })).not.toBeInTheDocument();

    view.unmount();
    client.clear();
    vi.restoreAllMocks();
    backend(record({ status: "CANCELLED", cancelReason: "Mở nhầm" }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);
    expect(await screen.findByText("Biên bản này đã hủy")).toBeInTheDocument();
    expect(screen.getByText("Trần An")).toBeInTheDocument();
  });
});

describe("Luật sư nhắc Người thực thi ký", () => {
  const REMIND = "Nhắc Người thực thi ký";
  const FUTURE = "2099-01-02T03:00:00+00:00";

  it("hiện nút khi biên bản đã chốt và Người thực thi chưa ký", async () => {
    backend(record({ status: "SIGNING", finalizedAt: AT }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByRole("button", { name: REMIND })).toBeEnabled();
    expect(screen.queryByText(/Đã nhắc lúc/)).not.toBeInTheDocument();
  });

  it("ẩn nút khi Người thực thi đã ký", async () => {
    backend(record({ status: "SIGNING", finalizedAt: AT, executorSignedAt: AT }));
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByText("Bước 2 · Ký và giao từng người")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: REMIND })).not.toBeInTheDocument();
  });

  it("bấm nhắc thì gọi đúng endpoint rồi hiện Đã nhắc lúc", async () => {
    const user = userEvent.setup();
    const { post } = backend(
      record({ status: "SIGNING", finalizedAt: AT }),
      record({
        status: "SIGNING",
        finalizedAt: AT,
        executorReminderSentAt: AT,
        executorRemindAvailableAt: FUTURE,
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await user.click(await screen.findByRole("button", { name: REMIND }));
    expect(post).toHaveBeenCalledWith(`/verifier/handover-records/${RECORD_ID}/remind-executor`);
    expect(await screen.findByText(/Đã nhắc lúc/)).toBeInTheDocument();
  });

  it("khóa nút và hiện gợi ý khi chưa tới lúc nhắc lại", async () => {
    backend(
      record({
        status: "SIGNING",
        finalizedAt: AT,
        executorReminderSentAt: AT,
        executorRemindAvailableAt: FUTURE,
      }),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    expect(await screen.findByRole("button", { name: REMIND })).toBeDisabled();
    expect(screen.getByText(/Nhắc lại được sau/)).toBeInTheDocument();
  });

  it("báo REMINDED_RECENTLY bằng thông báo tiếng Việt kèm thời điểm được nhắc lại", async () => {
    const user = userEvent.setup();
    backend(record({ status: "SIGNING", finalizedAt: AT }));
    const response = {
      status: 409,
      data: {
        code: "HANDOVER_NOT_ALLOWED",
        reason: "REMINDED_RECENTLY",
        remindAvailableAt: FUTURE,
      },
    } as AxiosResponse;
    vi.spyOn(apiClient, "post").mockRejectedValue(
      new AxiosError("conflict", "ERR_BAD_REQUEST", undefined, undefined, response),
    );
    setup(<VerifierRecordDetail recordId={RECORD_ID} onBack={() => undefined} />);

    await user.click(await screen.findByRole("button", { name: REMIND }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Bạn vừa nhắc Người thực thi\. Nhắc lại được sau .+\./);
  });
});
