import { describe, expect, it } from "vitest";
import { handoverProgressSchema, type HandoverProgressTurn } from "../handoverProgress.schema";
import { countTurns, deriveTurnProgress, formatStepTime, sortTurnRows } from "../executorTurns";

const BASE = {
  turnId: "55555555-5555-4555-8555-555555555555",
  containerName: "Gói A",
  beneficiaryCitizenId: "1234",
  status: "INVITED",
  claimedByYou: false,
  identityConfirmedByExecutor: false,
  invitedAt: "2026-12-23T06:00:00+00:00",
  responseDeadline: "2026-12-28T06:00:00+00:00",
  claimedAt: null,
  decisionDeadline: null,
  decidedAt: null,
  grantStatus: null,
  grantExpiresAt: null,
  totalItems: 3,
  downloadedItems: 0,
  items: [],
};

/** Dựng lượt qua schema thật để các trường mới có giá trị mặc định đúng như khi Backend cũ chưa gửi. */
function turn(overrides: Record<string, unknown> = {}): HandoverProgressTurn {
  const parsed = handoverProgressSchema.parse({
    caseId: "33333333-3333-4333-8333-333333333333",
    handoverStarted: true,
    serverTime: "2026-12-23T08:00:00+00:00",
    summary: {
      totalTurns: 1,
      waitingResponse: 0,
      inVerification: 0,
      accepted: 0,
      declined: 0,
      ended: 0,
    },
    turns: [{ ...BASE, ...overrides }],
  });
  return parsed.turns[0];
}

const SENT = "2026-12-23T06:14:00+00:00"; // 13:14 giờ Việt Nam
const SIGNED = "2026-12-23T07:00:00+00:00";
const APPROVED = "2026-12-23T08:00:00+00:00";
const KEY = "2026-12-23T09:00:00+00:00";
const RECEIVED = "2026-12-23T09:52:00+00:00";

function states(progress: ReturnType<typeof deriveTurnProgress>): string[] {
  return progress.segments.map((segment) => segment.state);
}

describe("formatStepTime", () => {
  it("hiện HH:mm dd/MM theo giờ Việt Nam", () => {
    expect(formatStepTime(SENT)).toBe("13:14 23/12");
  });
  it("giá trị rỗng hoặc sai thì hiện gạch ngang", () => {
    expect(formatStepTime(null)).toBe("—");
    expect(formatStepTime("không phải ngày")).toBe("—");
  });
});

describe("deriveTurnProgress: từng trạng thái của lượt", () => {
  it("chưa gửi được lời mời: bước Đã mời đang chờ, không phải việc của Người thực thi", () => {
    const progress = deriveTurnProgress(turn({ invitationSentAt: null }));
    expect(states(progress)).toEqual(["current", "pending", "pending", "pending", "pending"]);
    expect(progress.headline).toBe("Chưa gửi lời mời");
    expect(progress.group).toBe("waiting");
    expect(progress.needsAction).toBe(false);
  });

  it("đã mời, chờ người nhận trả lời", () => {
    const progress = deriveTurnProgress(turn({ invitationSentAt: SENT }));
    expect(states(progress)).toEqual(["done", "current", "pending", "pending", "pending"]);
    expect(progress.headline).toBe("Chờ người nhận trả lời");
    expect(progress.detail).toBe("đã mời 13:14 23/12");
    expect(progress.chip).toBe("Chờ trả lời");
    expect(progress.tone).toBe("warning");
    expect(progress.segments[0].timeText).toBe("13:14 23/12");
    expect(progress.segments[1].timeText).toBe("đang chờ");
    expect(progress.segments[2].timeText).toBe("—");
  });

  it("quá hạn phản hồi vẫn chỉ là chờ trả lời, không nói quá hạn", () => {
    const progress = deriveTurnProgress(
      turn({ status: "INITIAL_RESPONSE_EXPIRED", invitationSentAt: SENT }),
    );
    expect(progress.headline).toBe("Chờ người nhận trả lời");
    expect(`${progress.headline} ${progress.detail}`).not.toMatch(/hạn/i);
  });

  it("người nhận đã bấm Bắt đầu: chờ luật sư kiểm danh tính", () => {
    const progress = deriveTurnProgress(
      turn({ status: "IDENTITY_IN_PROGRESS", invitationSentAt: SENT, claimedAt: SENT }),
    );
    expect(states(progress)).toEqual(["done", "current", "pending", "pending", "pending"]);
    expect(progress.headline).toBe("Chờ luật sư kiểm danh tính");
    expect(progress.chip).toBe("Đang kiểm danh tính");
  });

  it("luật sư đã xác nhận danh tính: chờ người nhận ký biên bản", () => {
    const progress = deriveTurnProgress(
      turn({ status: "READY_TO_ACCEPT", invitationSentAt: SENT, identityConfirmedAt: SIGNED }),
    );
    expect(states(progress)).toEqual(["done", "done", "current", "pending", "pending"]);
    expect(progress.segments[1].timeText).toBe("14:00 23/12");
    expect(progress.headline).toBe("Chờ người nhận ký biên bản");
    expect(progress.detail).toBe("danh tính đã xong, người nhận chưa ký");
    expect(progress.group).toBe("waiting");
  });

  it("người nhận đã ký mà luật sư hoặc Người thực thi chưa ký: chờ họ, ghi giờ người nhận ký", () => {
    const progress = deriveTurnProgress(
      turn({
        status: "READY_TO_ACCEPT",
        invitationSentAt: SENT,
        identityConfirmedAt: SIGNED,
        recipientSignedAt: APPROVED,
      }),
    );
    expect(progress.headline).toBe("Chờ luật sư hoặc Người thực thi ký");
    expect(progress.detail).toBe("người nhận đã ký 15:00 23/12");
  });

  it("Người xét duyệt đã duyệt, chưa nhập mã: cần bạn đưa mã", () => {
    const progress = deriveTurnProgress(
      turn({
        status: "HANDOVER_COMMITTED",
        invitationSentAt: SENT,
        recipientSignedAt: SIGNED,
        documentApprovedAt: APPROVED,
        decidedAt: APPROVED,
      }),
    );
    expect(states(progress)).toEqual(["done", "done", "done", "current", "pending"]);
    expect(progress.headline).toBe("Chờ nhập mã nhận");
    expect(progress.detail).toBe("bạn cần đưa mã cho người này");
    expect(progress.group).toBe("action");
    expect(progress.needsAction).toBe(true);
    expect(progress.chip).toBe("Chờ nhập mã");
  });

  it("đã nhập mã, đang tải dở", () => {
    const progress = deriveTurnProgress(
      turn({
        status: "HANDOVER_COMMITTED",
        invitationSentAt: SENT,
        recipientSignedAt: SIGNED,
        documentApprovedAt: APPROVED,
        decidedAt: APPROVED,
        keyVerifiedAt: KEY,
        downloadedItems: 1,
      }),
    );
    expect(states(progress)).toEqual(["done", "done", "done", "done", "current"]);
    expect(progress.headline).toBe("Chờ người nhận tải tài sản");
    expect(progress.detail).toBe("tải 1/3 tài sản");
    expect(progress.needsAction).toBe(false);
    expect(progress.segments[3].timeText).toBe("16:00 23/12");
  });

  it("người nhận đã ký phiếu: tới lượt Người thực thi ký", () => {
    const progress = deriveTurnProgress(
      turn({
        status: "HANDOVER_COMMITTED",
        invitationSentAt: SENT,
        documentApprovedAt: APPROVED,
        keyVerifiedAt: KEY,
        downloadedItems: 3,
        receivedAllAt: RECEIVED,
      }),
    );
    expect(states(progress)).toEqual(["done", "done", "done", "done", "current"]);
    expect(progress.headline).toBe("Chờ bạn ký phiếu giao nhận");
    expect(progress.needsAction).toBe(true);
  });

  it("người nhận báo thiếu: hiện nội dung báo", () => {
    const progress = deriveTurnProgress(
      turn({
        status: "HANDOVER_COMMITTED",
        invitationSentAt: SENT,
        documentApprovedAt: APPROVED,
        keyVerifiedAt: KEY,
        receiptIssueNote: "Thiếu ảnh",
        receiptIssueAt: RECEIVED,
      }),
    );
    expect(progress.headline).toBe("Người nhận báo thiếu hoặc sai");
    expect(progress.detail).toBe("Thiếu ảnh");
  });

  it("tải đủ: đã nhận xong, cả 5 đoạn xanh", () => {
    const progress = deriveTurnProgress(
      turn({
        status: "HANDOVER_COMMITTED",
        invitationSentAt: SENT,
        recipientSignedAt: SIGNED,
        documentApprovedAt: APPROVED,
        decidedAt: APPROVED,
        keyVerifiedAt: KEY,
        downloadedItems: 3,
        receivedAllAt: RECEIVED,
        receiptExecutorSignedAt: RECEIVED,
      }),
    );
    expect(states(progress)).toEqual(["done", "done", "done", "done", "done"]);
    expect(progress.headline).toBe("Đã nhận xong");
    expect(progress.detail).toBe("tải 3/3 tài sản 16:52 23/12");
    expect(progress.group).toBe("done");
    expect(progress.tone).toBe("success");
  });

  it("kho không dùng mã: đã tải được thì bước nhập mã coi là qua, giờ hiện gạch ngang", () => {
    const progress = deriveTurnProgress(
      turn({
        status: "HANDOVER_COMMITTED",
        invitationSentAt: SENT,
        recipientSignedAt: SIGNED,
        documentApprovedAt: APPROVED,
        decidedAt: APPROVED,
        downloadedItems: 1,
      }),
    );
    expect(states(progress)).toEqual(["done", "done", "done", "done", "current"]);
    expect(progress.segments[3].timeText).toBe("—");
  });

  it("dữ liệu cũ không có giờ: lượt đã nhận vẫn qua bước danh tính và ký bằng decidedAt", () => {
    const progress = deriveTurnProgress(
      turn({ status: "HANDOVER_COMMITTED", decidedAt: APPROVED, invitationSentAt: SENT }),
    );
    expect(states(progress).slice(0, 3)).toEqual(["done", "done", "done"]);
    expect(progress.segments[1].timeText).toBe("—");
    expect(progress.segments[2].timeText).toBe("15:00 23/12");
  });

  it("từ chối (dữ liệu cũ): hai đoạn đầu dừng, 3 đoạn sau chưa tới, chi tiết chỉ hai cột", () => {
    const progress = deriveTurnProgress(
      turn({
        status: "DECLINED",
        invitationSentAt: SENT,
        decidedAt: APPROVED,
        documentApprovedAt: APPROVED,
      }),
    );
    expect(states(progress)).toEqual(["done", "stopped", "pending", "pending", "pending"]);
    expect(progress.group).toBe("declined");
    expect(progress.headline).toBe("Đã từ chối nhận");
    expect(progress.detail).toBe("người nhận từ chối nhận tài sản");
    expect(progress.detailColumns.map((column) => column.label)).toEqual([
      "Đã mời",
      "Từ chối nhận",
    ]);
    expect(progress.detailColumns[1].timeText).toBe("15:00 23/12");
  });

  it.each(["DECISION_EXPIRED", "CANCELLED", "LAPSED"])(
    "%s: lượt kết thúc, không bàn giao",
    (status) => {
      const progress = deriveTurnProgress(turn({ status, invitationSentAt: SENT }));
      expect(progress.group).toBe("ended");
      expect(progress.headline).toBe("Lượt đã kết thúc");
      expect(progress.needsAction).toBe(false);
      expect(progress.detailColumns).toHaveLength(2);
    },
  );

  it("không có chữ eKYC hay hạn chót ở bất kỳ trạng thái nào", () => {
    const statuses = [
      "INVITED",
      "INITIAL_RESPONSE_EXPIRED",
      "IDENTITY_IN_PROGRESS",
      "READY_TO_ACCEPT",
      "HANDOVER_COMMITTED",
      "DECLINED",
      "DECISION_EXPIRED",
      "CANCELLED",
      "LAPSED",
    ];
    for (const status of statuses) {
      const progress = deriveTurnProgress(turn({ status, invitationSentAt: SENT }));
      const text = [
        progress.headline,
        progress.detail,
        progress.chip,
        ...progress.segments.map((segment) => `${segment.label} ${segment.timeText}`),
      ].join(" ");
      expect(text).not.toMatch(/eKYC|xác minh|hạn|còn \d|quá hạn/i);
    }
  });
});

describe("sortTurnRows và countTurns", () => {
  const done = turn({
    turnId: "00000000-0000-4000-8000-000000000001",
    status: "HANDOVER_COMMITTED",
    invitationSentAt: SENT,
    keyVerifiedAt: KEY,
    downloadedItems: 3,
    receivedAllAt: RECEIVED,
    receiptExecutorSignedAt: RECEIVED,
  });
  const declined = turn({ turnId: "00000000-0000-4000-8000-000000000002", status: "DECLINED" });
  const waiting = turn({
    turnId: "00000000-0000-4000-8000-000000000003",
    invitationSentAt: SENT,
  });
  const action = turn({
    turnId: "00000000-0000-4000-8000-000000000004",
    status: "HANDOVER_COMMITTED",
    invitationSentAt: SENT,
    decidedAt: APPROVED,
  });
  const waiting2 = turn({
    turnId: "00000000-0000-4000-8000-000000000005",
    invitationSentAt: SENT,
  });

  it("xếp: cần bạn làm, đang chờ người nhận, đã nhận xong, từ chối; cùng nhóm giữ thứ tự cũ", () => {
    const rows = sortTurnRows([done, declined, waiting, action, waiting2]);
    expect(rows.map((row) => row.turn.turnId.slice(-1))).toEqual(["4", "3", "5", "1", "2"]);
  });

  it("đếm theo nhóm cho bốn ô số", () => {
    expect(countTurns([done, declined, waiting, action, waiting2])).toEqual({
      total: 5,
      done: 1,
      action: 1,
      waiting: 2,
      declined: 1,
      ended: 0,
    });
  });
});
