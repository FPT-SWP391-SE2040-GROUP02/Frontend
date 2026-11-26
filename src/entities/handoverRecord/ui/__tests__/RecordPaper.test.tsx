import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { formatDateTime } from "@/shared/ui/heritageKit";
import { handoverRecordSchema, type HandoverRecord } from "../../model/handoverRecord.schema";
import { RecordPaper } from "../RecordPaper";

const AT = "2026-11-20T03:00:00+00:00";
const CONFIRMED_AT = "2026-11-21T08:30:00+00:00";

function buildRecord(extra: Record<string, unknown> = {}): HandoverRecord {
  return handoverRecordSchema.parse({
    id: "33333333-3333-4333-8333-333333333333",
    vaultId: "11111111-1111-4111-8111-111111111111",
    vaultName: "Tài sản gia đình",
    ownerName: "Anh Nam",
    status: "SIGNING",
    revisionNo: 1,
    requestedAt: AT,
    finalizedAt: AT,
    completedAt: null,
    verifierName: "Luật sư Dũng",
    executorName: "Chú Hải",
    verifierSignedAt: null,
    executorSignedAt: null,
    recipients: [],
    canSign: false,
    availableAssets: [],
    availableRecipients: [],
    ownerSplit: [],
    ...extra,
  });
}

afterEach(cleanup);

describe("RecordPaper: xác nhận căn cứ pháp lý", () => {
  it("đã xác nhận thì in dòng Luật sư ... xác nhận căn cứ pháp lý lúc ...", () => {
    render(
      <RecordPaper
        record={buildRecord({
          legalBasisConfirmedAt: CONFIRMED_AT,
          legalBasisConfirmedByUserId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          legalBasisConfirmedByName: "Trần Văn Dũng",
        })}
      />,
    );

    expect(
      screen.getByText(
        `Luật sư Trần Văn Dũng xác nhận căn cứ pháp lý lúc ${formatDateTime(CONFIRMED_AT)}`,
      ),
    ).toBeInTheDocument();
  });

  it("chưa xác nhận hoặc dữ liệu cũ thiếu trường thì không in dòng này", () => {
    render(<RecordPaper record={buildRecord()} />);

    expect(screen.queryByText(/xác nhận căn cứ pháp lý/)).not.toBeInTheDocument();
  });
});

describe("RecordPaper: khác cách chia ban đầu của Chủ tài sản", () => {
  const differences = [
    {
      kind: "RECIPIENT_REMOVED",
      beneficiaryId: null,
      recipientName: "Lê Bình",
      assetId: null,
      assetName: "",
      ownerRecipientNames: [],
      recordRecipientNames: [],
    },
  ];

  it("có khác biệt thì in mục và dòng luật sư xác nhận", () => {
    render(
      <RecordPaper
        record={buildRecord({
          splitDifferences: differences,
          splitDeviationConfirmedAt: CONFIRMED_AT,
          splitDeviationConfirmedByName: "Trần Văn Dũng",
        })}
      />,
    );

    expect(screen.getByText("Khác với cách chia ban đầu của Chủ tài sản")).toBeInTheDocument();
    expect(screen.getByText("Bỏ người nhận: Lê Bình")).toBeInTheDocument();
    expect(
      screen.getByText(`Luật sư Trần Văn Dũng xác nhận lúc ${formatDateTime(CONFIRMED_AT)}`),
    ).toBeInTheDocument();
  });

  it("không có khác biệt thì không in mục này", () => {
    render(<RecordPaper record={buildRecord()} />);

    expect(
      screen.queryByText("Khác với cách chia ban đầu của Chủ tài sản"),
    ).not.toBeInTheDocument();
  });
});

describe("RecordPaper: phạm vi tài sản số", () => {
  it("in câu chỉ áp dụng cho tài sản số ở cuối văn bản", () => {
    const { container } = render(<RecordPaper record={buildRecord()} />);

    const sentence =
      "Biên bản này chỉ áp dụng cho tài sản số lưu trong LegacyVault, không thay thế văn bản khai nhận, thỏa thuận phân chia di sản đối với tài sản khác.";
    expect(screen.getByText(sentence)).toBeInTheDocument();
    const lastParagraph = container.firstElementChild?.lastElementChild;
    expect(lastParagraph).toHaveTextContent(sentence);
  });
});

describe("RecordPaper: người nhận đồng ý nhận, chưa phải đã nhận", () => {
  it("ghi người nhận đồng ý nhận phần tài sản, không ghi đã nhận đủ khi chưa giao", () => {
    const { container } = render(<RecordPaper record={buildRecord()} />);

    expect(container).toHaveTextContent(
      "Mỗi người nhận xác nhận đúng danh tính của mình và đồng ý nhận phần tài sản ghi cho mình",
    );
    expect(container).toHaveTextContent("bên nhận đồng ý nhận tài sản nêu trên");
    expect(container).not.toHaveTextContent("đã nhận đủ phần tài sản");
    expect(container).not.toHaveTextContent("bên nhận đã nhận tài sản");
  });
});

describe("RecordPaper: khối chữ ký từng người", () => {
  const AN = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const BINH = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const SIGNED_AT = "2026-11-22T09:15:00+00:00";

  function person(beneficiaryId: string, fullName: string, signedAt: string | null) {
    return {
      beneficiaryId,
      fullName,
      citizenId: "001090000001",
      assets: [],
      turnId: null,
      turnStatus: "",
      claimed: true,
      submissionId: null,
      submissionStatus: "",
      identityConfirmedAt: null,
      signedAt,
    };
  }

  /** Các ô ký theo thứ tự trên tờ: Bên giao, Luật sư, rồi từng Bên nhận. */
  function slotsOf(container: HTMLElement) {
    return Array.from(container.querySelectorAll(".break-inside-avoid")).filter((slot) =>
      slot.textContent?.includes("(Ký, ghi rõ họ tên)"),
    );
  }

  it("hiện người đã ký (kèm giờ) và người chưa ký theo dữ liệu Backend", () => {
    const { container } = render(
      <RecordPaper
        record={buildRecord({
          recipients: [person(AN, "Trần An", SIGNED_AT), person(BINH, "Lê Bình", null)],
        })}
      />,
    );

    const [, , an, binh] = slotsOf(container);
    expect(an).toHaveTextContent("Đã ký điện tử");
    expect(an).toHaveTextContent(formatDateTime(SIGNED_AT));
    expect(binh).toHaveTextContent("(Chưa ký)");
  });

  it("nhiều người nhận: ô Bên giao và Luật sư ghi từng phần, phần đã ký hiện ngay dù người khác chưa", () => {
    const EXECUTOR_AT = "2026-11-22T02:40:00+00:00";
    const { container } = render(
      <RecordPaper
        record={buildRecord({
          recipients: [
            {
              ...person(AN, "Trần An", SIGNED_AT),
              executorSignedAt: EXECUTOR_AT,
              verifierSignedAt: SIGNED_AT,
            },
            person(BINH, "Lê Bình", null),
          ],
        })}
      />,
    );

    const [executor, verifier] = slotsOf(container);
    expect(executor).toHaveTextContent(
      `Phần của Trần AnĐã ký điện tử ${formatDateTime(EXECUTOR_AT)}`,
    );
    expect(executor).toHaveTextContent("Phần của Lê Bình: chưa ký");
    expect(verifier).toHaveTextContent(
      `Phần của Trần AnĐã ký điện tử ${formatDateTime(SIGNED_AT)}`,
    );
    expect(verifier).toHaveTextContent("Phần của Lê Bình: chưa ký");
  });

  it("một người nhận thì ô Bên giao và Luật sư giữ một dòng chữ ký", () => {
    const { container } = render(
      <RecordPaper
        record={buildRecord({
          verifierSignedAt: SIGNED_AT,
          recipients: [person(AN, "Trần An", null)],
        })}
      />,
    );

    const [executor, verifier] = slotsOf(container);
    expect(executor).toHaveTextContent("(Chưa ký)");
    expect(verifier).toHaveTextContent("Đã ký điện tử");
    expect(container).not.toHaveTextContent("Phần của Trần An");
  });
});
