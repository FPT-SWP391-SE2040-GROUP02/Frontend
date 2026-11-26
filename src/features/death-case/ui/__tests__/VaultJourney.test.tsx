import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VaultJourney } from "../VaultJourney";
import type { ExecutorVault } from "../../model/deathCase.schema";
import { handoverProgressSchema } from "../../model/handoverProgress.schema";

const vault: ExecutorVault = {
  vaultId: "11111111-1111-4111-8111-111111111111",
  ownerFullName: "Anh Nam",
  planStatus: "HANDOVER_IN_PROGRESS",
  handoverRecordId: "33333333-3333-4333-8333-333333333333",
  handoverRecordStatus: "COMPLETED",
};

const SENT = "2026-12-23T06:14:00+00:00";
const turn = (index: number, overrides: Record<string, unknown>) => ({
  turnId: `5555555${index}-5555-4555-8555-555555555555`,
  containerName: `Gói ${index}`,
  beneficiaryCitizenId: "1234",
  status: "INVITED",
  claimedByYou: false,
  identityConfirmedByExecutor: false,
  invitedAt: SENT,
  responseDeadline: SENT,
  claimedAt: null,
  decisionDeadline: null,
  decidedAt: null,
  grantStatus: null,
  grantExpiresAt: null,
  totalItems: 2,
  downloadedItems: 0,
  items: [],
  ...overrides,
});

describe("VaultJourney", () => {
  it("chỉ 3 bước của cả tài sản, không có thanh 5 bước theo người nhận", () => {
    render(<VaultJourney vault={vault} recordStatus="" progress={null} />);
    expect(screen.getByRole("heading", { name: "Kho đang ở đâu" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Yêu cầu nhận")).toBeInTheDocument();
    expect(screen.getByText("Biên bản bàn giao")).toBeInTheDocument();
    expect(screen.getByText("Bàn giao cho người nhận")).toBeInTheDocument();
    expect(screen.queryByText(/eKYC/i)).not.toBeInTheDocument();
  });

  it("đang bàn giao: bước 3 đang ở đây, dòng phụ x/y người đã nhận xong", () => {
    const progress = handoverProgressSchema.parse({
      caseId: "33333333-3333-4333-8333-333333333333",
      handoverStarted: true,
      serverTime: SENT,
      summary: {
        totalTurns: 2,
        waitingResponse: 1,
        inVerification: 0,
        accepted: 1,
        declined: 0,
        ended: 0,
      },
      turns: [
        turn(1, {
          status: "HANDOVER_COMMITTED",
          invitationSentAt: SENT,
          keyVerifiedAt: SENT,
          downloadedItems: 2,
          receivedAllAt: SENT,
          receiptExecutorSignedAt: SENT,
        }),
        turn(2, { invitationSentAt: SENT }),
      ],
    });
    render(<VaultJourney vault={vault} recordStatus="COMPLETED" progress={progress} />);
    expect(screen.getByText("1/2 người đã nhận xong")).toBeInTheDocument();
    expect(screen.getByText("Bàn giao cho người nhận").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
  });
});
