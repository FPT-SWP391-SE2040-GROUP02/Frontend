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
    vaultName: "Kho gia đình",
    ownerName: "Anh Nam",
    status: "IDENTITY_CHECK",
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
